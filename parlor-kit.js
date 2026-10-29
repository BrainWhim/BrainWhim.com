/* BrainWhim Parlor Kit — shared behaviour for every live game room (pair with parlor-kit.css).
   A game page only supplies: its board (inside the element passed as `stage`), its rules text,
   and a few callbacks. The kit supplies: intro card, seat choice, daily-limit gate, side cards,
   floating phone bar, rules window, result window, points for signed-in accounts, board-set picker.

   Parlor.init({
     game:'othello',  whim:true (optional: the Tap for Whims card), title:'…', tagline:'…', bg:'photo.jpg', home:'lobby.html',
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
  /* the rooms in each category (the switcher bar and Switch Game). A card room without a page yet shows dimmed
     ("Opening Soon"); give it its page when the room is built. cat:"cards" in Parlor.init picks the card list (Oct 26). */
  var BOARD_GAMES = [["checkers","Checkers","checkers.html"],["chess","Chess","chess.html"],["backgammon","Backgammon","backgammon.html"],["yahtzee","Yahtzee","yahtzee.html"],["dominoes","Dominoes","dominoes.html"],["othello","Othello","othello.html"],["mancala","Mancala","mancala.html"],["cribbage","Cribbage","cribbage.html"],["shutbox","Shut the Box","shutbox.html"],["morris","Morris","morris.html"]];
  var CARD_GAMES = [["solitaire","Solitaire","solitaire.html"],["ginrummy","Gin Rummy","ginrummy.html"],["hearts","Hearts","hearts.html"],["spades","Spades","spades.html"],["euchre","Euchre","euchre.html"],["crazyeights","Crazy Eights","crazyeights.html"],["canasta","Canasta","canasta.html"],["pinochle","Pinochle","pinochle.html"],["freecell","FreeCell","freecell.html"],["bridge","Bridge","bridge.html"],["cribbage","Cribbage","cribbage.html"]];
  function gameLink(g, cls) {
    if (!g[2]) { var x = mk("span", "soon" + (cls ? " " + cls : ""), g[1]); x.title = "Opening soon"; return x; }
    var a = mk("a", cls, g[1]); a.href = g[2]; return a;
  }
  var el = {}, accountInfo = { pts: 0, member: false, user: null };

  function $(s, r) { return (r || document).querySelector(s); }
  function mk(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; }
  function sb() { try { return window.BW && BW.client && BW.client(); } catch (e) { return null; } }

  /* ---------------- building the page ---------------- */
  function build() {
    document.body.classList.add("pk");
    if (window.BWAvatar) document.body.classList.add("pk-avatars");
    if (C.bg) document.body.style.setProperty("--pk-bg", 'url("' + C.bg + '")');

    var room = $(".pk-room");
    /* game switcher (glass rectangle, same as chess) */
    GAMES = C.cat === "cards" ? CARD_GAMES : BOARD_GAMES;
    if (C.solo) document.body.classList.add("pk-solo");
    var sw = mk("nav", "pk-games");
    GAMES.forEach(function (g) { sw.appendChild(gameLink(g, g[0] === C.game ? "on" : "")); });
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
    intro.appendChild(card);
    el.yours = mk("div", "pk-yours"); el.yours.hidden = true; intro.appendChild(el.yours);   /* "Your Chess game with judy is still open" (Oct 24) */
    room.appendChild(intro);

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
      var nm = mk("span", "nm", seatName(p.name)), sc = mk("span", "sc", "0"), av = mk("span", "av bwa-av");   /* avatar (Oct 26) */
      r.appendChild(av); r.appendChild(sw); r.appendChild(nm); r.appendChild(sc); el.players.appendChild(r);
      p._row = r; p._nm = nm; p._sc = sc; p._av = av;
    });
    /* phones: the opponent's score sits above the board and yours below it */
    el.miniTop = mk("div", "pk-mini pk-mini-top"); el.mini = mk("div", "pk-mini pk-mini-bot");
    (C.players || []).forEach(function (p) {
      var r = mk("div", "pk-pl"); var sw = mk("span", "sw"); sw.style.background = p.color || "#999";
      var nm = mk("span", "nm", seatName(p.name)), sc = mk("span", "sc", "0"), av = mk("span", "av bwa-av");
      r.appendChild(av); r.appendChild(sw); r.appendChild(nm); r.appendChild(sc); p._row2 = r; p._nm2 = nm; p._sc2 = sc; p._av2 = av;
    });
    stage.replaceChild(el.mini, stage.lastChild);
    stage.insertBefore(el.miniTop, stage.firstChild);
    P.mySeat(0);
    st.appendChild(el.players);
    el.info = mk("p", "pk-sub pk-info", ""); st.appendChild(el.info);   /* a game's own line, e.g. "Hand 3 · first to 100 points" */
    el.level = mk("p", "pk-sub pk-level", ""); st.appendChild(el.level);
    left.appendChild(st);

    el.acct = mk("div", "pk-card pk-acct");
    left.appendChild(el.acct);

    /* the BrainWhim "Tap for Whims" card (same as the Lobby page): bottom of the left card on desktop in every room,
       and (with whim:true) on phones between the header and the opponent's score, filling the spare space on wide boards (turned on with whim:true) */
    if (C.whim) {
      stage.insertBefore(whimCard("pk-whim-m"), stage.firstChild);   /* phones: above the opponent's score; the board sits low, near the bar */
      document.body.classList.add("pk-has-whim");
    }

    if (C.sets && C.sets.length) {
      var sc = mk("div", "pk-card"); el.setsCard = sc; sc.appendChild(mk("h3", "", C.setsLabel || "Sets"));
      el.sets = mk("div", "pk-sets"); sc.appendChild(el.sets); left.appendChild(sc);
    }
    left.appendChild(whimCard("pk-whim-desk"));
    if (window.MutationObserver) new MutationObserver(function () { fitSoon(); }).observe(left, { childList: true, subtree: true, characterData: true });   /* every room, desktop: last, so it settles at the bottom of the card (whim:true adds the phone card too) */

    /* right: actions */
    /* the menu: three groups, the same on desktop and in the phone sheet ("My Seat" shows on phones,
       where the left card is tucked away; on desktop that card is always in view) */
    var ac = mk("div", "pk-card pk-menu");
    function group(title, cls) { var g = mk("div", "pk-group" + (cls ? " " + cls : "")); g.appendChild(mk("h3", "", title)); var l = mk("div", "pk-actions"); g.appendChild(l); ac.appendChild(g); return l; }
    var g1 = group("This Game");
    el.newBtn = btn("New Game", "", function () { P.newGame(); });
    g1.appendChild(el.newBtn);
    el.forfeitBtn = btn(C.partners ? "Leave the Game" : "Forfeit Game", "", function () { P.forfeit(); }); el.forfeitBtn.style.display = "none";   /* online, once both players are seated */
    g1.appendChild(el.forfeitBtn);
    if (C.learn) { el.learnBtn = btn("Learn to Play", "", function () { P.sitLearn(); }); g1.appendChild(el.learnBtn); }
    g1.appendChild(btn("How to Play", "", function () { P.help("play"); }));
    g1.appendChild(btn("Scoring Rules", "", function () { P.help("score"); }));
    g1.appendChild(btn("Sound & Motion", "", function () { P.settings(); }));
    var g2 = group("My Seat", "pk-phone");
    if (C.sets && C.sets.length) g2.appendChild(btn(C.setsLabel || "Sets", "", function () { sheet("left", el.setsCard); }));
    g2.appendChild(btn("Avatar", "", function () { sheet(null); if (window.BWAvatar) BWAvatar.studio(); }));
    g2.appendChild(btn("Account & Points", "", function () { sheet("left", el.acct); }));
    el.clubBtn = btn("Join the Club", "", function () { if (accountInfo.member && window.bwMemberCard) { sheet(null); bwMemberCard(accountInfo.pts); } else location.href = "member.html"; });
    g2.appendChild(el.clubBtn);
    var g3 = group("Leave");
    g3.appendChild(btn("Back to the Room", "", function () { P.stand(); }));
    g3.appendChild(btn("Switch Game", "", function () { P.games(); }));
    var tb = mk("a", "pk-btn", "Lobby"); tb.href = C.home || "lobby.html"; g3.appendChild(tb);
    el.coach = mk("div", "pk-coach"); el.coach.hidden = true; document.body.appendChild(el.coach);   /* Learn to Play (Oct 24) */
    right.appendChild(ac);
    el.mode = mk("p", "pk-sub", ""); ac.appendChild(el.mode);

    /* floating bar (phones) */
    var bar = mk("div", "pk-bar");
    el.menuBtn = btn("☰ Menu", "", function () { hint(false); sheet(document.body.classList.contains("sheet-right") ? null : "right"); });
    bar.appendChild(el.menuBtn);
    el.bstat = mk("button", "pk-bstat"); el.bstat.type = "button"; el.bstat.onclick = function () { sheet(document.body.classList.contains("sheet-left") ? null : "left"); };
    bar.appendChild(el.bstat);
    bar.appendChild(btn("New Game", "primary", function () { P.newGame(); }));
    document.body.appendChild(bar);
    var scrim = mk("div", "pk-scrim"); scrim.onclick = function () { sheet(null); }; document.body.appendChild(scrim);
    scrim.addEventListener("touchmove", function (e) { if (e.cancelable) e.preventDefault(); }, { passive: false });   /* the page behind stays put */
    swipeSheets([left, right]);

    /* modals */
    el.help = modal("pkHelp"); el.seat = modal("pkSeat"); el.end = modal("pkEnd"); el.gamesM = modal("pkGames"); el.setM = modal("pkSet"); el.tblM = modal("pkTable");
    el.toast = mk("div", "pk-toast"); document.body.appendChild(el.toast);
    el.hint = mk("div", "pk-hint", "Tap Menu for rules, sets, your account and more.");
    el.hint.onclick = function () { hint(false); }; document.body.appendChild(el.hint);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") { closeAll(); sheet(null); } });
    P.status("Take your seat", "");
  }
  var WHIMS = ["Build something light enough to finish and strong enough to keep.","Catch the idea before it gets polite.","Some days need a system. Some days need a spark.","Your imagination called. It wants one small real step today.","A balanced life is part calculation, part daydream, part showing up.","Play is not the opposite of progress. Sometimes it is the path.","Turn the raw thought into a tool someone can actually use.","Do or do not. The small step counts."];
  function whimCard(cls) {
    var w = mk("button", "pk-whim " + cls); w.type = "button";
    w.appendChild(mk("span", "pk-whim-label", "✨ Tap for Whims"));
    var line = mk("span", "pk-whim-line", "A small spark, on purpose."); w.appendChild(line);
    w.onclick = function () { var n; do { n = WHIMS[Math.floor(Math.random() * WHIMS.length)]; } while (n === line.textContent && WHIMS.length > 1); document.querySelectorAll(".pk-whim-line").forEach(function (l) { l.textContent = n; }); };
    return w;
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
    GAMES.forEach(function (g) { var a = gameLink(g, "pk-btn" + (g[0] === C.game ? " on" : "")); if (!g[2]) a.appendChild(mk("small", "", "Opening Soon")); list.appendChild(a); });
    b.appendChild(list);
    var r = mk("div", "pk-row"); r.appendChild(btn("Close", "quiet", function () { el.gamesM.veil.classList.remove("on"); })); b.appendChild(r);
    el.gamesM.veil.classList.add("on");
  };
  /* phones: the menu and table cards slide up from the bottom. Like the Lobby's drawers (Judy, Oct 26), pull one down
     (by its handle, near its top, or anywhere once it's scrolled to the top) or flick it to close it; the page behind
     doesn't move. A tap is still a tap: nothing moves until the finger has travelled a few pixels. */
  function swipeSheets(list) {
    list.forEach(function (dr) {
      var h = mk("div", "pk-handle"); h.setAttribute("aria-hidden", "true"); h.appendChild(mk("span")); dr.insertBefore(h, dr.firstChild);
      var y0 = 0, y1 = 0, t0 = 0, drag = false, moved = false;
      dr.addEventListener("touchstart", function (e) {
        if (window.innerWidth >= 1000 || !e.touches || e.touches.length !== 1) { drag = false; return; }
        var top = dr.getBoundingClientRect().top, y = e.touches[0].clientY;
        y0 = y1 = y; t0 = Date.now(); moved = false;
        drag = y - top < 64 || !!(e.target.closest && e.target.closest(".pk-handle")) || dr.scrollTop <= 0;
      }, { passive: true });
      dr.addEventListener("touchmove", function (e) {
        if (!drag) return;
        y1 = e.touches[0].clientY; var dy = y1 - y0;
        if (dy < 0 && !moved) { drag = false; return; }          /* moving up: an ordinary scroll of the card */
        if (dy > 6 || moved) { moved = true; if (e.cancelable) e.preventDefault(); dr.style.transition = "none"; dr.style.transform = "translateY(" + Math.max(0, dy) + "px)"; }
      }, { passive: false });
      function end() {
        if (!drag) return; drag = false;
        var dy = y1 - y0, dt = Math.max(1, Date.now() - t0);
        dr.style.transition = ""; dr.style.transform = "";
        if (moved && (dy > 56 || (dy > 28 && dy / dt > 0.45))) sheet(null);
      }
      dr.addEventListener("touchend", end); dr.addEventListener("touchcancel", end);
    });
  }
  function closeAll() { [el.help, el.seat, el.end, el.gamesM, el.setM, el.tblM].forEach(function (m) { if (m) m.veil.classList.remove("on"); }); }
  function sheet(which, focus) {
    document.body.classList.toggle("sheet-left", which === "left");
    document.body.classList.toggle("sheet-right", which === "right");
    if (focus && focus.scrollIntoView) setTimeout(function () { focus.scrollIntoView({ block: "start", behavior: "smooth" }); }, 260);
  }
  P.sheet = sheet;
  /* desktop: if the left card is taller than the window, tighten it a step or two (pk-tight, pk-tighter) so the
     Whim card at its bottom stays in view; re-checked when the window changes or the card's contents change */
  function fitLeft() {
    var L = $(".pk-left"), b = document.body; if (!L) return;
    b.classList.remove("pk-tight", "pk-tighter");
    if (window.innerWidth < 1000 || !seated) return;
    if (L.scrollHeight - L.clientHeight > 0) b.classList.add("pk-tight"); else return;
    if (L.scrollHeight - L.clientHeight > 0) b.classList.add("pk-tighter");
  }
  var fitT = 0; function fitSoon() { clearTimeout(fitT); fitT = setTimeout(fitLeft, 60); }
  P.fitLeft = fitSoon;
  window.addEventListener("resize", fitSoon);

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
    var pl = C.players || []; if (!el.mini) return;
    if (pl.length < 2) { if (pl[0]) { el.miniTop.innerHTML = ""; el.mini.innerHTML = ""; el.mini.appendChild(pl[0]._row2); } mine = 0; paintAv(); return; }
    var me = pl[i ? 1 : 0], them = pl[i ? 0 : 1]; mine = i ? 1 : 0;
    el.miniTop.innerHTML = ""; el.mini.innerHTML = "";
    el.miniTop.appendChild(them._row2); el.mini.appendChild(me._row2);
    paintAv();
  };
  /* ---------------- avatars (Oct 26) ----------------
     Each seat row shows a small avatar: yours, and The House's BW medallion or your online opponent's.
     Watchers see plain guest medallions. Drawn by bw-avatars.js; nothing shows if that file isn't loaded. */
  var mine = 0;
  function meProf() { var u = accountInfo.user; if (!u || u.is_anonymous) return null; return (window.BW && BW.profile && BW.profile()) || {}; }
  function oppProf() {
    if (mode !== "online") return "house";
    return (T && T.side && T.oppProf) || null;
  }
  function avFor(i) { if (mode === "online" && T && !T.side) return null; return i === mine ? meProf() : oppProf(); }
  function paintAv() {
    if (!window.BWAvatar || !C) return;
    (C.players || []).forEach(function (p, i) {
      if (i > 1) return; var who = avFor(i), nm = i === mine ? "You" : P.oppName(), pip = C.pip ? pipHtml(p.color) : "";
      if (p._av) p._av.innerHTML = BWAvatar.html(who, { size: 28, ring: false, charm: false, title: nm }) + pip;
      if (p._av2) p._av2.innerHTML = BWAvatar.html(who, { size: 24, ring: false, charm: false, title: nm }) + pip;
    });
    P.paintChips();
  }
  function pipHtml(c) { return c ? '<span class="pip" style="background:' + esc(c) + '"></span>' : ""; }
  /* a room's own slim score line (phones: Cribbage, Morris, Dominoes) puts Parlor.chip("me"|"opp", colour) where the
     avatar goes, then calls Parlor.paintChips() after filling the line */
  P.chip = function (who, colour) { return '<span class="pk-chip bwa-av" data-who="' + (who === "me" ? "me" : "opp") + '"' + (colour && C && C.pip ? ' data-pip="' + esc(colour) + '"' : "") + '></span>'; };
  P.paintChips = function () {
    if (!window.BWAvatar) return;
    [].forEach.call(document.querySelectorAll(".pk-chip"), function (c) {
      var me = c.getAttribute("data-who") === "me", who = avFor(me ? mine : 1 - mine);
      c.innerHTML = BWAvatar.html(who, { size: 22, ring: false, charm: false, title: me ? "You" : P.oppName() }) + pipHtml(c.getAttribute("data-pip"));
    });
  };
  P.paintAvatars = paintAv;
  /* the result window: both players' avatars with their rank rings */
  function duo() {
    if (!window.BWAvatar || (mode === "online" && T && !T.side)) return null;
    var d = mk("div", "pk-duo");
    function one(prof, name, sub) {
      var x = mk("div", "p"), a = mk("span", "bwa-av"); a.innerHTML = BWAvatar.html(prof, { size: 96, title: name, even: true }); x.appendChild(a);
      x.appendChild(mk("b", "", name)); if (sub) x.appendChild(mk("i", "", sub)); return x;
    }
    var m = meProf(), o = oppProf();
    if (C.partners && mode === "online") {   /* you and your partner against The House */
      d.appendChild(one(m, "You", m ? BWAvatar.rank(m.skill_points).name : "Guest"));
      d.appendChild(one(o && o !== "house" ? o : null, P.oppName(), o && o !== "house" ? BWAvatar.rank(o.skill_points).name : "Your partner"));
      d.appendChild(mk("span", "vs", "vs"));
      d.appendChild(one("house", "The House", ""));
      d.classList.add("trio"); return d;
    }
    d.appendChild(one(m, "You", m ? BWAvatar.rank(m.skill_points).name : "Guest"));
    d.appendChild(mk("span", "vs", "vs"));
    d.appendChild(one(o, P.oppName(), o && o !== "house" ? BWAvatar.rank(o.skill_points).name : (o === "house" ? "Level " + P.level() + " of " + P.maxLevel : "")));
    return d;
  }
  /* one-player rooms: just your avatar with its rank ring */
  function solo1() {
    if (!window.BWAvatar) return null;
    var d = mk("div", "pk-duo pk-duo1"), x = mk("div", "p"), a = mk("span", "bwa-av"), m = meProf();
    a.innerHTML = BWAvatar.html(m, { size: 96, title: "You", even: true }); x.appendChild(a);
    x.appendChild(mk("b", "", "You")); x.appendChild(mk("i", "", m ? BWAvatar.rank(m.skill_points).name : "Guest")); d.appendChild(x); return d;
  }
  window.addEventListener("bw-avatar", function () { renderAccount(); paintAv(); });
  /* the colour dot for player i (0 or 1) that's on screen right now: the phone score strip or the side card */
  P.seatDot = function (i) { var p = (C.players || [])[i]; if (!p) return null; var a = p._row2 && p._row2.querySelector(".sw"), b = p._row && p._row.querySelector(".sw"); if (a && a.offsetParent) return a; if (b && b.offsetParent) return b;
    var c = p._av2, d = p._av; return (c && c.offsetParent) ? c : (d && d.offsetParent ? d : null); };   /* with avatars the dot is hidden: pieces fly from the avatar (Oct 26) */
  P.info = function (text) { if (el.info) { el.info.textContent = text || ""; el.info.style.display = text ? "" : "none"; } };
  /* online, "Opponent" in a seat name becomes the other player's username once the kit knows it */
  P.names = function (arr) { (C.players || []).forEach(function (p, i) { if (arr && arr[i] && p._nm) { var n = seatName(String(arr[i])); if (T && T.oppName) n = n.replace(/^Opponent\b/, T.oppName); p._nm.textContent = n; p._nm2.textContent = n; } }); lastNames = arr; };
  /* with avatars, a seat is just avatar · name · score: "You (cobalt)" becomes "You"; games where both sides' pieces share
     the board (pip:true in Parlor.init) show the colour as a small pip on the avatar instead (Judy, Oct 26) */
  function seatName(n) { return window.BWAvatar ? n.replace(/\s*\([^)]*\)\s*$/, "") : n; }
  var lastNames = null;

  /* ---------------- help ---------------- */
  P.help = function (kind) {
    sheet(null);
    var score = kind === "score";
    el.help.box.innerHTML = "<h2>" + (score ? "Scoring Rules" : "How to Play") + "</h2>" + ((C.rules && C.rules[kind]) || "") +
      (score && C.solo ? "<ul><li>Every game you <b>win</b> earns 2 points for any account (3 games a day count; Club members get more).</li></ul>" : "") +
      (score && !C.solo ? "<ul><li>Playing <b>The House</b> earns points for any account: 2 for a win, 1 for a draw (3 games a day count; Club members get more).</li><li><b>The House grows with you.</b> It starts gentle and gets a little stronger each time you beat it. Lose twice in a row and it eases off a step.</li>" + (C.partners ? "<li>Playing <b>online with a partner</b>: the two of you are a team against The House, and a win earns House points for both of you.</li>" : "<li>Playing <b>people online</b> moves your rating more, based on who you beat.</li>") + "</ul>" : "");
    var r = mk("div", "pk-row"); r.appendChild(btn("Got it", "", function () { el.help.veil.classList.remove("on"); }));
    el.help.box.appendChild(r); el.help.veil.classList.add("on");
  };

  /* ---------------- sitting down ---------------- */
  /* the Lobby address with more on it: card rooms' home already has "?cat=cards", so join with "&" (Oct 26 fix) */
  function homeWith(q) { var h = C.home || "lobby.html"; return h + (h.indexOf("?") >= 0 ? "&" : "?") + q; }
  P.openSeat = function () {
    if (mode === "online" && !finished) { seat(); return; }   /* stood up from an online table: Take a Seat goes straight back to it */
    var b = el.seat.box; b.innerHTML = "";
    b.appendChild(mk("p", "pk-kick", "Take your seat"));
    var s = mk("div", "pk-stack");
    if (C.solo) {   /* one-player rooms (Solitaire, FreeCell): no House, no online table */
      s.appendChild(btn(C.dealLabel || "Deal a Game", "", function () { el.seat.veil.classList.remove("on"); P.sitHouse(); }));
      if (C.learn) s.appendChild(btn("Learn to Play", "", function () { el.seat.veil.classList.remove("on"); P.sitLearn(); }));
      s.appendChild(btn("Close", "quiet", function () { el.seat.veil.classList.remove("on"); }));
      b.appendChild(s); el.seat.veil.classList.add("on"); return;
    }
    if (C.partners) {   /* partnership rooms (Oct 28, Judy): people play together as partners against The House */
      var opt = function (label, sub, fn) { var o = mk("div", "pk-opt"); o.appendChild(btn(label, "", fn)); o.appendChild(mk("small", "", sub)); s.appendChild(o); return o; };
      opt("Play Solo vs. The House", "Practice your skills with three House players.", function () { el.seat.veil.classList.remove("on"); P.sitHouse(); });
      var tf = mk("div", "pk-field"), ti = mk("input"); ti.placeholder = "Your partner's public name..."; ti.maxLength = 20;
      var tsend = btn("Send Invite", "", function () { var n = (ti.value || "").trim(); if (!n) { ti.focus(); return; } location.href = homeWith("invite=" + encodeURIComponent(n) + "&game=" + encodeURIComponent(C.game)); });
      tf.appendChild(ti); tf.appendChild(tsend); tf.style.display = "none";
      var to = opt("Team Up with a Friend", "Invite a partner to sit across from you against The House.", function () { tf.style.display = tf.style.display === "none" ? "" : "none"; if (tf.style.display === "") ti.focus(); });
      to.appendChild(tf);
      opt("Match an Online Partner", "Quickly team up with another live player against The House.", function () { location.href = homeWith("match=" + encodeURIComponent(C.game)); });
      if (C.learn) opt("Learn to Play", "An interactive walkthrough of the rules and a guided practice game.", function () { el.seat.veil.classList.remove("on"); P.sitLearn(); });
      s.appendChild(btn("Close", "quiet", function () { el.seat.veil.classList.remove("on"); }));
      b.appendChild(s); el.seat.veil.classList.add("on"); return;
    }
    s.appendChild(btn("Play vs. The House", "", function () { el.seat.veil.classList.remove("on"); P.sitHouse(); }));
    if (C.learn) s.appendChild(btn("Learn to Play", "", function () { el.seat.veil.classList.remove("on"); P.sitLearn(); }));
    s.appendChild(btn("Match an Online Player", "", function () { location.href = homeWith("match=" + encodeURIComponent(C.game)); }));
    var f = mk("div", "pk-field"), inv = mk("input"); inv.placeholder = "Enter friend's public name..."; inv.maxLength = 20;
    var sendB = btn("Send Invite", "", function () {
      var n = (inv.value || "").trim(); if (!n) { inv.focus(); return; }
      location.href = homeWith("invite=" + encodeURIComponent(n) + "&game=" + encodeURIComponent(C.game));
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
    P.lessonOn = false; P.lessonWaiting = false;   /* leaving a lesson for a real game */
    P.coach(null); if (el.newBtn) el.newBtn.textContent = "New Game"; if (el.learnBtn) el.learnBtn.style.display = "";
    mode = "house"; seat(); paintAv();
    el.mode.textContent = C.solo ? (C.soloLabel || "Playing solo") : "Playing The House"; showLevel();
    if (C.onNew) C.onNew("house");
  };
  /* online rooms: the daily limit was already applied in the Lobby when the match was made */
  P.seatOnline = function (info) {
    P.lessonOn = false; P.lessonWaiting = false; if (el.coach) P.coach(null);
    mode = "online"; seat(); token = null; finished = false; if (el.level) el.level.textContent = ""; paintAv();
    if (C.partners) {   /* partners play The House together: each of them is scored like a House game */
      started = Date.now();
      (async function () { try { var c = sb(), u = window.BW && BW.user && BW.user(); if (c && u) { var r = await c.rpc("bw_house_begin", { p_game: C.game }); if (r && r.data && r.data.ok && mode === "online" && !finished) token = r.data.token; } } catch (e) {} })();
    }
    el.mode.textContent = (info && info.label) || "Online table";
    if (el.newBtn) el.newBtn.style.display = "none";
    var nb = $(".pk-bar .pk-btn.primary"); if (nb) nb.style.display = "none";
  };
  function seat() { seated = true; document.body.classList.add("seated"); sheet(null); window.scrollTo(0, 0); setTimeout(function () { hint(true); }, 900); fitSoon(); setTimeout(fitSoon, 700); }
  P.stand = function () {
    seated = false; document.body.classList.remove("seated"); sheet(null);
    var sit = $("#pkSit"); if (sit) sit.textContent = (mode === "online" && !finished) ? "Return to Your Table" : "Take a Seat";
  };
  P.newGame = async function () {
    if (mode === "online") return;
    if (mode === "learn") { closeAll(); sheet(null); finished = false; if (C.learn && C.learn.start) C.learn.start(); return; }
    closeAll(); sheet(null);
    if (!(await gateAndBegin())) return;
    if (C.onNew) C.onNew("house");
  };
  P.mode = function () { return mode; };

  /* ---------------- Learn to Play (Oct 24) ----------------
     A room opts in with learn:{start(), practice()} in Parlor.init. Learn mode is free for everyone: it doesn't use a
     guest game, earns no points and never moves The House's level; Parlor.skill() is gentle and fixed.
     The room drives the lesson with Parlor.coach({kick, title, text, buttons:[{label, fn, quiet}]}) and Parlor.coach(null).
     The coach card sits at the top of the right side card on desktop and floats at the top of the screen on phones. */
  P.sitLearn = function () {
    mode = "learn"; token = null; finished = false; seat(); closeAll(); paintAv();
    el.mode.textContent = "Learning to play"; showLevel();
    if (el.newBtn) { el.newBtn.textContent = "Start the Lesson Again"; el.newBtn.style.display = ""; }
    if (el.learnBtn) el.learnBtn.style.display = "none";
    if (C.learn && C.learn.start) C.learn.start();
  };
  var coachMin = false, coachH = -1;
  /* phones: --pk-coach-h on body = the floating coach card's height (0 when hidden); rooms that need the room re-fit on change */
  function coachSize() {
    requestAnimationFrame(function () {
      var c = el.coach, h = (c && !c.hidden && window.innerWidth < 1000 && c.parentNode === document.body) ? Math.ceil(c.getBoundingClientRect().bottom) + 6 : 0;
      document.body.style.setProperty("--pk-coach-h", h + "px");
      if (h !== coachH) { coachH = h; if (C && C.onCoachSize) C.onCoachSize(h); }
      requestAnimationFrame(function () { requestAnimationFrame(makeRoom); });
    });
  }
  /* phones: if the floating coach card covers the top of the playing area, move the playing area down below it and
     scale it to fit above the bottom bar (Judy, Oct 25: it hid the far side of chess, checkers and cribbage).
     A CSS transform on the stage, so taps, drags and floating pieces still line up. Rooms that already make room
     themselves (Yahtzee, Mancala) end up with nothing to do. */
  function makeRoom() {
    var st = el.stage; if (!st) return;
    st.style.transform = ""; st.style.transformOrigin = "";
    var c = el.coach, phone = window.innerWidth < 1000;
    if (!phone || !seated || !c || c.hidden || c.parentNode !== document.body || (C && C.onCoachSize)) return;   /* rooms with onCoachSize make their own room */
    var top = 1e9, bot = -1e9;
    [].forEach.call(st.children, function (k) { if (k.classList.contains("pk-whim")) return; if (!k.offsetParent && getComputedStyle(k).position !== "fixed") return; var r = k.getBoundingClientRect(); if (r.height < 2 || r.width < 2) return; top = Math.min(top, r.top); bot = Math.max(bot, r.bottom); });
    if (top > 1e8) return;
    var want = c.getBoundingClientRect().bottom + 8; if (top >= want) return;
    var bar = $(".pk-bar"), barR = bar && getComputedStyle(bar).display !== "none" ? bar.getBoundingClientRect() : null;   /* (fixed: no offsetParent) */
    var limit = (barR && barR.height ? barR.top : window.innerHeight) - 8;
    var k = Math.min(1, (limit - want) / Math.max(1, bot - top)), sr = st.getBoundingClientRect();
    st.style.transformOrigin = "50% " + Math.round(top - sr.top) + "px";
    st.style.transform = "translateY(" + Math.round(want - top) + "px) scale(" + k.toFixed(3) + ")";
  }
  window.addEventListener("resize", function () { if (el.coach && !el.coach.hidden) { coachSize(); } else if (el.stage && el.stage.style.transform) { el.stage.style.transform = ""; } });
  P.coachHeight = function () { return Math.max(0, coachH); };
  P.coach = function (o) {
    var c = el.coach; if (!c) return;
    if (!o) { c.hidden = true; document.body.classList.remove("pk-coaching"); if (el.stage) { el.stage.style.transform = ""; } coachSize(); return; }
    c.innerHTML = "";
    /* phones: a small button folds the card down to one line so the whole board shows; it stays folded until opened */
    var fold = mk("button", "pk-coachfold", coachMin ? "▾" : "▴"); fold.type = "button"; fold.setAttribute("aria-label", coachMin ? "Show the coach" : "Fold the coach away");
    fold.onclick = function (e) { e.stopPropagation(); coachMin = !coachMin; c.classList.toggle("min", coachMin); fold.textContent = coachMin ? "▾" : "▴"; c.classList.remove("news"); coachSize(); };
    c.appendChild(fold); c.classList.toggle("min", coachMin); if (coachMin) { c.classList.remove("news"); void c.offsetWidth; c.classList.add("news"); }
    if (o.kick) c.appendChild(mk("p", "pk-coachkick", o.kick));
    if (o.title) c.appendChild(mk("h3", "", o.title));
    if (o.text) { var t = mk("div", "pk-coachtxt"); t.innerHTML = o.text; c.appendChild(t); }   /* the room's own lesson text */
    if (o.buttons && o.buttons.length) {
      var r = mk("div", "pk-coachrow");
      o.buttons.forEach(function (b) { r.appendChild(btn(b.label, b.quiet ? "quiet" : "", b.fn)); });
      c.appendChild(r);
    }
    c.hidden = false; document.body.classList.add("pk-coaching");
    coachSize();
    var right = $(".pk-right"); if (right && window.innerWidth >= 1000 && c.parentNode !== right) right.insertBefore(c, right.firstChild);
    if (window.innerWidth < 1000 && c.parentNode !== document.body) document.body.appendChild(c);
  };
  /* the lesson flow, shared by every room (Oct 24). A room passes lesson:{steps, setup(k, step), practice(), hint()} to
     Parlor.init. steps (or a function returning them): [{title, text, done?}]; a step with `done` waits for the player's
     move: the room sets up that position in setup() and calls Parlor.lessonDone() when the move is made. Steps without
     `done` are look-and-read. The last step offers the practice game. Parlor.practiceSay(title, text) shows a practice tip
     with Hint and Back to the Lesson. */
  var LK = 0;
  /* on every lesson and practice card: leave the lesson and start a real game against The House (Judy, Oct 25) */
  function houseBtn() { return { label: "Play The House", quiet: true, fn: function () { P.lessonOn = false; P.lessonWaiting = false; P.coach(null); P.sitHouse(); } }; }
  P.houseBtn = houseBtn;
  function lessonSteps() { var L = C.lesson; return typeof L.steps === "function" ? L.steps() : L.steps; }
  P.lessonGo = function (k) {
    var L = C.lesson, steps = lessonSteps(), st = steps[k]; LK = k; P.lessonOn = true; P.lessonWaiting = !!st.done;
    if (L.setup) L.setup(k, st);
    var b = [], kick = "Learn to Play · " + (k + 1) + " of " + steps.length;
    if (k === steps.length - 1) { b.push({ label: "Start Practice Game", fn: P.startPractice }); if (k) b.push({ label: "Back", quiet: true, fn: function () { P.lessonGo(k - 1); } }); }
    else if (!st.done) { b.push({ label: "Next", fn: function () { P.lessonGo(k + 1); } }); b.push({ label: "Skip to a Practice Game", quiet: true, fn: P.startPractice }); }
    else { if (k) b.push({ label: "Back", quiet: true, fn: function () { P.lessonGo(k - 1); } }); b.push({ label: "Skip to a Practice Game", quiet: true, fn: P.startPractice }); }
    b.push(houseBtn());
    P.coach({ kick: kick, title: st.title, text: st.text, buttons: b });
    P.status(st.done ? "Your move" : "Learn to Play", st.done ? (st.sub || "Follow the glowing hint") : "");
  };
  P.lessonDone = function (extra) {
    var steps = lessonSteps(), st = steps[LK], k = LK; P.lessonWaiting = false;
    P.coach({ kick: "Learn to Play · " + (k + 1) + " of " + steps.length, title: st.title, text: (st.done || "") + (extra || ""),
      buttons: [{ label: "Next", fn: function () { P.lessonGo(k + 1); } }, { label: "Try Again", quiet: true, fn: function () { P.lessonGo(k); } }, houseBtn()] });
    P.status("Well done", "");
  };
  P.startPractice = function () {
    P.lessonOn = false; P.lessonWaiting = false; finished = false; closeAll();
    if (C.lesson && C.lesson.practice) C.lesson.practice();
  };
  P.practiceSay = function (title, text) {
    var b = [];
    if (C.lesson && C.lesson.hint) b.push({ label: "Hint", fn: function () { C.lesson.hint(); } });
    b.push({ label: "Back to the Lesson", quiet: true, fn: function () { P.lessonGo(0); } });
    b.push(houseBtn());
    P.coach({ kick: "Practice Game", title: title, text: text, buttons: b });
  };
  P.hintSay = function (text) { P.practiceSay("Try This", text); el.coach.querySelector(".pk-coachkick").textContent = "Practice Game · Hint"; };
  window.addEventListener("resize", function () { if (el.coach && !el.coach.hidden) { var r = $(".pk-right"), want = window.innerWidth >= 1000 ? r : document.body; if (want && el.coach.parentNode !== want) { if (want === r) r.insertBefore(el.coach, r.firstChild); else document.body.appendChild(el.coach); } } });

  /* ---------------- result ---------------- */
  P.finish = async function (kind, detail, heading) {
    if (finished) return; finished = true;
    if (el.forfeitBtn) el.forfeitBtn.style.display = "none";
    if (el.tblM) el.tblM.veil.classList.remove("on");
    P.sfx(kind === "win" ? "win" : kind === "lose" ? "lose" : "draw");
    var lvlNote = mode === "house" && !C.solo ? levelAfter(kind) : "";
    var title = heading || (kind === "win" ? "Congratulations! You win!" : kind === "draw" ? "It's a Draw" : "Better Luck Next Time");
    var b = el.end.box; b.innerHTML = "";
    b.appendChild(mk("p", "pk-kick", kind === "win" ? "Victory" : kind === "draw" ? "Even match" : "Game over"));
    b.appendChild(mk("h2", "", title));
    var dd = C.solo ? solo1() : duo(); if (dd) b.appendChild(dd);
    if (detail) b.appendChild(mk("p", "pk-pts", detail));
    if (lvlNote) b.appendChild(mk("p", "pk-lvlnote", lvlNote));
    var pts = mk("p", "pk-pts", ""); b.appendChild(pts);
    var r = mk("div", "pk-row");
    if (mode === "house") r.appendChild(btn(C.solo ? "Deal Again" : "Play again?", "", function () { el.end.veil.classList.remove("on"); P.newGame(); }));
    if (mode === "learn") {
      b.insertBefore(mk("p", "pk-lvlnote", C.solo ? "A practice game: no points." : "A practice game: no points, and The House's level doesn't change."), pts);
      r.appendChild(btn("Practice Again", "", function () { el.end.veil.classList.remove("on"); finished = false; if (C.learn.practice) C.learn.practice(); else C.learn.start(); }));
      r.appendChild(btn("Play The House", "", function () { el.end.veil.classList.remove("on"); P.coach(null); P.sitHouse(); }));
    }
    var back2 = mk("a", "pk-btn", "Return to the Lobby"); back2.href = C.home || "lobby.html"; r.appendChild(back2);
    b.appendChild(r); el.end.veil.classList.add("on");

    if (mode !== "house" && !(mode === "online" && C.partners)) return;   /* online results are scored by the room itself (partners: as House games) */
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

  /* ---------------- online table: names, who's at the table, forfeits ----------------
     A room calls Parlor.table({sb, room, me, side}) once it knows its seat (side 1 = host, 2 = guest, 0 = watching).
     The kit then: looks up the other player's username (seat names and result windows use it), keeps a presence
     line open so each side knows the other is still at the table (a window after 15 seconds away, a note when
     they come back), and runs Forfeit Game (the forfeit is saved on the table as state.forfeit = side, sent live
     to the other player, and reported to the server as a concession, which it accepts on its own). */
  var T = null;
  P.oppName = function (lower) {
    if (mode !== "online") return "The House";
    return (T && T.oppName) || (C.partners ? (lower ? "your partner" : "Your partner") : (lower ? "your opponent" : "Your opponent"));
  };
  P.toast = function (text) {
    if (!el.toast) return; el.toast.textContent = text; el.toast.classList.add("on");
    clearTimeout(el.toastT); el.toastT = setTimeout(function () { el.toast.classList.remove("on"); }, 3200);
  };
  function myPublicName() { var p = (window.BW && BW.profile && BW.profile()) || {}; return p.username || p.display_name || accountInfo.name || ""; }
  function setOpp(name) { if (!T || !name) return; T.oppName = String(name).slice(0, 24); if (lastNames) P.names(lastNames); }
  function loadOpp(id) {
    if (!T || !id || T.oppId === id) return; T.oppId = id;
    if (el.forfeitBtn && !finished) el.forfeitBtn.style.display = "";
    var got = function (d) { if (!T || T.oppId !== id) return; if (d) { T.oppProf = d; if (d.username || d.display_name) setOpp(d.username || d.display_name); } paintAv(); };
    if (window.BWAvatar) { BWAvatar.fetch(T.sb, [id]).then(function (rows) { got(rows[0]); }); return; }
    T.sb.from("profiles").select("username,display_name").eq("id", id).maybeSingle().then(function (r) { got(r && r.data); }, function () {});
  }
  P.table = function (o) {
    if (!o || !o.sb || !o.room) return;
    if (T && T.ch) { try { T.sb.removeChannel(T.ch); } catch (e) {} }
    T = { sb: o.sb, room: o.room, me: o.me, side: o.side || 0, oppName: "", oppId: null, oppProf: null, seen: false, gone: false, timer: 0, ch: null };
    paintAv();
    if (!T.side) return;                                   /* watchers just watch */
    loadOpp(T.side === 1 ? o.room.guest : o.room.host);
    var st = o.room.state || {};
    if (st.forfeit) { setTimeout(function () { forfeited(st.forfeit, st.left); }, 400); }
    var ch = o.sb.channel("seat-" + o.room.code, { config: { presence: { key: o.me } } });
    T.ch = ch;
    ch.on("presence", { event: "sync" }, function () {
      var all = ch.presenceState(), there = false;
      Object.keys(all).forEach(function (k) { if (k !== T.me) { there = true; var m = (all[k] && all[k][0]) || {}; if (m.name && !T.oppName) setOpp(m.name); } });
      present(there);
    });
    ch.on("broadcast", { event: "forfeit" }, function (m) { var p = (m && m.payload) || {}; if (p.side) forfeited(p.side, p.left); });
    ch.on("postgres_changes", { event: "UPDATE", schema: "public", table: "rooms", filter: "id=eq." + o.room.id }, function (p) {
      if (!T || !p.new) return; T.room = p.new;
      var s2 = p.new.state || {}; if (s2.forfeit) forfeited(s2.forfeit, s2.left);
      loadOpp(T.side === 1 ? p.new.guest : p.new.host);
    });
    ch.subscribe(function (status) { if (status === "SUBSCRIBED") { try { ch.track({ name: myPublicName(), side: T.side }); } catch (e) {} } });
  };
  /* the other player came or went: a window if they've been gone 15 seconds (phones drop the line when the screen
     sleeps or the player switches apps, so a short absence says nothing); a note when they're back */
  function present(there) {
    if (!T) return;
    if (there) {
      T.seen = true; clearTimeout(T.timer); T.timer = 0;
      if (T.gone) { T.gone = false; el.tblM.veil.classList.remove("on"); if (!finished) P.toast(P.oppName() + " is back at the table."); }
      return;
    }
    if (!T.seen || finished || T.timer || T.gone) return;
    T.timer = setTimeout(function () { T.timer = 0; if (!T || finished) return; T.gone = true; tableWindow("left"); }, 15000);
  }
  function tableWindow(kind) {
    var b = el.tblM.box; b.innerHTML = "";
    var r = mk("div", "pk-row");
    if (kind === "left") {
      b.appendChild(mk("p", "pk-kick", "Table Notice"));
      b.appendChild(mk("h2", "", P.oppName() + " Left the Table"));
      b.appendChild(mk("p", "pk-center", "Their seat is held in case they come back. You can keep waiting, or head back to the Lobby."));
      r.appendChild(btn("Keep Waiting", "", function () { el.tblM.veil.classList.remove("on"); }));
    } else {
      b.appendChild(mk("p", "pk-kick", C.partners ? "Leave the Game" : "Forfeit"));
      b.appendChild(mk("h2", "", C.partners ? "Leave This Game?" : "Forfeit This Game?"));
      b.appendChild(mk("p", "pk-center", C.partners ? "The game ends for you and " + P.oppName() + ", your partner. It counts as a loss against The House." : P.oppName() + " wins, and it counts as a loss for you."));
      r.appendChild(btn(C.partners ? "Leave the Game" : "Forfeit", "", function () { el.tblM.veil.classList.remove("on"); doForfeit(); }));
      r.appendChild(btn("Keep Playing", "quiet", function () { el.tblM.veil.classList.remove("on"); }));
    }
    if (kind === "left") { var a = mk("a", "pk-btn", "Return to the Lobby"); a.href = C.home || "lobby.html"; r.appendChild(a); }
    b.appendChild(r); sheet(null); el.tblM.veil.classList.add("on");
  }
  P.forfeit = function () { if (!T || !T.side || finished || mode !== "online") return; tableWindow("forfeit"); };
  async function doForfeit() {
    if (!T || finished) return;
    var side = T.side, other = 3 - side;
    try { T.ch.send({ type: "broadcast", event: "forfeit", payload: { side: side } }); } catch (e) {}
    if (C.partners) {   /* partners: the game simply ends; nobody is scored against the other */
      P.finish("lose", "You left the game. " + P.oppName() + " has been told.", "You Left the Game");
      try { var st0 = Object.assign({}, (T.room && T.room.state) || {}, { forfeit: side }); T.room.state = st0; T.room.__bwReported = true;
        await T.sb.from("rooms").update({ state: st0, status: "done", updated_at: new Date().toISOString() }).eq("id", T.room.id); } catch (e) {}
      return;
    }
    P.finish("lose", "You forfeited. " + P.oppName() + " takes the win.", "You Forfeited the Game");
    try {
      var st = Object.assign({}, (T.room && T.room.state) || {}, { forfeit: side });
      T.room.state = st; T.room.__bwReported = true;
      await T.sb.from("rooms").update({ state: st, status: "done", updated_at: new Date().toISOString() }).eq("id", T.room.id);
      await T.sb.rpc("bw_report_result", { p_room: String(T.room.id), p_winner: other });
    } catch (e) {}
  }
  function forfeited(side, left) {
    if (!T || finished) return;
    if (side === T.side) { P.finish("lose", left ? "You left this table." : "You forfeited this game.", left ? "You Left the Table" : "You Forfeited the Game"); return; }
    clearTimeout(T.timer); T.timer = 0;
    if (C.partners) { token = null; P.finish("draw", P.oppName() + " left the game, so it ended here. No points either way.", P.oppName() + " Left the Game"); return; }
    if (left) P.finish("win", P.oppName() + " has left the table for good. The win is yours.", P.oppName() + " Left the Table");
    else P.finish("win", P.oppName() + " forfeited the game. The win is yours.", P.oppName() + " Forfeited");
    try { if (T.room) T.room.__bwReported = true; T.sb.rpc("bw_report_result", { p_room: String(T.room.id), p_winner: T.side }); } catch (e) {}
  }

  /* ---------------- your open online tables (Oct 24) ----------------
     A signed-in player who left an online game sees one slim line under the invitation card: "Your Checkers game with
     judy is still open" with Return and Leave Table (or "You have 3 open tables" with View All, which goes to the
     Lobby). Open = status "live", both seats taken, not over or forfeited, a move in the last hour.
     Leave Table (asks first) saves state.forfeit = my side and state.left = true, status "done", and reports the other
     side as the winner; a waiting player sees "sam Left the Table · … has left the table for good. The win is yours." */
  var yoursAsked = false, TABLE_HOUR = 60 * 60 * 1000;
  /* partnership games (Oct 28): the two people are partners against The House */
  var PARTNER_GAMES = { spades: 1, euchre: 1, canasta: 1, pinochle: 1, bridge: 1 };
  P.isPartnerGame = function (r) { var g = String((r && (r.game || (r.state && r.state.game))) || r || "").toLowerCase(); return !!PARTNER_GAMES[g]; };
  P.openTables = async function (c, me) {
    var since = new Date(Date.now() - TABLE_HOUR).toISOString(), cols = "id,code,game,host,guest,state,status,updated_at,created_at";
    var a = await c.from("rooms").select(cols).eq("host", me).eq("status", "live");
    var b2 = await c.from("rooms").select(cols).eq("guest", me).eq("status", "live");
    var rows = [].concat((a && a.data) || [], (b2 && b2.data) || []).filter(function (r) {
      var st = r.state || {};
      return r.host && r.guest && r.host !== r.guest && !st.over && !st.forfeit && String(r.updated_at || r.created_at || "") >= since;
    });
    rows.sort(function (x, y) { return String(y.updated_at || "").localeCompare(String(x.updated_at || "")); });
    var ids = rows.map(function (r) { return r.host === me ? r.guest : r.host; }), names = {};
    if (ids.length) try { var pr = await c.from("profiles").select("id,username,display_name").in("id", ids); ((pr && pr.data) || []).forEach(function (p) { names[p.id] = p.username || p.display_name; }); } catch (e) {}
    rows.forEach(function (r) { r.opp = names[r.host === me ? r.guest : r.host] || "your opponent"; });
    return rows;
  };
  P.leaveTable = async function (c, r, me) {
    var side = r.host === me ? 1 : 2;
    var st = Object.assign({}, r.state || {}, { forfeit: side, left: true });
    await c.from("rooms").update({ state: st, status: "done", updated_at: new Date().toISOString() }).eq("id", r.id);
    if (P.isPartnerGame(r)) return;   /* partners: leaving just ends the game */
    try { await c.rpc("bw_report_result", { p_room: String(r.id), p_winner: 3 - side }); } catch (e) {}
  };
  P.yourTables = async function (force) {
    if (!el.yours || /[?&](code|match_id)=/.test(location.search)) return;
    var c = sb(), u = window.BW && BW.user && BW.user(); if (!c || !u) { el.yours.hidden = true; return; }
    if (!force && yoursAsked === u.id) return; yoursAsked = u.id;
    try {
      var rows = await P.openTables(c, u.id);
      if (!rows.length) { el.yours.hidden = true; return; }
      el.yours.innerHTML = "";
      var line = mk("div", "pk-yourline"), t = mk("p", "pk-yourtxt"), acts = mk("div", "pk-youracts");
      if (rows.length === 1) {
        var r = rows[0], g = GAMES.filter(function (x) { return x[0] === String(r.game).toLowerCase(); })[0] || [r.game, r.game, (C.home || "lobby.html")];
        t.appendChild(document.createTextNode("Your " + g[1] + " game with ")); t.appendChild(mk("b", "", r.opp)); t.appendChild(document.createTextNode(" is still open."));
        var go = mk("a", "pk-btn", "Return"); go.href = (typeof bwRoomHref === "function") ? bwRoomHref(g[0], r.code) : (g[2] + "?code=" + encodeURIComponent(r.code));
        var lv = btn("Leave Table", "quiet", function () {
          t.textContent = P.isPartnerGame(r) ? "Leave for good? The game ends for you and " + r.opp + "." : "Leave for good? " + r.opp + " wins, and it counts as a loss for you."; acts.innerHTML = "";
          acts.appendChild(btn("Leave Table", "", async function () { await P.leaveTable(c, r, u.id); P.yourTables(true); }));
          acts.appendChild(btn("Cancel", "quiet", function () { P.yourTables(true); }));
        });
        acts.appendChild(go); acts.appendChild(lv);
      } else {
        t.appendChild(document.createTextNode("You have " + rows.length + " open tables."));
        var v = mk("a", "pk-btn", "View All"); v.href = (C.home || "lobby.html") + "#yours"; acts.appendChild(v);
      }
      line.appendChild(t); line.appendChild(acts); el.yours.appendChild(line);
      el.yours.hidden = false;
    } catch (e) { el.yours.hidden = true; }
  };

  /* ---------------- account card + sets ---------------- */
  async function loadAccount() {
    var u = window.BW && BW.user && BW.user();
    accountInfo.user = u || null;
    var p = (window.BW && BW.profile && BW.profile()) || {};
    accountInfo.pts = Number(p.skill_points || 0); accountInfo.member = !!p.member; accountInfo.name = p.display_name || p.username || "";
    renderAccount(); renderSets(); paintAv(); P.yourTables();
  }
  function renderAccount() {
    var a = el.acct; if (!a) return; a.innerHTML = "<h3 style=\"margin:0 0 8px;font-size:11px;letter-spacing:.16em;text-transform:uppercase;opacity:.85\">Account</h3>";
    var t = mk("div"); a.appendChild(t);
    if (accountInfo.user && window.BWAvatar) {   /* your avatar with its rank ring; tap it (or Avatar) to change it (Oct 26) */
      var prof = meProf() || {}, rk = BWAvatar.rank(accountInfo.pts);
      t.className = "pk-me";
      var av = mk("button", "av bwa-av"); av.type = "button"; av.title = "Change your avatar"; av.innerHTML = BWAvatar.html(prof, { size: 72 }); av.onclick = function () { BWAvatar.studio(); };
      var tx = mk("div"); tx.innerHTML = "<b>" + esc(accountInfo.name || "Player") + "</b><small>" + esc(rk.name) + "</small>" + accountInfo.pts + " points" + (accountInfo.member ? " · Club member" : "");
      t.appendChild(av); t.appendChild(tx);
      if (el.clubBtn) el.clubBtn.textContent = accountInfo.member ? "Club Details" : "Join the Club";
      a.appendChild(btn("Avatar", "", function () { BWAvatar.studio(); }));
      if (!accountInfo.member) a.appendChild(btn("Join the Club", "", function () { location.href = "member.html"; }));
    } else if (accountInfo.user) {
      t.innerHTML = "<b>" + esc(accountInfo.name || "Player") + "</b><br>" + accountInfo.pts + " points" + (accountInfo.member ? " · Club member" : "");
      if (el.clubBtn) el.clubBtn.textContent = accountInfo.member ? "Club Details" : "Join the Club";
      if (!accountInfo.member) a.appendChild(btn("Join the Club", "", function () { location.href = "member.html"; }));
    } else {
      t.textContent = "Playing as a guest. Create a free account to earn points and unlock sets.";
      a.appendChild(btn("Create Free Account", "", function () { if (window.BW) BW.openAuth({ reason: "Earn points and unlock sets." }); }));
    }
  }
  /* a set is open when it's free, the player has enough points, or they're a Club member; `club:true` sets are for members only */
  function setAllowed(s) { if (s.club) return accountInfo.member; return !s.need || accountInfo.member || accountInfo.pts >= s.need; }
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
      var sm = mk("small", "", s.club ? (ok ? "Club board" : "Club members") : ok ? (s.need ? "Unlocked" : "Starter set") : (s.need + " points, or join the Club")); nm.appendChild(sm);
      b.appendChild(dots); b.appendChild(nm);
      b.onclick = function () {
        if (!ok) { location.href = "member.html"; return; }
        store("bwSet:" + C.game, s.id); renderSets();
      };
      el.sets.appendChild(b);
    });
  }

  /* ---------------- The House's level: a slow, smooth climb ----------------
     Every game starts gentle (level 1). Each win against The House moves it up one step; two losses in a row
     move it back down one. Games read Parlor.level() and Parlor.maxLevel to pick how carefully The House plays.
     Even the top level keeps a little chance in it, so it can always be beaten. */
  P.maxLevel = 10;
  function lvlKey() { return "bwLevel:" + (C && C.game); }
  P.level = function () { var v = parseInt(store(lvlKey()) || "1", 10); return Math.max(1, Math.min(P.maxLevel, v || 1)); };
  function showLevel() { if (el.level) el.level.textContent = mode === "house" && !C.solo ? "The House: level " + P.level() + " of " + P.maxLevel : ""; }
  function levelAfter(kind) {
    var L = P.level(), losses = parseInt(store(lvlKey() + ":l") || "0", 10) || 0, note = "";
    if (kind === "win") {
      if (L < P.maxLevel) { L++; note = "The House moves up to level " + L + "."; }
      else {
        note = "You beat The House at its top level!";
        var ch = window.BWAvatar && BWAvatar.earn(C.game);   /* each room's charm (Oct 26) */
        if (ch) note += " You earned the " + ch.name + " charm. Wear it from Avatar in the menu.";
      }
      losses = 0;
    }
    else if (kind === "lose") { losses++; if (losses >= 2 && L > 1) { L--; losses = 0; note = "The House eases off to level " + L + "."; } }
    store(lvlKey(), String(L)); store(lvlKey() + ":l", String(losses)); showLevel(); return note;
  }
  /* how carefully to play at the current level: chance of a loose move, and how far to look ahead (1 to 5) */
  P.skill = function () {
    if (mode === "learn") return { level: 1, loose: 0.55, depth: 1, learn: true };   /* practice games: always gentle */
    var L = P.level(); return { level: L, loose: Math.max(0.04, 0.5 - L * 0.05), depth: Math.min(5, 1 + Math.floor((L - 1) / 2)) }; };

  /* ---------------- sound & motion ----------------
     Sounds are made in the browser (no files to download). Settings are remembered on this device. */
  var AC = null, master = null;
  P.soundOn = function () { return store("bwSound") !== "off"; };
  P.volume = function () { var v = parseFloat(store("bwVol")); return isNaN(v) ? 0.7 : Math.max(0, Math.min(1, v)); };
  P.smooth = function () { var m = store("bwMotion"); if (m) return m !== "reduced"; return !(window.matchMedia && matchMedia("(prefers-reduced-motion:reduce)").matches); };
  function audio() {
    if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.connect(AC.destination); } catch (e) { return null; } }
    if (AC.state !== "running" && AC.resume) { try { AC.resume(); } catch (e) {} }
    master.gain.value = P.volume() * 0.9;
    return AC;
  }
  ["pointerdown", "touchend", "keydown"].forEach(function (ev) { document.addEventListener(ev, function () { if (P.soundOn()) audio(); }, { passive: true }); });
  function noise(ac, len) { var b = ac.createBuffer(1, Math.max(1, ac.sampleRate * len), ac.sampleRate), d = b.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 1.4); var s = ac.createBufferSource(); s.buffer = b; return s; }
  function env(ac, g, t, peak, a, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  function tone(ac, t, type, f0, f1, peak, a, d, filt) {
    var o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + a + d);
    env(ac, g, t, peak, a, d); var last = o; if (filt) { var f = ac.createBiquadFilter(); f.type = filt[0]; f.frequency.value = filt[1]; o.connect(f); last = f; }
    last.connect(g); g.connect(master); o.start(t); o.stop(t + a + d + 0.02);
  }
  /* Parlor.sfx(name, {pitch}) : card, deal ({n, gap}), whoosh, land, click (marble into a cup), store (marble into a store), flip, place, dice ({dur}), tile, mill, win, lose, draw */
  P.sfx = function (name, o) {
    if (!P.soundOn()) return; var ac = audio(); if (!ac) return; o = o || {}; var t = ac.currentTime + 0.005, p = o.pitch || 1;
    try {
      if (name === "whoosh") { var n = noise(ac, 0.36), bp = ac.createBiquadFilter(), g = ac.createGain(); bp.type = "bandpass"; bp.Q.value = 0.8; bp.frequency.setValueAtTime(1100, t); bp.frequency.exponentialRampToValueAtTime(380, t + 0.34); env(ac, g, t, 0.16, 0.05, 0.3); n.connect(bp); bp.connect(g); g.connect(master); n.start(t); n.stop(t + 0.37); }
      else if (name === "land") { tone(ac, t, "sine", 190, 55, 0.22, 0.006, 0.15, ["lowpass", 300]); }
      else if (name === "click" || name === "store") {
        var big = name === "store", f = (big ? 1350 : 2300) * p;
        tone(ac, t, "sine", f, f * 0.92, big ? 0.16 : 0.13, 0.002, big ? 0.16 : 0.09);
        tone(ac, t + 0.01, "triangle", f * 1.52, f * 1.4, 0.05, 0.002, 0.05);
        var k = noise(ac, 0.03), hp = ac.createBiquadFilter(), g2 = ac.createGain(); hp.type = "highpass"; hp.frequency.value = 3000; env(ac, g2, t, 0.07, 0.001, 0.025); k.connect(hp); hp.connect(g2); g2.connect(master); k.start(t); k.stop(t + 0.04);
        if (big) tone(ac, t + 0.005, "sine", 220, 160, 0.08, 0.004, 0.12, ["lowpass", 500]);
      }
      else if (name === "flip") { var n2 = noise(ac, 0.07), bp2 = ac.createBiquadFilter(), g3 = ac.createGain(); bp2.type = "bandpass"; bp2.frequency.value = 1800 * p; bp2.Q.value = 1.2; env(ac, g3, t, 0.12, 0.004, 0.06); n2.connect(bp2); bp2.connect(g3); g3.connect(master); n2.start(t); n2.stop(t + 0.08); tone(ac, t + 0.03, "sine", 520 * p, 380 * p, 0.06, 0.003, 0.06); }
      else if (name === "place") { tone(ac, t, "sine", 240, 90, 0.2, 0.005, 0.13, ["lowpass", 420]); var n3 = noise(ac, 0.04), g4 = ac.createGain(); env(ac, g4, t, 0.06, 0.002, 0.03); n3.connect(g4); g4.connect(master); n3.start(t); n3.stop(t + 0.05); }
      /* dice shaken and tumbling across felt: a run of soft knocks that slows down (o.dur seconds) */
      else if (name === "dice") {
        var dur = o.dur || 1.1, tk = 0, k2 = 0;
        while (tk < dur && k2 < 14) {
          var f0 = (700 + Math.random() * 900) * p, gD = ac.createGain(), nD = noise(ac, 0.035), bD = ac.createBiquadFilter();
          bD.type = "bandpass"; bD.frequency.value = f0; bD.Q.value = 2.2; env(ac, gD, t + tk, 0.11 * (1 - tk / dur * 0.6), 0.002, 0.03);
          nD.connect(bD); bD.connect(gD); gD.connect(master); nD.start(t + tk); nD.stop(t + tk + 0.05);
          tone(ac, t + tk, "sine", 320 * p, 200 * p, 0.04, 0.002, 0.04, ["lowpass", 600]);
          tk += 0.045 + Math.pow(k2 / 14, 1.6) * 0.16 + Math.random() * 0.03; k2++;
        }
      }
      /* a wooden tile tipping down onto wood: a soft clack with a low knock */
      else if (name === "tile") {
        var nT = noise(ac, 0.05), bT = ac.createBiquadFilter(), gT = ac.createGain(); bT.type = "bandpass"; bT.frequency.value = 1300 * p; bT.Q.value = 3;
        env(ac, gT, t, 0.16, 0.002, 0.045); nT.connect(bT); bT.connect(gT); gT.connect(master); nT.start(t); nT.stop(t + 0.06);
        tone(ac, t, "sine", 210 * p, 120 * p, 0.16, 0.003, 0.09, ["lowpass", 500]);
        tone(ac, t + 0.004, "triangle", 880 * p, 700 * p, 0.035, 0.002, 0.04);
      }
      /* a mill: two soft bell notes */
      else if (name === "mill") { tone(ac, t, "triangle", 784 * p, 0, 0.09, 0.006, 0.5); tone(ac, t + 0.12, "triangle", 1175 * p, 0, 0.08, 0.006, 0.6); tone(ac, t, "sine", 392 * p, 0, 0.05, 0.01, 0.5); }
      /* a playing card laid down on leather or felt: a soft snap with a little air (Oct 26) */
      else if (name === "card") {
        var nC = noise(ac, 0.06), bC = ac.createBiquadFilter(), gC = ac.createGain(); bC.type = "bandpass"; bC.frequency.value = 2600 * p; bC.Q.value = 0.9;
        env(ac, gC, t, 0.13, 0.002, 0.05); nC.connect(bC); bC.connect(gC); gC.connect(master); nC.start(t); nC.stop(t + 0.07);
        tone(ac, t, "sine", 160 * p, 90 * p, 0.07, 0.003, 0.06, ["lowpass", 400]);
      }
      /* a quick run of cards dealt (o.n cards, default 7) */
      else if (name === "deal") {
        for (var dn = 0, nn = o.n || 7; dn < nn; dn++) { var nd = noise(ac, 0.05), bd = ac.createBiquadFilter(), gd = ac.createGain(), td = t + dn * (o.gap || 0.07); bd.type = "bandpass"; bd.frequency.value = (2200 + Math.random() * 900) * p; bd.Q.value = 1;
          env(ac, gd, td, 0.08, 0.002, 0.04); nd.connect(bd); bd.connect(gd); gd.connect(master); nd.start(td); nd.stop(td + 0.06); }
      }
      else if (name === "win") { [523, 659, 784, 1047].forEach(function (f, i) { tone(ac, t + i * 0.11, "triangle", f, 0, 0.12, 0.01, 0.4); }); }
      else if (name === "lose") { [392, 330].forEach(function (f, i) { tone(ac, t + i * 0.18, "sine", f, f * 0.97, 0.1, 0.02, 0.45); }); }
      else if (name === "draw") { [440, 440].forEach(function (f, i) { tone(ac, t + i * 0.16, "sine", f, 0, 0.08, 0.01, 0.25); }); }
    } catch (e) {}
  };
  /* Parlor.fly(fromEl, toEl, html, {dur, lift, size, sound}) : a piece floats along an arc from one spot to another.
     Resolves when it lands. With reduced motion it resolves at once. */
  P.fly = function (from, to, html, o) {
    o = o || {};
    return new Promise(function (res) {
      if (!from || !to || !P.smooth()) { res(); return; }
      var a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
      var size = o.size || Math.min(a.width, a.height) * 0.8;
      var x0 = a.left + a.width / 2 + (o.dx0 || 0), y0 = a.top + a.height / 2 + (o.dy0 || 0), x1 = b.left + b.width / 2 + (o.dx1 || 0), y1 = b.top + b.height / 2 + (o.dy1 || 0);
      var fl = mk("div", "pk-flyer"); fl.innerHTML = html; fl.style.width = size + "px"; fl.style.height = size + "px";
      document.body.appendChild(fl);
      var dist = Math.hypot(x1 - x0, y1 - y0), lift = o.lift != null ? o.lift : Math.min(110, 26 + dist * 0.22), dur = o.dur || Math.min(900, 420 + dist * 0.5), t0 = performance.now();
      if (o.sound !== false) P.sfx("whoosh");
      (function tick(now) {
        var p = Math.min(1, (now - t0) / dur), e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2, up = Math.sin(Math.PI * p) * lift, sc = 1 + 0.14 * Math.sin(Math.PI * p);
        fl.style.transform = "translate(" + (x0 + (x1 - x0) * e - size / 2) + "px," + (y0 + (y1 - y0) * e - up - size / 2) + "px) scale(" + sc + ")";
        if (p < 1) requestAnimationFrame(tick); else { if (fl.parentNode) fl.parentNode.removeChild(fl); res(); }
      })(t0);
    });
  };
  P.wait = function (ms) { return new Promise(function (r) { setTimeout(r, P.smooth() ? ms : Math.min(ms, 60)); }); };
  /* the Sound & Motion window */
  P.settings = function () {
    sheet(null);
    var b = el.setM.box; b.innerHTML = "";
    b.appendChild(mk("p", "pk-kick", "Sound & Motion"));
    function row(label, ctl) { var r = mk("div", "pk-setrow"); r.appendChild(mk("span", "", label)); r.appendChild(ctl); b.appendChild(r); }
    var sw = mk("div", "pk-seg");
    [["On", "on"], ["Off", "off"]].forEach(function (o) { var x = btn(o[0], (P.soundOn() ? "on" : "off") === o[1] ? "sel" : "", function () { store("bwSound", o[1]); P.settings(); if (o[1] === "on") P.sfx("click"); }); sw.appendChild(x); });
    row("Sound", sw);
    var vol = mk("input", "pk-range"); vol.type = "range"; vol.min = 0; vol.max = 100; vol.value = Math.round(P.volume() * 100); vol.setAttribute("aria-label", "Volume");
    vol.oninput = function () { store("bwVol", String(vol.value / 100)); }; vol.onchange = function () { P.sfx("click"); };
    if (!P.soundOn()) vol.disabled = true;
    row("Volume", vol);
    var mo = mk("div", "pk-seg");
    [["Smooth", "smooth"], ["Reduced", "reduced"]].forEach(function (o) { var x = btn(o[0], (P.smooth() ? "smooth" : "reduced") === o[1] ? "sel" : "", function () { store("bwMotion", o[1]); P.settings(); }); mo.appendChild(x); });
    row("Animations", mo);
    b.appendChild(mk("p", "pk-sub pk-setnote", "Reduced turns off the floating pieces and quick effects. Settings are saved on this device."));
    var r = mk("div", "pk-row"); r.appendChild(btn("Done", "", function () { el.setM.veil.classList.remove("on"); })); b.appendChild(r);
    el.setM.veil.classList.add("on");
  };

  /* ---------------- start ---------------- */
  P.init = function (cfg) {
    if (cfg.lesson && !cfg.learn) cfg.learn = { start: function () { P.lessonGo(0); }, practice: function () { P.startPractice(); } };
    C = cfg;
    function go() {
      build();
      if (window.BW && BW.onChange) BW.onChange(loadAccount); else loadAccount();
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go); else go();
  };
})();
