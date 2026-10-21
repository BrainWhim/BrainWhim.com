/* BrainWhim Parlor Kit — shared behaviour for every live game room (pair with parlor-kit.css).
   A game page only supplies: its board (inside the element passed as `stage`), its rules text,
   and a few callbacks. The kit supplies: intro card, seat choice, daily-limit gate, side cards,
   floating phone bar, rules window, result window, points for signed-in accounts, board-set picker.

   Parlor.init({
     game:'othello', title:'…', tagline:'…', bg:'photo.jpg', home:'tables.html',
     players:[{name:'You', color:'#2d5084'}, {name:'The House', color:'#f3e6c4'}],
     rules:{play:'<ol>…</ol>', score:'<ul>…</ul>'},
     sets:[{id:'cobalt', name:'Cobalt · Ivory', need:0, dots:['#2d5084','#f3e6c4']}, …],
     stage: element,
     onNew: function(){ … start a fresh game … }
   })
   Then the game calls: Parlor.status(main, sub) · Parlor.score([a,b]) · Parlor.turn(0|1|-1)
                        Parlor.finish('win'|'lose'|'draw', 'detail text') · Parlor.seatOnline(info)           */
(function () {
  "use strict";
  var P = window.Parlor = {};
  var C = null, mode = "house", seated = false, token = null, finished = false, started = 0;
  var GAMES = [];
  var el = {}, accountInfo = { pts: 0, member: false, user: null };

  function $(s, r) { return (r || document).querySelector(s); }
  function mk(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; }
  function sb() { try { return window.BW && BW.client && BW.client(); } catch (e) { return null; } }

  /* ---------------- building the page ---------------- */
  function build() {
    document.body.classList.add("pk");
    if (C.bg) document.body.style.setProperty("--pk-bg", 'url("' + C.bg + '")');

    var room = $(".pk-room");
    /* game switcher (glass rectangle, same as chess) */
    GAMES = [["checkers","Checkers","checkers.html"],["chess","Chess","chess.html"],["backgammon","Backgammon","backgammon.html"],["yahtzee","Yahtzee","yahtzee.html"],["dominoes","Dominoes","dominoes.html"],["othello","Othello","othello.html"],["mancala","Mancala","mancala.html"],["cribbage","Cribbage","cribbage.html"],["shutbox","Shut the Box","shutbox.html"],["morris","Morris","morris.html"]];
    var sw = mk("nav", "pk-games");
    GAMES.forEach(function (g) { var a = mk("a", g[0] === C.game ? "on" : "", g[1]); a.href = g[2]; sw.appendChild(a); });
    room.appendChild(sw);
    /* phones: scroll the switcher so the current game is in view */
    setTimeout(function () { var on = sw.querySelector(".on"); if (on && sw.scrollWidth > sw.clientWidth) sw.scrollLeft = on.offsetLeft - (sw.clientWidth - on.offsetWidth) / 2; }, 0);
    /* invitation (before sitting): a slim card just under the switcher */
    var intro = mk("section", "pk-intro"), card = mk("div", "pk-introcard");
    var txt = mk("div", "pk-introtxt");
    /* one sentence per line on phones, one line on desktop */
    var tag = mk("p", "pk-tag");
    String(C.invite || C.tagline || "").split(/(?<=[.!?])\s+/).forEach(function (part, i) { if (i) tag.appendChild(document.createTextNode(" ")); tag.appendChild(mk("span", "", part)); });
    txt.appendChild(tag);
    card.appendChild(txt);
    card.appendChild(btn("Take a Seat", "", function () { P.openSeat(); }, "pkSit"));
    intro.appendChild(card); room.appendChild(intro);

    /* playing area */
    var play = mk("div", "pk-play");
    var left = mk("aside", "pk-side pk-left"), right = mk("aside", "pk-side pk-right");
    var stage = mk("section", "pk-stage");
    if (C.stage) stage.appendChild(C.stage);
    stage.appendChild(mk('div'));  /* mini scoreboard goes here, below */
    play.appendChild(left); play.appendChild(stage); play.appendChild(right);
    room.appendChild(play);
    el.stage = stage; el.left = left; el.right = right;

    /* left: status + players + account + sets */
    var st = mk("div", "pk-card");
    st.appendChild(mk("h3", "", "Table"));
    el.status = mk("p", "pk-status", "Take your seat"); el.sub = mk("p", "pk-sub", "");
    st.appendChild(el.status); st.appendChild(el.sub);
    el.players = mk("div", "pk-players");
    (C.players || []).forEach(function (p, i) {
      var r = mk("div", "pk-pl"); var sw = mk("span", "sw"); sw.style.background = p.color || "#999";
      var nm = mk("span", "nm", p.name), sc = mk("span", "sc", "0");
      r.appendChild(sw); r.appendChild(nm); r.appendChild(sc); el.players.appendChild(r);
      p._row = r; p._nm = nm; p._sc = sc;
    });
    /* phones: the opponent's score sits above the board and yours below it */
    el.miniTop = mk("div", "pk-mini pk-mini-top"); el.mini = mk("div", "pk-mini pk-mini-bot");
    (C.players || []).forEach(function (p) {
      var r = mk("div", "pk-pl"); var sw = mk("span", "sw"); sw.style.background = p.color || "#999";
      var nm = mk("span", "nm", p.name), sc = mk("span", "sc", "0");
      r.appendChild(sw); r.appendChild(nm); r.appendChild(sc); p._row2 = r; p._nm2 = nm; p._sc2 = sc;
    });
    stage.replaceChild(el.mini, stage.lastChild);
    stage.insertBefore(el.miniTop, stage.firstChild);
    P.mySeat(0);
    st.appendChild(el.players);
    left.appendChild(st);

    el.acct = mk("div", "pk-card pk-acct");
    left.appendChild(el.acct);

    if (C.sets && C.sets.length) {
      var sc = mk("div", "pk-card"); el.setsCard = sc; sc.appendChild(mk("h3", "", C.setsLabel || "Sets"));
      el.sets = mk("div", "pk-sets"); sc.appendChild(el.sets); left.appendChild(sc);
    }

    /* right: actions */
    /* the menu: three groups, the same on desktop and in the phone sheet ("My Seat" shows on phones,
       where the left card is tucked away; on desktop that card is always in view) */
    var ac = mk("div", "pk-card pk-menu");
    function group(title, cls) { var g = mk("div", "pk-group" + (cls ? " " + cls : "")); g.appendChild(mk("h3", "", title)); var l = mk("div", "pk-actions"); g.appendChild(l); ac.appendChild(g); return l; }
    var g1 = group("This Game");
    el.newBtn = btn("New Game", "", function () { P.newGame(); });
    g1.appendChild(el.newBtn);
    g1.appendChild(btn("How to Play", "", function () { P.help("play"); }));
    g1.appendChild(btn("Scoring Rules", "", function () { P.help("score"); }));
    var g2 = group("My Seat", "pk-phone");
    if (C.sets && C.sets.length) g2.appendChild(btn(C.setsLabel || "Sets", "", function () { sheet("left", el.setsCard); }));
    g2.appendChild(btn("Account & Points", "", function () { sheet("left", el.acct); }));
    el.clubBtn = btn("Join the Club", "", function () { if (accountInfo.member && window.bwMemberCard) { sheet(null); bwMemberCard(accountInfo.pts); } else location.href = "member.html"; });
    g2.appendChild(el.clubBtn);
    var g3 = group("Leave");
    g3.appendChild(btn("Back to the Room", "", function () { P.stand(); }));
    g3.appendChild(btn("Switch Game", "", function () { P.games(); }));
    var tb = mk("a", "pk-btn", "Tables"); tb.href = C.home || "tables.html"; g3.appendChild(tb);
    right.appendChild(ac);
    el.mode = mk("p", "pk-sub", ""); ac.appendChild(el.mode);

    /* floating bar (phones) */
    var bar = mk("div", "pk-bar");
    el.menuBtn = btn("☰ Menu", "", function () { hint(false); sheet("right"); });
    bar.appendChild(el.menuBtn);
    el.bstat = mk("button", "pk-bstat"); el.bstat.type = "button"; el.bstat.onclick = function () { sheet("left"); };
    bar.appendChild(el.bstat);
    bar.appendChild(btn("New Game", "primary", function () { P.newGame(); }));
    document.body.appendChild(bar);
    var scrim = mk("div", "pk-scrim"); scrim.onclick = function () { sheet(null); }; document.body.appendChild(scrim);

    /* modals */
    el.help = modal("pkHelp"); el.seat = modal("pkSeat"); el.end = modal("pkEnd"); el.gamesM = modal("pkGames");
    el.hint = mk("div", "pk-hint", "Tap Menu for rules, sets, your account and more.");
    el.hint.onclick = function () { hint(false); }; document.body.appendChild(el.hint);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") { closeAll(); sheet(null); } });
    P.status("Take your seat", "");
  }
  function btn(label, cls, fn, id) {
    var b = mk("button", "pk-btn" + (cls ? " " + cls : ""), label); b.type = "button"; if (id) b.id = id; b.onclick = fn; return b;
  }
  function modal(id) {
    var v = mk("div", "pk-veil"); v.id = id; var m = mk("div", "pk-modal"); v.appendChild(m);
    v.addEventListener("click", function (e) { if (e.target === v && id !== "pkEnd") v.classList.remove("on"); });
    document.body.appendChild(v); return { veil: v, box: m };
  }
  /* one-time pointer to the Menu button on phones */
  function hint(show) {
    if (!el.hint) return;
    if (show) {
      if (store("bwMenuHint") || !window.matchMedia("(max-width:999px)").matches) return;
      el.hint.classList.add("on"); setTimeout(function () { hint(false); }, 7000);
    } else if (el.hint.classList.contains("on")) { el.hint.classList.remove("on"); store("bwMenuHint", "1"); }
  }
  /* Switch Game: every room in one list */
  P.games = function () {
    sheet(null);
    var b = el.gamesM.box; b.innerHTML = "";
    b.appendChild(mk("p", "pk-kick", "Switch Game"));
    var list = mk("div", "pk-gamelist");
    GAMES.forEach(function (g) { var a = mk("a", "pk-btn" + (g[0] === C.game ? " on" : ""), g[1]); a.href = g[2]; list.appendChild(a); });
    b.appendChild(list);
    var r = mk("div", "pk-row"); r.appendChild(btn("Close", "quiet", function () { el.gamesM.veil.classList.remove("on"); })); b.appendChild(r);
    el.gamesM.veil.classList.add("on");
  };
  function closeAll() { [el.help, el.seat, el.end, el.gamesM].forEach(function (m) { if (m) m.veil.classList.remove("on"); }); }
  function sheet(which, focus) {
    document.body.classList.toggle("sheet-left", which === "left");
    document.body.classList.toggle("sheet-right", which === "right");
    if (focus && focus.scrollIntoView) setTimeout(function () { focus.scrollIntoView({ block: "start", behavior: "smooth" }); }, 260);
  }
  P.sheet = sheet;

  /* ---------------- status, score, turn ---------------- */
  P.status = function (main, sub) {
    if (!el.status) return;
    el.status.textContent = main || ""; el.sub.textContent = sub || "";
    el.bstat.innerHTML = "<span></span><small></small>";
    el.bstat.firstChild.textContent = main || ""; el.bstat.lastChild.textContent = sub || "";
  };
  P.score = function (arr) { (C.players || []).forEach(function (p, i) { if (arr && arr[i] != null) { if (p._sc) p._sc.textContent = arr[i]; if (p._sc2) p._sc2.textContent = arr[i]; } }); };
  P.turn = function (i) { (C.players || []).forEach(function (p, k) { if (p._row) { p._row.classList.toggle("turn", k === i); p._row2.classList.toggle("turn", k === i); } }); };
  /* which player row is "me" (0 or 1): mine goes under the board on phones */
  P.mySeat = function (i) {
    var pl = C.players || []; if (pl.length < 2 || !el.mini) return;
    var me = pl[i ? 1 : 0], them = pl[i ? 0 : 1];
    el.miniTop.innerHTML = ""; el.mini.innerHTML = "";
    el.miniTop.appendChild(them._row2); el.mini.appendChild(me._row2);
  };
  P.names = function (arr) { (C.players || []).forEach(function (p, i) { if (arr && arr[i] && p._nm) { p._nm.textContent = arr[i]; p._nm2.textContent = arr[i]; } }); };

  /* ---------------- help ---------------- */
  P.help = function (kind) {
    sheet(null);
    var score = kind === "score";
    el.help.box.innerHTML = "<h2>" + (score ? "Scoring Rules" : "How to Play") + "</h2>" + ((C.rules && C.rules[kind]) || "") +
      (score ? "<ul><li>Playing <b>The House</b> earns points for any account: 2 for a win, 1 for a draw (3 games a day count; Club members get more).</li><li>Playing <b>people online</b> moves your rating more, based on who you beat.</li></ul>" : "");
    var r = mk("div", "pk-row"); r.appendChild(btn("Got it", "", function () { el.help.veil.classList.remove("on"); }));
    el.help.box.appendChild(r); el.help.veil.classList.add("on");
  };

  /* ---------------- sitting down ---------------- */
  P.openSeat = function () {
    var b = el.seat.box; b.innerHTML = "";
    b.appendChild(mk("p", "pk-kick", "Take your seat"));
    var s = mk("div", "pk-stack");
    s.appendChild(btn("Play vs. The House", "", function () { el.seat.veil.classList.remove("on"); P.sitHouse(); }));
    s.appendChild(btn("Match an Online Player", "", function () { location.href = (C.home || "tables.html") + "?match=" + encodeURIComponent(C.game); }));
    var f = mk("div", "pk-field"), inv = mk("input"); inv.placeholder = "Enter friend's public name..."; inv.maxLength = 20;
    var sendB = btn("Send Invite", "", function () {
      var n = (inv.value || "").trim(); if (!n) { inv.focus(); return; }
      location.href = (C.home || "tables.html") + "?invite=" + encodeURIComponent(n) + "&game=" + encodeURIComponent(C.game);
    });
    f.appendChild(inv); f.appendChild(sendB); s.appendChild(f);
    s.appendChild(btn("Close", "quiet", function () { el.seat.veil.classList.remove("on"); }));
    b.appendChild(s); el.seat.veil.classList.add("on");
  };
  async function gateAndBegin() {
    /* guests get 10 free games, then a prompt to make a free account; signed-in players are unlimited */
    if (window.BW) { var ok = await BW.startMatch({ mode: "house" }); if (!ok) return false; }
    token = null;
    try {
      var c = sb(), u = window.BW && BW.user && BW.user();
      if (c && u) { var r = await c.rpc("bw_house_begin", { p_game: C.game }); if (r && r.data && r.data.ok) token = r.data.token; }
    } catch (e) {}
    started = Date.now(); finished = false; return true;
  }
  P.sitHouse = async function () {
    if (!(await gateAndBegin())) return;
    mode = "house"; seat();
    el.mode.textContent = "Playing The House";
    if (C.onNew) C.onNew("house");
  };
  /* online rooms: the daily limit was already applied on the Tables page when the match was made */
  P.seatOnline = function (info) {
    mode = "online"; seat(); token = null; finished = false;
    el.mode.textContent = (info && info.label) || "Online table";
    if (el.newBtn) el.newBtn.style.display = "none";
    var nb = $(".pk-bar .pk-btn.primary"); if (nb) nb.style.display = "none";
  };
  function seat() { seated = true; document.body.classList.add("seated"); sheet(null); window.scrollTo(0, 0); setTimeout(function () { hint(true); }, 900); }
  P.stand = function () { seated = false; document.body.classList.remove("seated"); sheet(null); };
  P.newGame = async function () {
    if (mode === "online") return;
    closeAll(); sheet(null);
    if (!(await gateAndBegin())) return;
    if (C.onNew) C.onNew("house");
  };
  P.mode = function () { return mode; };

  /* ---------------- result ---------------- */
  P.finish = async function (kind, detail) {
    if (finished) return; finished = true;
    var title = kind === "win" ? "Congratulations! You win!" : kind === "draw" ? "It's a Draw" : "Better Luck Next Time";
    var b = el.end.box; b.innerHTML = "";
    b.appendChild(mk("p", "pk-kick", kind === "win" ? "Victory" : kind === "draw" ? "Even match" : "Game over"));
    b.appendChild(mk("h2", "", title));
    if (detail) b.appendChild(mk("p", "pk-pts", detail));
    var pts = mk("p", "pk-pts", ""); b.appendChild(pts);
    var r = mk("div", "pk-row");
    if (mode === "house") r.appendChild(btn("Play again?", "", function () { el.end.veil.classList.remove("on"); P.newGame(); }));
    var back2 = mk("a", "pk-btn", "Return to Tables"); back2.href = C.home || "tables.html"; r.appendChild(back2);
    b.appendChild(r); el.end.veil.classList.add("on");

    if (mode !== "house") return;                       /* online results are scored by the room itself */
    var u = window.BW && BW.user && BW.user();
    if (!u) {                                           /* guests: invite them to keep their points */
      pts.textContent = "Create a free account to earn points from every game.";
      var cb = btn("Create Account", "", function () { BW.openAuth({ reason: "Earn points and unlock sets." }); }); cb.style.margin = "8px 0 0"; b.insertBefore(cb, r);
      return;
    }
    if (!token) { pts.textContent = ""; return; }
    try {
      var res = await sb().rpc("bw_house_finish", { p_token: token, p_result: kind });
      var d = res && res.data;
      if (d && d.ok && d.awarded > 0) { pts.textContent = "+" + d.awarded + " point" + (d.awarded > 1 ? "s" : "") + " added to your account"; pts.classList.add("good"); accountInfo.pts += d.awarded; renderAccount(); renderSets(); }
      else if (d && d.ok && d.capped) pts.textContent = "You've reached today's House points. Play people online to keep climbing.";
      else if (d && d.ok && kind !== "lose") pts.textContent = "Games under 45 seconds don't earn points.";
    } catch (e) {}
    token = null;
  };

  /* ---------------- account card + sets ---------------- */
  async function loadAccount() {
    var u = window.BW && BW.user && BW.user();
    accountInfo.user = u || null;
    var p = (window.BW && BW.profile && BW.profile()) || {};
    accountInfo.pts = Number(p.skill_points || 0); accountInfo.member = !!p.member; accountInfo.name = p.display_name || p.username || "";
    renderAccount(); renderSets();
  }
  function renderAccount() {
    var a = el.acct; if (!a) return; a.innerHTML = "<h3 style=\"margin:0 0 8px;font-size:11px;letter-spacing:.16em;text-transform:uppercase;opacity:.85\">Account</h3>";
    var t = mk("div"); a.appendChild(t);
    if (accountInfo.user) {
      t.innerHTML = "<b>" + esc(accountInfo.name || "Player") + "</b><br>" + accountInfo.pts + " points" + (accountInfo.member ? " · Club member" : "");
      if (el.clubBtn) el.clubBtn.textContent = accountInfo.member ? "Club Details" : "Join the Club";
      if (!accountInfo.member) a.appendChild(btn("Join the Club", "", function () { location.href = "member.html"; }));
    } else {
      t.textContent = "Playing as a guest. Create a free account to earn points and unlock sets.";
      a.appendChild(btn("Create Free Account", "", function () { if (window.BW) BW.openAuth({ reason: "Earn points and unlock sets." }); }));
    }
  }
  function setAllowed(s) { return !s.need || accountInfo.member || accountInfo.pts >= s.need; }
  function renderSets() {
    if (!el.sets) return; el.sets.innerHTML = "";
    var cur = store("bwSet:" + C.game) || C.sets[0].id;
    if (!C.sets.some(function (s) { return s.id === cur && setAllowed(s); })) cur = C.sets[0].id;
    document.body.setAttribute("data-set", cur);
    C.sets.forEach(function (s) {
      var ok = setAllowed(s);
      var b = mk("button", "pk-set" + (s.id === cur ? " on" : "") + (ok ? "" : " lock")); b.type = "button";
      var dots = mk("span", "dots"); (s.dots || []).forEach(function (c) { var i = mk("i"); i.style.background = c; dots.appendChild(i); });
      var nm = mk("span", "nm"); nm.appendChild(document.createTextNode(s.name + (ok ? "" : " 🔒")));
      var sm = mk("small", "", ok ? (s.need ? "Unlocked" : "Starter set") : (s.need + " points, or join the Club")); nm.appendChild(sm);
      b.appendChild(dots); b.appendChild(nm);
      b.onclick = function () {
        if (!ok) { location.href = "member.html"; return; }
        store("bwSet:" + C.game, s.id); renderSets();
      };
      el.sets.appendChild(b);
    });
  }

  /* ---------------- start ---------------- */
  P.init = function (cfg) {
    C = cfg;
    function go() {
      build();
      if (window.BW && BW.onChange) BW.onChange(loadAccount); else loadAccount();
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go); else go();
  };
})();
