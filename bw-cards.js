/* BrainWhim Card Kit (Oct 26) — shared by every card room (pair with bw-cards.css; load after parlor-kit.js).
   Cards are drawn in code: cream faces with Cormorant Garamond corners, framed court cards, and backs carrying the
   gold BW monogram on the room's own colour (set --bwc-back on any parent). A card is 100 x 140 units; rooms lay
   cards out in their own table units and scale the whole table to the screen.

   BWCards.deck()               52 cards {s:0-3 (clubs, diamonds, hearts, spades), r:0-12 (A..K), id:"s-r"}
   BWCards.shuffle(arr, rnd)    shuffles in place (rnd: optional seeded random, BWCards.rng(seed))
   BWCards.red(c)               true for diamonds and hearts
   BWCards.name(c)              "queen of hearts"
   BWCards.make(c, {up})        a card element (.bwc); BWCards.turn(el, c, up) turns it face up or down
   BWCards.slot(label)          an empty place on the table (.bwc-slot), e.g. "A" or "K" or "↻"
   BWCards.glide(el, x, y, o)   floats a card to (x, y) in table units along a small arc; resolves when it lands
                                (o: dur, lift (peak scale), spin (peak tilt in degrees), soar (a deeper shadow), flip:{c, up})
   BWCards.paint.*              wood, leather and felt textures for tables (canvasOf, woodFn, leatherFn, feltFn, cssUrl, rot) */
