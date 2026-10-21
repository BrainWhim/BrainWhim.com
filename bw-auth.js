/* BrainWhim shared sign-in. One modal, no redirects. Load in <head> on every page:
   <script src="bw-auth.js"></script>
   Public API (window.BW):
     openAuth({reason, allowGuest, state})  -> Promise {ok, guest, sent}
     requireSession(reason)                 -> Promise session|null
     startMatch({mode:"house"|"online"})    -> Promise true|false  (guests: 10 free games, then a free account; signed-in players are unlimited)
     guestWin()                             -> soft sign-up prompt after a guest win
     onChange(cb), user(), profile(), member(), signOut(), client(), settled(), toast(text, {label, onClick})
*/
(function () {
  "use strict";
  if (window.BW) return;

  var LIMIT = 10;   /* free games for a guest on this device, then a free account keeps them playing */
  var CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
  var HASH = location.hash || "";
  var HASH_RECOVERY = /(^|[#&])type=recovery/.test(HASH);
  var HASH_ERROR = /(^|[#&])error(_code|_description)?=/.test(HASH);
  /* Pages check this flag before they erase the #hash, so recovery tokens survive until Supabase reads them. */
  window.BW_AUTH_HASH = HASH_RECOVERY || HASH_ERROR || /(^|[#&])access_token=/.test(HASH);
  try { if (HASH_RECOVERY) sessionStorage.setItem("bwRecovery", "1"); } catch (e) {}

  var S = { sb: null, user: null, session: null, profile: null, ready: false, listeners: [], loadedFor: null,
            recoveryShown: false, pending: null, ui: null, state: "start", kind: "", ident: "", opts: {}, firstRes: null };
  S.settledP = new Promise(function (res) { S.firstRes = res; });

  /* ---------- small helpers ---------- */
  function flag(k, v) {
    try { if (v === undefined) return sessionStorage.getItem(k); if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) {}
    return null;
  }
  function dayStamp() { try { return new Date().toLocaleDateString("en-CA"); } catch (e) { return new Date().toISOString().slice(0, 10); } }
  function cleanName(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20); }
  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement("script"); s.src = src; s.async = true;
      s.onload = res; s.onerror = function () { rej(new Error("Could not load " + src)); };
      document.head.appendChild(s);
    });
  }
  function classify(raw) {
    var v = String(raw || "").trim();
    if (!v) return { kind: "", value: "" };
    if (v.indexOf("@") > -1) return { kind: "email", value: v.toLowerCase() };
    if (/^\+?[\d\s().-]{7,}$/.test(v)) {
      var d = v.replace(/\D/g, "");
      if (v.charAt(0) === "+") return { kind: "phone", value: "+" + d };
      if (d.length === 10) return { kind: "phone", value: "+1" + d };
      if (d.length === 11 && d.charAt(0) === "1") return { kind: "phone", value: "+" + d };
      return { kind: "phone", value: "+" + d };
    }
    return { kind: "username", value: cleanName(v) };
  }
  function friendly(e) {
    var m = String((e && e.message) || e || "Something went wrong.");
    var l = m.toLowerCase();
    if (l.indexOf("invalid login") > -1) return "That password doesn't match. Try again, or use Forgot password.";
    if (l.indexOf("not confirmed") > -1) return "This account still needs its email confirmed. Check your inbox (and spam).";
    if (l.indexOf("rate limit") > -1 || l.indexOf("security purposes") > -1 || (e && e.status === 429)) return "Too many tries. Wait a minute and try again.";
    if (l.indexOf("already registered") > -1 || l.indexOf("already been registered") > -1) return "That account already exists. Log in instead.";
    if (l.indexOf("at least") > -1 && l.indexOf("character") > -1) return "Password needs at least 8 characters.";
    if (l.indexOf("sms") > -1 || l.indexOf("phone provider") > -1 || l.indexOf("unsupported phone") > -1) return "Phone sign-in isn't switched on yet. Use your email for now.";
    if (l.indexOf("token has expired") > -1 || l.indexOf("invalid") > -1 && l.indexOf("otp") > -1) return "That code didn't work or has expired. Request a new one.";
    if (l.indexOf("failed to fetch") > -1 || l.indexOf("network") > -1) return "Can't reach the server. Check your connection.";
    return m;
  }

  /* ---------- Supabase client ---------- */
  function cfg() { return window.BW_PLAY || null; }
  function client() {
    if (window.__bwSb) { S.sb = window.__bwSb; attach(); return S.sb; }
    var c = cfg();
    if (!window.supabase || !c || !c.url || !c.anonKey) return null;
    window.__bwSb = S.sb = window.supabase.createClient(c.url, c.anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
    attach();
    return S.sb;
  }
  function ensure() {
    var c = client();
    if (c) return Promise.resolve(c);
    var p = Promise.resolve();
    if (!cfg()) p = p.then(function () { return loadScript("play-config.js"); });
    if (!window.supabase) p = p.then(function () { return loadScript(CDN); });
    return p.then(function () {
      var c2 = client();
      if (!c2) throw new Error("Sign-in isn't configured on this page.");
      return c2;
    });
  }
  var attached = false;
  function attach() {
    if (attached || !S.sb) return;
    attached = true;
    /* Never await Supabase calls inside this callback (it can deadlock). Hand off to the next tick. */
    S.sb.auth.onAuthStateChange(function (event, session) {
      setTimeout(function () { onAuth(event, session); }, 0);
    });
    S.sb.auth.getSession().then(function (r) { if (!S.ready) onAuth("INITIAL_SESSION", r.data.session); });
  }
  function onAuth(event, session) {
    var u = session && session.user ? session.user : null;
    /* Old anonymous guest sessions are retired: guests are now tracked locally, not in the database. */
    if (u && u.is_anonymous) {
      try { S.sb.auth.signOut({ scope: "local" }); } catch (e) {}
      u = null; session = null;
    }
    S.session = session; S.user = u;
    var recovering = event === "PASSWORD_RECOVERY" || (flag("bwRecovery") === "1" && u && (event === "INITIAL_SESSION" || event === "SIGNED_IN"));
    if (event === "SIGNED_OUT") { flag("bwRecovery", null); S.profile = null; S.loadedFor = null; }
    var done = function () {
      S.ready = true;
      if (S.firstRes) { S.firstRes(); S.firstRes = null; }
      notify(event);
      if (recovering && u && !S.recoveryShown) { S.recoveryShown = true; flag("bwRecovery", "1"); openAuth({ state: "recovery" }); }
    };
    if (u && S.loadedFor !== u.id) {
      loadProfile(u).then(done, done);
    } else done();
  }
  function loadProfile(u) {
    S.loadedFor = u.id;
    return S.sb.from("profiles").select("username,display_name,skill_points,member,online_day,online_count").eq("id", u.id).maybeSingle()
      .then(function (r) { S.profile = (r && r.data) || {}; return S.profile; }, function () { S.profile = {}; });
  }
  function snapshot(event) {
    return { event: event || "", user: S.user, profile: S.profile, member: !!(S.profile && S.profile.member), ready: S.ready };
  }
  function notify(event) {
    S.listeners.forEach(function (cb) { try { cb(snapshot(event)); } catch (e) { console.error(e); } });
  }
  function settled() {
    return ensure().then(function () {
      return Promise.race([S.settledP, new Promise(function (r) { setTimeout(r, 4000); })]);
    }, function () {});
  }

  /* ---------- toast ---------- */
  function toast(text, action) {
    injectCss();
    var old = document.getElementById("bwa-toast"); if (old) old.remove();
    var t = document.createElement("div"); t.id = "bwa-toast"; t.className = "bwa-toast"; t.setAttribute("role", "status");
    var sp = document.createElement("span"); sp.textContent = text; t.appendChild(sp);
    if (action && action.label) {
      var b = document.createElement("button"); b.type = "button"; b.textContent = action.label;
      b.onclick = function () { t.remove(); if (action.onClick) action.onClick(); };
      t.appendChild(b);
    }
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add("on"); });
    setTimeout(function () { t.classList.remove("on"); setTimeout(function () { t.remove(); }, 300); }, action ? 9000 : 4500);
  }

  /* ---------- CSS ---------- */
  var cssDone = false;
  function injectCss() {
    if (cssDone) return; cssDone = true;
    var css = [
      ".bwa-ov{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(6,10,22,.62);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);opacity:0;transition:opacity .25s}",
      ".bwa-ov.on{opacity:1}",
      ".bwa-card{width:min(400px,100%);max-height:calc(100dvh - 32px);overflow:auto;background:rgba(14,22,44,.97);color:#fff;border:1px solid rgba(201,166,107,.5);border-radius:18px;padding:22px 20px 16px;box-shadow:0 24px 60px rgba(0,0,0,.5);font-family:Montserrat,system-ui,sans-serif;transform:translateY(12px) scale(.98);transition:transform .3s cubic-bezier(.2,.8,.2,1),opacity .3s}",
      ".bwa-ov.on .bwa-card{transform:none}",
      ".bwa-ov.out{opacity:0}.bwa-ov.out .bwa-card{transform:translateY(8px) scale(.94);opacity:0}",
      ".bwa-card h2{margin:0 0 4px;font-size:20px;font-weight:700}",
      ".bwa-sub{margin:0 0 14px;color:rgba(255,255,255,.75);font-size:13px;line-height:1.45;min-height:0}",
      ".bwa-rv{display:grid;grid-template-rows:0fr;opacity:0;transition:grid-template-rows .3s ease,opacity .25s ease}",
      ".bwa-rv.open{grid-template-rows:1fr;opacity:1}",
      ".bwa-rv>.bwa-in{min-height:0;overflow:hidden}",
      ".bwa-rv>.bwa-in>.bwa-pad{padding:3px 4px 9px}",
      ".bwa-rv:not(.open) input,.bwa-rv:not(.open) button{visibility:hidden}",
      ".bwa-card label{display:block;font-size:12px;font-weight:600;color:rgba(255,255,255,.8);margin:0 0 5px}",
      ".bwa-card input{width:100%;box-sizing:border-box;min-height:46px;padding:11px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.08);color:#fff;font-family:inherit;font-size:16px;outline:none}",
      ".bwa-card input:focus{border-color:#C9A66B;box-shadow:0 0 0 3px rgba(201,166,107,.25)}",
      ".bwa-pw{position:relative}.bwa-pw input{padding-right:62px}",
      ".bwa-eye{position:absolute;right:6px;top:50%;transform:translateY(-50%);min-height:34px;padding:0 10px;border:0;border-radius:8px;background:transparent;color:#C9A66B;font:inherit;font-size:12px;font-weight:700;cursor:pointer}",
      ".bwa-err{min-height:18px;margin:2px 0 8px;font-size:12.5px;color:#f6c37a}",
      ".bwa-go{width:100%;min-height:48px;border:0;border-radius:12px;background:linear-gradient(135deg,#C9A66B,#e3c98f);color:#1A2744;font-family:inherit;font-size:15px;font-weight:800;cursor:pointer;box-shadow:0 6px 14px -5px rgba(201,166,107,.45);transition:transform .15s,filter .2s,opacity .2s}",
      ".bwa-go:hover{filter:brightness(1.06)}.bwa-go:active{transform:scale(.98)}.bwa-go[disabled]{opacity:.6;cursor:wait}",
      ".bwa-links{display:flex;flex-direction:column;align-items:center;gap:2px;margin-top:8px}",
      ".bwa-link{border:0;background:none;color:rgba(255,255,255,.82);font-family:inherit;font-size:13px;text-decoration:underline;cursor:pointer;min-height:36px;padding:0 8px}",
      ".bwa-link[hidden]{display:none}",
      ".bwa-toast{position:fixed;left:50%;bottom:calc(24px + env(safe-area-inset-bottom));transform:translate(-50%,16px);z-index:2147483001;display:flex;align-items:center;gap:12px;flex-wrap:wrap;justify-content:center;max-width:min(440px,calc(100vw - 24px));padding:12px 16px;border-radius:16px;background:rgba(14,22,44,.97);color:#fff;font-family:Montserrat,system-ui,sans-serif;font-weight:500;font-size:13.5px;line-height:1.45;border:1px solid rgba(201,166,107,.5);box-shadow:0 14px 34px rgba(0,0,0,.4);opacity:0;pointer-events:none;transition:opacity .25s,transform .25s}",
      ".bwa-toast.on{opacity:1;transform:translate(-50%,0);pointer-events:auto}",
      ".bwa-toast button{min-height:36px;padding:0 14px;border:0;border-radius:10px;background:#C9A66B;color:#1A2744;font-family:inherit;font-weight:800;font-size:13px;cursor:pointer}",
      "@media (prefers-reduced-motion:reduce){.bwa-ov,.bwa-card,.bwa-rv,.bwa-toast{transition:none}}"
    ].join("\n");
    var st = document.createElement("style"); st.id = "bwa-css"; st.textContent = css; document.head.appendChild(st);
  }

  /* ---------- modal ---------- */
  function rv(id, inner, open) {
    return '<div class="bwa-rv' + (open ? " open" : "") + '" id="' + id + '"><div class="bwa-in"><div class="bwa-pad">' + inner + "</div></div></div>";
  }
  function pwField(id, label, auto) {
    return '<label for="' + id + '">' + label + '</label><div class="bwa-pw"><input id="' + id + '" type="password" autocomplete="' + auto + '" autocapitalize="off" spellcheck="false"><button type="button" class="bwa-eye" data-eye="' + id + '" aria-label="Show password" aria-pressed="false">Show</button></div>';
  }
  function build() {
    injectCss();
    var ov = document.createElement("div"); ov.className = "bwa-ov"; ov.id = "bwa-ov";
    ov.innerHTML =
      '<div class="bwa-card" role="dialog" aria-modal="true" aria-labelledby="bwa-title">' +
      '<h2 id="bwa-title">Welcome to BrainWhim</h2><p class="bwa-sub" id="bwa-sub"></p>' +
      '<form id="bwa-form" novalidate>' +
      rv("bwa-idw", '<label for="bwa-id">Email, phone, or username</label><input id="bwa-id" type="text" autocomplete="username" autocapitalize="off" autocorrect="off" spellcheck="false" inputmode="email">', true) +
      rv("bwa-pwd", pwField("bwa-pass", "Enter password", "current-password")) +
      rv("bwa-unw", '<label for="bwa-un">Choose username</label><input id="bwa-un" type="text" autocomplete="nickname" autocapitalize="off" autocorrect="off" spellcheck="false" maxlength="20">') +
      rv("bwa-npw", pwField("bwa-newpass", "Create password", "new-password")) +
      rv("bwa-cdw", '<label for="bwa-otp">6-digit code</label><input id="bwa-otp" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="8">') +
      rv("bwa-rcw", pwField("bwa-recpass", "New password", "new-password")) +
      '<p class="bwa-err" id="bwa-err" role="alert" aria-live="polite"></p>' +
      '<button class="bwa-go" id="bwa-go" type="submit">Continue</button>' +
      "</form>" +
      '<div class="bwa-links">' +
      '<button type="button" class="bwa-link" id="bwa-forgot" hidden>Forgot password?</button>' +
      '<button type="button" class="bwa-link" id="bwa-sms" hidden>Text me a code instead</button>' +
      '<button type="button" class="bwa-link" id="bwa-alt" hidden></button>' +
      '<button type="button" class="bwa-link" id="bwa-guest" hidden>Play as guest</button>' +
      '<button type="button" class="bwa-link" id="bwa-close">Not now</button>' +
      "</div></div>";
    document.body.appendChild(ov);
    var $ = function (id) { return ov.querySelector("#" + id); };
    var ui = S.ui = {
      ov: ov, card: ov.firstChild, title: $("bwa-title"), sub: $("bwa-sub"), form: $("bwa-form"), err: $("bwa-err"), go: $("bwa-go"),
      id: $("bwa-id"), pass: $("bwa-pass"), un: $("bwa-un"), newpass: $("bwa-newpass"), otp: $("bwa-otp"), recpass: $("bwa-recpass"),
      forgot: $("bwa-forgot"), sms: $("bwa-sms"), alt: $("bwa-alt"), guest: $("bwa-guest"), close: $("bwa-close"),
      rv: { id: $("bwa-idw"), pw: $("bwa-pwd"), un: $("bwa-unw"), np: $("bwa-npw"), cd: $("bwa-cdw"), rc: $("bwa-rcw") }
    };
    ov.addEventListener("mousedown", function (e) { if (e.target === ov && S.state !== "recovery") finish({ ok: false }); });
    ov.addEventListener("keydown", function (e) { if (e.key === "Escape" && S.state !== "recovery") finish({ ok: false }); });
    ov.querySelectorAll("[data-eye]").forEach(function (b) {
      b.onclick = function () {
        var inp = ov.querySelector("#" + b.getAttribute("data-eye")); var show = inp.type === "password";
        inp.type = show ? "text" : "password"; b.textContent = show ? "Hide" : "Show";
        b.setAttribute("aria-pressed", show ? "true" : "false"); b.setAttribute("aria-label", show ? "Hide password" : "Show password");
      };
    });
    ui.form.addEventListener("submit", function (e) { e.preventDefault(); go(); });
    ui.id.addEventListener("input", function () {
      if (["login", "register", "code", "forgot"].indexOf(S.state) > -1) { setState("start"); }
      setErr("");
    });
    ui.forgot.onclick = function () { setErr(""); setState("forgot"); };
    ui.sms.onclick = function () { sendCode(false); };
    ui.alt.onclick = function () {
      setErr("");
      if (S.state === "login") { if (S.kind === "username") { setErr("To create an account, enter an email or phone number first."); setState("start"); } else setState("register"); }
      else if (S.state === "register" || S.state === "forgot" || S.state === "code") setState("login");
    };
    ui.guest.onclick = function () { finish({ ok: false, guest: true }); };
    ui.close.onclick = function () { finish({ ok: false }); };
    return ui;
  }
  function setErr(m) { if (S.ui) S.ui.err.textContent = m || ""; }
  function busy(b) { if (!S.ui) return; S.ui.go.disabled = !!b; }
  function setState(st) {
    var ui = S.ui; S.state = st;
    var open = { id: 1, pw: 0, un: 0, np: 0, cd: 0, rc: 0 };
    var title = "Welcome to BrainWhim", btn = "Continue";
    var f = false, sms = false, alt = "";
    if (st === "start") { /* only the single input */ }
    else if (st === "login") { open.pw = 1; btn = "Login"; title = "Welcome back"; f = true; sms = S.kind === "phone"; alt = "New here? Create an account"; }
    else if (st === "register") { open.un = 1; open.np = 1; btn = "Create account"; title = "Create your free account"; alt = "Already have an account? Log in"; }
    else if (st === "forgot") { btn = "Send Secure Access Link"; title = "Reset your password"; alt = "Back to log in"; }
    else if (st === "code") { open.cd = 1; btn = "Verify"; title = "Enter your code"; alt = "Back"; }
    else if (st === "recovery") { open.id = 0; open.rc = 1; btn = "Save new password"; title = "Choose a new password"; }
    else if (st === "name") { open.id = 0; open.un = 1; btn = "Save username"; title = "Pick your username"; }
    ui.title.textContent = title; ui.go.textContent = btn;
    Object.keys(open).forEach(function (k) { ui.rv[k].classList.toggle("open", !!open[k]); });
    ui.forgot.hidden = !f; ui.sms.hidden = !sms; ui.alt.hidden = !alt; ui.alt.textContent = alt;
    ui.guest.hidden = !(S.opts.allowGuest && st !== "recovery" && st !== "name");
    ui.close.hidden = st === "recovery";
    ui.close.textContent = st === "name" ? "Later" : "Not now";
    var focusEl = { start: ui.id, login: ui.pass, register: ui.un, forgot: null, code: ui.otp, recovery: ui.recpass, name: ui.un }[st];
    if (focusEl) setTimeout(function () { try { focusEl.focus({ preventScroll: true }); } catch (e) {} }, 140);
  }

  function openAuth(opts) {
    opts = opts || {};
    if (S.pending) return S.pending.promise;
    S.opts = opts;
    var ui = build();
    var res; var promise = new Promise(function (r) { res = r; });
    S.pending = { promise: promise, resolve: res };
    S.kind = ""; S.ident = "";
    ui.sub.textContent = opts.reason || (opts.state === "recovery" ? "You're signed in from your reset link. Set a new password to finish." : "Sign in or create a free account. It only takes a moment.");
    document.documentElement.style.overflow = "hidden";
    setState(opts.state || "start");
    requestAnimationFrame(function () { requestAnimationFrame(function () { ui.ov.classList.add("on"); }); });
    ensure().catch(function (e) { setErr(friendly(e)); });
    return promise;
  }
  function finish(result, note) {
    if (!S.pending) return;
    var p = S.pending, ui = S.ui;
    if (S.state === "recovery" && !(result && result.ok)) flag("bwRecovery", null);
    S.pending = null;
    ui.ov.classList.add("out");           /* smooth collapse */
    document.documentElement.style.overflow = "";
    setTimeout(function () { ui.ov.remove(); S.ui = null; if (note) toast(note); p.resolve(result || { ok: false }); }, 320);
  }

  /* ---------- actions ---------- */
  function rpc(name, args) { return S.sb.rpc(name, args); }
  async function go() {
    var ui = S.ui; if (!ui || ui.go.disabled) return;
    setErr(""); busy(true);
    try {
      await ensure();
      if (S.state === "start") await doStart();
      else if (S.state === "login") await doLogin();
      else if (S.state === "register") await doRegister();
      else if (S.state === "forgot") await doForgot();
      else if (S.state === "code") await doVerify();
      else if (S.state === "recovery") await doRecovery();
      else if (S.state === "name") await doName();
    } catch (e) { setErr(friendly(e)); }
    busy(false);
  }
  async function doStart() {
    var c = classify(S.ui.id.value);
    if (!c.kind || (c.kind === "username" && c.value.length < 3)) { setErr("Enter an email, a phone number, or a username."); return; }
    S.kind = c.kind; S.ident = c.value; S.ui.id.value = c.kind === "phone" ? c.value : S.ui.id.value.trim();
    var r = await rpc("bw_identity_status", { ident: c.value, kind: c.kind });
    if (r.error || !r.data) {
      /* Lookup function not installed yet: fall back to login with a visible "create account" link. */
      if (c.kind === "username") { setErr("Couldn't look that up. Try your email or phone."); return; }
      setState("login"); return;
    }
    if (r.data.exists) setState("login");
    else if (c.kind === "username") setErr("No account with that username. Enter an email or phone number to create one.");
    else setState("register");
  }
  async function doLogin() {
    var pw = S.ui.pass.value;
    if (!pw) { setErr("Enter your password."); return; }
    var args = { password: pw };
    if (S.kind === "email") args.email = S.ident;
    else if (S.kind === "phone") args.phone = S.ident;
    else {
      var l = await rpc("bw_login_email", { n: S.ident });
      if (l.error || !l.data) { setErr("Couldn't find that username. Try your email or phone."); return; }
      args.email = l.data;
    }
    var r = await S.sb.auth.signInWithPassword(args);
    if (r.error) { setErr(friendly(r.error)); return; }
    S.user = r.data.user; S.session = r.data.session;
    finish({ ok: true, user: r.data.user });
  }
  function validNew() {
    var un = cleanName(S.ui.un.value), pw = S.ui.newpass.value;
    if (un.length < 3) { setErr("Username needs 3 or more letters or numbers."); return null; }
    if (pw.length < 8) { setErr("Password needs at least 8 characters."); return null; }
    return { un: un, pw: pw };
  }
  async function doRegister() {
    var v = validNew(); if (!v) return;
    var free = await rpc("bw_username_free", { n: v.un });
    if (!free.error && free.data === false) { setErr("That username is taken. Try another."); return; }
    if (S.kind === "phone") { S.reg = v; await sendCode(true); return; }
    var r = await S.sb.auth.signUp({ email: S.ident, password: v.pw, options: { data: { username: v.un, display_name: v.un } } });
    if (r.error) { setErr(friendly(r.error)); return; }
    if (!r.data.session) { finish({ ok: false, sent: true }, "Account created. Check " + S.ident + " to confirm it, then log in."); return; }
    await saveProfile(r.data.user, v.un);
    S.user = r.data.user; S.session = r.data.session; S.loadedFor = null;
    finish({ ok: true, user: r.data.user });
  }
  async function saveProfile(user, un) {
    var r = await S.sb.from("profiles").upsert({ id: user.id, username: un, display_name: un });
    if (r.error) throw r.error;
    S.profile = Object.assign(S.profile || {}, { username: un, display_name: un });
  }
  async function sendCode(isNew) {
    setErr(""); busy(true);
    try {
      await ensure();
      var o = { phone: S.ident };
      if (isNew && S.reg) o.options = { shouldCreateUser: true, data: { username: S.reg.un, display_name: S.reg.un } };
      else o.options = { shouldCreateUser: false };
      var r = await S.sb.auth.signInWithOtp(o);
      if (r.error) { setErr(friendly(r.error)); busy(false); return; }
      S.otpNew = !!isNew; setState("code");
      S.ui.sub.textContent = "We texted a code to " + S.ident + ".";
    } catch (e) { setErr(friendly(e)); }
    busy(false);
  }
  async function doVerify() {
    var tok = S.ui.otp.value.replace(/\s/g, "");
    if (tok.length < 4) { setErr("Enter the code from the text message."); return; }
    var r = await S.sb.auth.verifyOtp({ phone: S.ident, token: tok, type: "sms" });
    if (r.error) { setErr(friendly(r.error)); return; }
    if (S.otpNew && S.reg) {
      var up = await S.sb.auth.updateUser({ password: S.reg.pw });
      if (up.error) { setErr(friendly(up.error)); return; }
      await saveProfile(r.data.user, S.reg.un);
      S.reg = null;
    }
    S.user = r.data.user; S.session = r.data.session; S.loadedFor = null;
    finish({ ok: true, user: r.data.user });
  }
  async function doForgot() {
    var email = S.ident, c = classify(S.ui.id.value);
    if (c.kind) { S.kind = c.kind; S.ident = c.value; email = c.value; }
    if (!S.kind) { setErr("Enter your email, phone, or username above first."); return; }
    if (S.kind === "phone") { await sendCode(false); return; }
    if (S.kind === "username") {
      var l = await rpc("bw_login_email", { n: S.ident });
      if (l.error || !l.data) { setErr("Couldn't find that username. Try your email."); return; }
      email = l.data;
    }
    var r = await S.sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + "/index.html" });
    if (r.error) { setErr(friendly(r.error)); return; }
    finish({ ok: false, sent: true }, "Secure link sent. Check your inbox (and spam).");
  }
  async function doRecovery() {
    var pw = S.ui.recpass.value;
    if (pw.length < 8) { setErr("Password needs at least 8 characters."); return; }
    var r = await S.sb.auth.updateUser({ password: pw });
    if (r.error) { setErr(friendly(r.error)); return; }
    flag("bwRecovery", null);
    finish({ ok: true, user: S.user }, "Password updated. You're signed in.");
  }
  async function doName() {
    var un = cleanName(S.ui.un.value);
    if (un.length < 3) { setErr("Username needs 3 or more letters or numbers."); return; }
    var free = await rpc("bw_username_free", { n: un });
    if (!free.error && free.data === false) { setErr("That username is taken. Try another."); return; }
    await saveProfile(S.user, un);
    notify("PROFILE");
    finish({ ok: true, user: S.user });
  }

  /* ---------- match limits ---------- */
  function guestUsed() {
    try { var g = JSON.parse(localStorage.getItem("bwGuestGames") || "{}"); return g.n || 0; } catch (e) { return 0; }
  }
  function guestBump() { try { localStorage.setItem("bwGuestGames", JSON.stringify({ n: guestUsed() + 1 })); } catch (e) {} }
  function localUserUsed(id) {
    try { var g = JSON.parse(localStorage.getItem("bwUserMatches:" + id) || "{}"); return g.d === dayStamp() ? (g.n || 0) : 0; } catch (e) { return 0; }
  }
  function localUserBump(id) { try { localStorage.setItem("bwUserMatches:" + id, JSON.stringify({ d: dayStamp(), n: localUserUsed(id) + 1 })); } catch (e) {} }
  function upsell(text) {
    toast(text, { label: "Join the Club", onClick: function () { location.href = "member.html"; } });
  }
  async function startMatch(o) {
    o = o || {}; var mode = o.mode === "online" ? "online" : "house";
    await settled();
    if (!S.user) {
      if (mode === "online") {
        var a = await openAuth({ reason: "Playing other people needs a free account. It takes a few seconds." });
        if (!a.ok) return false;
      } else {
        if (guestUsed() >= LIMIT) {
          var b = await openAuth({ reason: "You've played your " + LIMIT + " free guest games. Create a free account to keep playing: unlimited games, and your points are saved." });
          if (!b.ok) return false;
        } else { guestBump(); return true; }
      }
    }
    return true;   /* signed-in players (free or Club) play without a daily limit (decided Oct 20, 2026) */
    var r = await rpc("bw_consume_match", {});
    if (!r.error && r.data) {
      if (r.data.member || r.data.ok) return true;
      upsell("You've played " + LIMIT + " matches today. Join the Club for unlimited play.");
      return false;
    }
    /* Server function missing: fall back to a local counter so the site still works. */
    if (localUserUsed(S.user.id) >= LIMIT) { upsell("You've played " + LIMIT + " matches today. Join the Club for unlimited play."); return false; }
    localUserBump(S.user.id); return true;
  }
  function guestWin() {
    if (S.user) return;
    toast("Create a free account to save your points to the leaderboard, or progress will be lost.", { label: "Create account", onClick: function () { openAuth({ reason: "Save your points to the leaderboard." }); } });
  }
  async function requireSession(reason) {
    await settled();
    if (S.user && S.session) return S.session;
    var r = await openAuth({ reason: reason });
    if (!r.ok) return null;
    var s = await S.sb.auth.getSession();
    return s.data.session || null;
  }
  async function signOut() {
    try { await ensure(); await S.sb.auth.signOut(); } catch (e) {}
    S.user = null; S.session = null; S.profile = null; S.loadedFor = null; notify("SIGNED_OUT");
  }

  /* ---------- public API ---------- */
  window.BW = {
    openAuth: openAuth, closeAuth: function () { finish({ ok: false }); },
    requireSession: requireSession, startMatch: startMatch, guestWin: guestWin, toast: toast,
    onChange: function (cb) { S.listeners.push(cb); if (S.ready) setTimeout(function () { try { cb(snapshot("INIT")); } catch (e) {} }, 0); else settled().then(function () { if (S.ready) try { cb(snapshot("INIT")); } catch (e) {} }); },
    user: function () { return S.user; }, profile: function () { return S.profile; }, member: function () { return !!(S.profile && S.profile.member); },
    signOut: signOut, client: client, settled: settled, guestMatchesLeft: function () { return Math.max(0, LIMIT - guestUsed()); }
  };

  /* ---------- boot ---------- */
  function hasStoredSession() {
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (/^sb-.*-auth-token$/.test(k)) return true; } } catch (e) {}
    return false;
  }
  function boot() {
    if (HASH_ERROR) {
      var q = HASH.toLowerCase();
      try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
      if (q.indexOf("expired") > -1 || q.indexOf("invalid") > -1 || q.indexOf("error") > -1) {
        openAuth({ state: "forgot", reason: "That link expired or was already used. Request a fresh one." });
      }
    }
    if (window.supabase || HASH_RECOVERY || /access_token=/.test(HASH) || hasStoredSession()) {
      ensure().catch(function () { if (S.firstRes) { S.firstRes(); S.firstRes = null; } });
    }
    /* Existing accounts without a username get asked once per session, never while a recovery is in progress. */
    S.settledP.then(function () {
      if (S.user && S.profile && !S.profile.username && !S.pending && !flag("bwRecovery") && !flag("bwAskedName")) {
        flag("bwAskedName", "1"); openAuth({ state: "name", reason: "Pick the username friends will use to find you." });
      }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