(function () {
  "use strict";
  var K = window.BWCards = {};
  var SUITS = ["♣", "♦", "♥", "♠"], RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  var SUITNAME = ["clubs", "diamonds", "hearts", "spades"], RANKNAME = ["ace", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "jack", "queen", "king"];
  K.SUITS = SUITS; K.RANKS = RANKS; K.W = 100; K.H = 140;
  K.deck = function () { var d = []; for (var s = 0; s < 4; s++) for (var r = 0; r < 13; r++) d.push({ s: s, r: r, id: s + "-" + r }); return d; };
  K.rng = function (seed) { var s = seed % 2147483647; if (s <= 0) s += 2147483646; return function () { return (s = s * 16807 % 2147483647) / 2147483647; }; };
  K.shuffle = function (a, rnd) { rnd = rnd || Math.random; for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  K.red = function (c) { return c.s === 1 || c.s === 2; };
  K.name = function (c) { return RANKNAME[c.r] + " of " + SUITNAME[c.s]; };
  K.short = function (c) { return RANKS[c.r] + SUITS[c.s]; };

  /* pip positions (percent of the pip box) for 2-10 */
  var LAYOUT = { 2: [[50, 0], [50, 100]], 3: [[50, 0], [50, 50], [50, 100]], 4: [[0, 0], [100, 0], [0, 100], [100, 100]], 5: [[0, 0], [100, 0], [50, 50], [0, 100], [100, 100]],
    6: [[0, 0], [100, 0], [0, 50], [100, 50], [0, 100], [100, 100]], 7: [[0, 0], [100, 0], [50, 25], [0, 50], [100, 50], [0, 100], [100, 100]],
    8: [[0, 0], [100, 0], [50, 25], [0, 50], [100, 50], [50, 75], [0, 100], [100, 100]], 9: [[0, 0], [100, 0], [0, 33], [100, 33], [50, 50], [0, 67], [100, 67], [0, 100], [100, 100]],
    10: [[0, 0], [100, 0], [50, 17], [0, 33], [100, 33], [0, 67], [100, 67], [50, 83], [0, 100], [100, 100]] };
  var COURT = { 10: "Jack", 11: "Queen", 12: "King" };
  function faceHtml(c) {
    var R = RANKS[c.r], SU = SUITS[c.s], mid;
    if (c.r === 0) mid = '<div class="pips"><span class="ace" style="left:50%;top:50%">' + SU + '</span></div>';
    else if (c.r >= 10) mid = '<div class="court"><i class="orn"></i><b>' + R + '</b><i class="su">' + SU + '</i><small>' + COURT[c.r] + '</small></div>';
    else mid = '<div class="pips">' + LAYOUT[c.r + 1].map(function (p) { return '<span class="' + (p[1] > 50 ? "dn" : "") + '" style="left:' + p[0] + '%;top:' + p[1] + '%">' + SU + '</span>'; }).join("") + '</div>';
    var tn = c.r === 9 ? " ten" : "";
    return '<div class="ix' + tn + '"><b>' + R + '</b><i>' + SU + '</i></div>' + mid + '<div class="ix br' + tn + '"><b>' + R + '</b><i>' + SU + '</i></div>';
  }
  var BACK = '<div class="bk"><span class="frame"></span><span class="mono"><b>B</b><i>W</i></span></div>';
  K.make = function (c, o) {
    o = o || {};
    var e = document.createElement("div");
    e.className = "bwc";
    e.innerHTML = '<div class="fc"></div>' + BACK;
    K.turn(e, c, !!o.up);
    return e;
  };
  K.turn = function (e, c, up) {
    e._c = c; e._up = up;
    e.classList.toggle("up", !!up);
    e.classList.toggle("red", !!(c && K.red(c)));
    var f = e.firstChild;
    if (up && c) { if (f._id !== c.id) { f.innerHTML = faceHtml(c); f._id = c.id; } e.setAttribute("aria-label", K.name(c)); }
    else e.setAttribute("aria-label", "face-down card");
  };
  K.slot = function (label, cls) { var e = document.createElement("div"); e.className = "bwc-slot" + (cls ? " " + cls : ""); if (label) { var s = document.createElement("span"); s.textContent = label; e.appendChild(s); } return e; };

  /* move a card element to (x, y) table units (its top-left corner). o: {dur, lift, z, flip:{c, up}} */
  K.place = function (e, x, y) { e._x = x; e._y = y; e.style.transform = "translate(" + x + "px," + y + "px)"; };
  K.glide = function (e, x, y, o) {
    o = o || {};
    var smooth = !window.Parlor || !Parlor.smooth || Parlor.smooth();
    return new Promise(function (res) {
      var x0 = e._x == null ? x : e._x, y0 = e._y == null ? y : e._y, d = Math.hypot(x - x0, y - y0);
      if (!smooth || d < 1) { if (o.flip) K.turn(e, o.flip.c, o.flip.up); K.place(e, x, y); e.classList.remove("lift"); res(); return; }
      var dur = o.dur || Math.min(520, 220 + d * 0.32), lift = o.lift == null ? Math.min(1.08, 1.02 + d / 9000) : o.lift, t0 = performance.now(), flipped = false;
      e.classList.add("flying"); if (o.soar) e.classList.add("soar");
      (function step(now) {
        var p = Math.min(1, (now - t0) / dur), k = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2, sc = 1 + (lift - 1) * Math.sin(Math.PI * p);
        if (o.flip && !flipped && p >= 0.5) { flipped = true; K.turn(e, o.flip.c, o.flip.up); }
        var sx = o.flip ? Math.abs(Math.cos(Math.PI * p)) * sc : sc;   /* a flip turns the card over half way */
        e._x = x0 + (x - x0) * k; e._y = y0 + (y - y0) * k;
        var rz = o.spin ? " rotate(" + (o.spin * Math.sin(Math.PI * p)).toFixed(2) + "deg)" : "";   /* o.spin: a tilt that peaks mid-flight */
        e.style.transform = "translate(" + e._x + "px," + e._y + "px)" + rz + " scale(" + Math.max(0.04, sx).toFixed(3) + "," + sc.toFixed(3) + ")";
        if (p < 1) requestAnimationFrame(step); else { e.classList.remove("flying", "soar"); K.place(e, x, y); res(); }
      })(t0);
    });
  };
  /* turn a card over where it lies */
  K.flip = function (e, c, up) {
    var smooth = !window.Parlor || !Parlor.smooth || Parlor.smooth();
    return new Promise(function (res) {
      if (!smooth) { K.turn(e, c, up); res(); return; }
      var t0 = performance.now(), dur = 260, done = false;
      (function step(now) {
        var p = Math.min(1, (now - t0) / dur);
        if (!done && p >= 0.5) { done = true; K.turn(e, c, up); }
        e.style.transform = "translate(" + e._x + "px," + e._y + "px) scale(" + Math.max(0.04, Math.abs(Math.cos(Math.PI * p))).toFixed(3) + ",1.03)";
        if (p < 1) requestAnimationFrame(step); else { K.place(e, e._x, e._y); res(); }
      })(t0);
    });
  };

  /* ---------- painted materials (the same painters as the board rooms) ---------- */
  function noise2(seed) { var r = K.rng(seed), P = new Uint16Array(512), G = new Float32Array(256), p = [], i, j, t; for (i = 0; i < 256; i++) p[i] = i; for (i = 255; i > 0; i--) { j = Math.floor(r() * (i + 1)); t = p[i]; p[i] = p[j]; p[j] = t; } for (i = 0; i < 512; i++) P[i] = p[i & 255]; for (i = 0; i < 256; i++) G[i] = r(); function f(x) { return x * x * (3 - 2 * x); } return function (x, y) { var xi = Math.floor(x), yi = Math.floor(y), u = f(x - xi), v = f(y - yi), X = xi & 255, Y = yi & 255; var a = G[P[P[X] + Y]], b = G[P[P[X + 1] + Y]], c = G[P[P[X] + Y + 1]], d = G[P[P[X + 1] + Y + 1]]; return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }; }
  function fbm(n, x, y, o) { var s = 0, a = .5, t = 0; for (var i = 0; i < o; i++) { s += a * n(x, y); t += a; x *= 2.03; y *= 2.03; a *= .5; } return s / t; }
  function mix(a, b, t) { return a + (b - a) * t; }
  function canvasOf(w, h, fn) { var c = document.createElement("canvas"); c.width = w; c.height = h; var g = c.getContext("2d"), im = g.createImageData(w, h), D = im.data; for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) { var col = fn(x, y), i = (y * w + x) * 4; D[i] = col[0]; D[i + 1] = col[1]; D[i + 2] = col[2]; D[i + 3] = 255; } g.putImageData(im, 0, 0); return c; }
  function cssUrl(c, png) { return 'url(' + c.toDataURL(png ? "image/png" : "image/jpeg", .9) + ')'; }
  function rot(c) { var d = document.createElement("canvas"); d.width = c.height; d.height = c.width; var g = d.getContext("2d"); g.translate(d.width, 0); g.rotate(Math.PI / 2); g.drawImage(c, 0, 0); return d; }
  function woodFn(o) { var n = noise2(o.seed), n2 = noise2(o.seed + 77), r = K.rng(o.seed + 5); return function (x, y) { var warp = fbm(n, x / o.wx, y / o.wy, 4), v = y * o.freq + warp * o.turb; v -= Math.floor(v); var ring = Math.pow(Math.abs(Math.sin(v * Math.PI)), o.sharp), st = fbm(n2, x / 180, y / 1.6, 3); var t = Math.min(1, Math.max(0, (1 - ring) * o.ringAmt + st * o.streakAmt)); var k = r() < o.pores ? .8 : 1, l = 1 + (fbm(n2, x / 400, y / 90, 2) - .5) * o.blotch; return [mix(o.light[0], o.dark[0], t) * k * l, mix(o.light[1], o.dark[1], t) * k * l, mix(o.light[2], o.dark[2], t) * k * l]; }; }
  /* leather: a fine pebble grain, soft clouding, and a little wear */
  function leatherFn(rgb, seed, o) { o = o || {}; var r = K.rng(seed), n = noise2(seed), n2 = noise2(seed + 3), n3 = noise2(seed + 11); return function (x, y) { var cell = fbm(n2, x / 2.6, y / 2.6, 2), cloud = fbm(n, x / (o.cloud || 90), y / (o.cloud || 90), 4), wear = fbm(n3, x / 260, y / 260, 3); var k = .8 + cloud * (o.cloudAmt || .34) + (cell - .5) * .16 + (r() - .5) * .04 + Math.max(0, wear - .58) * (o.wear || .5); return [rgb[0] * k, rgb[1] * k, rgb[2] * k]; }; }
  function feltFn(rgb, seed) { var r = K.rng(seed), n = noise2(seed); return function (x, y) { var k = .86 + r() * .22 + (fbm(n, x / 22, y / 22, 3) - .5) * .14; return [rgb[0] * k, rgb[1] * k, rgb[2] * k]; }; }
  /* a tile that repeats without seams: the canvas mirrored into a 2 x 2 block */
  function seamless(c) { var d = document.createElement("canvas"), w = c.width, h = c.height; d.width = w * 2; d.height = h * 2; var g = d.getContext("2d");
    g.drawImage(c, 0, 0); g.save(); g.translate(w * 2, 0); g.scale(-1, 1); g.drawImage(c, 0, 0); g.restore();
    g.save(); g.translate(0, h * 2); g.scale(1, -1); g.drawImage(c, 0, 0); g.restore(); g.save(); g.translate(w * 2, h * 2); g.scale(-1, -1); g.drawImage(c, 0, 0); g.restore(); return d; }
  K.paint = { seamless: seamless, noise2: noise2, fbm: fbm, mix: mix, canvasOf: canvasOf, cssUrl: cssUrl, rot: rot, woodFn: woodFn, leatherFn: leatherFn, feltFn: feltFn };
})();
