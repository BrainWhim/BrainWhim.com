/* ==========================================================================
   BrainWhim · the Puzzles & Brain Games wing (Oct 31, 2026)
   One list of the ten puzzle rooms, shared by puzzles.html (the parlor) and lobby.html (the Puzzles category).
   To open a room: give it page:"…html" and img:"puzzles-…-sm.jpg" (the 1000px Lobby copy), add its daily keys, drop soon.
   Rooms still being furnished get a drawn poster (gold line art on a tinted night glass) until their photo is made.
   ========================================================================== */
(function () {
  "use strict";
  var ROOMS = [
    { id: "orrery", name: "The Orrery", page: "orrery.html", img: "puzzles-orrery-sm.jpg",
      about: "Turn the brass rings until every planet sits on its mark, in as few turns as you can.",
      daily: { key: "bwOrrery:", streak: "bwOrreryStreak" }, what: "orrery" },
    { id: "observatory", name: "The Observatory", page: "observatory.html", img: "puzzles-observatory-sm.jpg",
      about: "Join the stars into one constellation, with no lines crossing, and hear its story.",
      daily: { key: "bwObs:", streak: "bwObsStreak" }, what: "star chart" },
    { id: "telegraph", name: "The Telegraph Office", page: "telegraph.html", img: "puzzles-telegraph-sm.jpg", tint: "#123a3a",
      about: "Crack the coded telegram, letter by letter, to read the day's message.",
      daily: { key: "bwTele:", streak: "bwTeleStreak" }, what: "telegram" },
    { id: "nighttrain", name: "The Night Train", page: "nighttrain.html", img: "puzzles-nighttrain-sm.jpg", tint: "#3d1a1e",
      about: "Seat the passengers aboard a 1920s sleeping car so every clue holds, and find who took the necklace.",
      daily: { key: "bwTrain:", streak: "bwTrainStreak" }, what: "mystery" },
    { id: "gardenplots", name: "The Garden Plots", page: "gardenplots.html", img: "puzzles-gardenplots-sm.jpg", tint: "#1d3a24",
      about: "Plant one rose bush in every row, column and flowerbed, with no two touching.",
      daily: { key: "bwGarden:", streak: "bwGardenStreak" }, what: "garden" },
    { id: "countinghouse", name: "The Counting House", soon: true, tint: "#2c331c",
      about: "Six numbers and a target. Add, subtract, multiply and divide your way to it." },
    { id: "harbor", name: "The Harbor", soon: true, tint: "#0f2c4a",
      about: "Slide the boats around a crowded marina to sail your boat out." },
    { id: "skyword", name: "The Print Shop", soon: true, tint: "#26262e",
      about: "A themed word a day, set in type. The theme is revealed when you solve it." },
    { id: "maproom", name: "The Map Room", soon: true, tint: "#14353f",
      about: "Draw one coastline around the numbered islands. Each number tells how many sides it touches." },
    { id: "clockmaker", name: "The Clockmaker's Bench", soon: true, tint: "#3a2616",
      about: "Fill the watch gears so every digit appears once in each row, column and gear." }
  ];

  /* ---------- drawn posters (600 x 400, gold line art) ---------- */
  var G = 'fill="none" stroke="#E5C158" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"';
  var THIN = 'fill="none" stroke="#E5C158" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity=".7"';
  var DOT = 'fill="#E5C158"';
  var EMBLEM = {
    telegraph:
      '<path ' + G + ' d="M196 236h208v22H196z"/><path ' + THIN + ' d="M206 247h188"/>' +
      '<path ' + G + ' d="M240 236v-26h20v26M340 236v-18h18v18"/>' +
      '<path ' + G + ' d="M232 206l140-16"/><circle ' + G + ' cx="250" cy="204" r="7"/>' +
      '<path ' + G + ' d="M372 190l20-3"/><ellipse ' + G + ' cx="404" cy="184" rx="20" ry="9"/><path ' + G + ' d="M404 193v14"/>' +
      '<g ' + DOT + '><circle cx="228" cy="292" r="5"/><rect x="246" y="288" width="30" height="8" rx="4"/><circle cx="294" cy="292" r="5"/><circle cx="314" cy="292" r="5"/><rect x="332" y="288" width="30" height="8" rx="4"/><circle cx="380" cy="292" r="5"/></g>' +
      '<path ' + THIN + ' d="M300 150c-26 0-44-14-44-14M300 150c26 0 44-14 44-14M300 132c-14 0-24-8-24-8M300 132c14 0 24-8 24-8"/>',
    nighttrain:
      '<path ' + G + ' d="M190 250V192h56v-26h40v26h80l26 30v28z"/><path ' + G + ' d="M206 192v-30h22v30"/>' +
      '<path ' + G + ' d="M254 176h24v16h-24z"/><path ' + THIN + ' d="M300 204h46M300 216h52"/>' +
      '<circle ' + G + ' cx="222" cy="262" r="16"/><circle ' + G + ' cx="272" cy="262" r="16"/><circle ' + G + ' cx="330" cy="264" r="12"/><circle ' + G + ' cx="370" cy="264" r="12"/>' +
      '<path ' + G + ' d="M222 262h108"/><path ' + G + ' d="M150 284h300"/><path ' + THIN + ' d="M164 294h272"/>' +
      '<path ' + THIN + ' d="M217 150c-8-16 8-24 18-18 2-14 24-14 26 0 12-6 26 6 16 18"/>' +
      '<path ' + G + ' d="M392 236l26 14"/><circle ' + DOT + ' cx="418" cy="222" r="5"/>',
    gardenplots:
      '<rect ' + G + ' x="216" y="116" width="168" height="168" rx="4"/><path ' + THIN + ' d="M272 116v168M328 116v168M216 172h168M216 228h168"/>' +
      '<path ' + G + ' d="M216 172h56v56h56v56M328 116v56h56"/>' +
      ROSE(244, 144) + ROSE(356, 200) + ROSE(300, 256),
    countinghouse:
      '<path ' + G + ' d="M300 128v148M262 276h76M280 276l-10 16h60l-10-16"/><circle ' + G + ' cx="300" cy="122" r="8"/>' +
      '<path ' + G + ' d="M206 150h188"/><path ' + G + ' d="M218 150l-24 64M218 150l24 64M382 150l-24 64M382 150l24 64"/>' +
      '<path ' + G + ' d="M186 214h64c0 18-14 28-32 28s-32-10-32-28zM350 214h64c0 18-14 28-32 28s-32-10-32-28z"/>' +
      '<path ' + THIN + ' d="M288 150l12-14 12 14"/>' +
      '<g ' + DOT + '><rect x="204" y="200" width="14" height="14" rx="2"/><rect x="221" y="204" width="11" height="10" rx="2"/><circle cx="382" cy="208" r="6"/></g>',
    harbor:
      '<path ' + G + ' d="M302 120v128"/><path ' + G + ' d="M296 128c-34 30-56 70-64 112h64z"/><path ' + G + ' d="M310 146c26 26 40 58 44 94h-44z"/>' +
      '<path ' + G + ' d="M228 252h148l-22 26H252z"/><path ' + G + ' d="M302 120l20 8-20 8"/>' +
      '<path ' + THIN + ' d="M170 290c20-10 40-10 60 0s40 10 60 0 40-10 60 0 40 10 60 0 40-10 60 0"/>' +
      '<path ' + THIN + ' d="M196 304c18-8 36-8 54 0s36 8 54 0 36-8 54 0 36 8 54 0"/>',
    skyword:
      BLOCK(206, "S") + BLOCK(266, "K") + BLOCK(326, "Y") +
      '<path ' + THIN + ' d="M196 280h208"/><path ' + THIN + ' d="M210 292h180"/>' +
      '<path ' + G + ' d="M300 108l6 14 15 1-12 9 4 15-13-8-13 8 4-15-12-9 15-1z"/>',
    maproom:
      '<circle ' + G + ' cx="300" cy="200" r="86"/><circle ' + THIN + ' cx="300" cy="200" r="72"/>' +
      '<path ' + G + ' d="M300 118l14 68 68 14-68 14-14 68-14-68-68-14 68-14z"/>' +
      '<path ' + THIN + ' d="M300 200l40-40M300 200l-40-40M300 200l40 40M300 200l-40 40"/><circle ' + DOT + ' cx="300" cy="200" r="5"/>' +
      '<path ' + G + ' d="M296 104l4-10 4 10"/>',
    clockmaker:
      GEAR(268, 204, 62, 12) + GEAR(370, 160, 34, 9) +
      '<circle ' + G + ' cx="268" cy="204" r="34"/><path ' + G + ' d="M268 204v-22M268 204l16 10"/><circle ' + DOT + ' cx="268" cy="204" r="4"/>' +
      '<circle ' + THIN + ' cx="370" cy="160" r="10"/>' +
      '<path ' + THIN + ' d="M356 252c14-10 34-10 48 0M366 266c8-6 20-6 28 0"/>'
  };
  function ROSE(x, y) {
    return '<g transform="translate(' + x + ' ' + y + ')"><circle ' + G + ' r="13"/><path ' + THIN + ' d="M0-5c5 0 6 6 1 7-6 1-8-6-3-10 6-4 13 1 12 8"/></g>';
  }
  function BLOCK(x, ch) {
    return '<g><path ' + G + ' d="M' + x + ' 166h56v76h-56z"/><path ' + THIN + ' d="M' + (x + 6) + ' 172h44v64h-44z"/>' +
      '<text x="' + (x + 28) + '" y="219" text-anchor="middle" font-family="Georgia,serif" font-size="40" font-weight="700" fill="#E5C158">' + ch + '</text></g>';
  }
  function GEAR(cx, cy, r, teeth) {
    var d = "", t = teeth * 2, ro = r, ri = r - r * .16;
    for (var i = 0; i < t; i++) {
      var a0 = (i / t) * Math.PI * 2, a1 = ((i + 1) / t) * Math.PI * 2, rr = i % 2 ? ri : ro;
      d += (i ? "L" : "M") + (cx + Math.cos(a0) * rr).toFixed(1) + " " + (cy + Math.sin(a0) * rr).toFixed(1) +
        "L" + (cx + Math.cos(a1) * rr).toFixed(1) + " " + (cy + Math.sin(a1) * rr).toFixed(1);
    }
    return '<path ' + G + ' d="' + d + 'Z"/>';
  }
  function art(room, lobby) {
    /* lobby: the Lobby's posters show only the upper part of the picture (its name bar sits over the bottom), so the emblem sits higher and smaller */
    var tint = room.tint || "#1A2744";
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">' +
      '<defs><radialGradient id="g" cx="50%" cy="46%" r="70%"><stop offset="0" stop-color="' + tint + '"/><stop offset=".72" stop-color="#0b1426"/><stop offset="1" stop-color="#060b17"/></radialGradient>' +
      '<radialGradient id="l" cx="50%" cy="40%" r="40%"><stop offset="0" stop-color="#fff3c8" stop-opacity=".16"/><stop offset="1" stop-color="#fff3c8" stop-opacity="0"/></radialGradient>' +
      '<pattern id="p" width="14" height="14" patternUnits="userSpaceOnUse"><path d="M0 14L14 0" stroke="#ffffff" stroke-opacity=".025" stroke-width="1"/></pattern></defs>' +
      '<rect width="600" height="400" fill="url(#g)"/><rect width="600" height="400" fill="url(#p)"/><rect width="600" height="400" fill="url(#l)"/>' +
      '<rect x="22" y="22" width="556" height="356" rx="6" fill="none" stroke="#E5C158" stroke-opacity=".38" stroke-width="1.4"/>' +
      '<rect x="30" y="30" width="540" height="340" rx="4" fill="none" stroke="#E5C158" stroke-opacity=".16" stroke-width="1"/>' +
      '<g fill="#E5C158" fill-opacity=".55"><path d="M300 38l4 6-4 6-4-6z"/><path d="M300 350l4 6-4 6-4-6z"/></g>' +
      '<g transform="translate(300 ' + (lobby ? 160 : 206) + ') scale(' + (lobby ? 1 : 1.32) + ') translate(-300 -200)" style="filter:drop-shadow(0 0 6px rgba(229,193,88,.35))">' + (EMBLEM[room.id] || "") + '</g></svg>';
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  ROOMS.forEach(function (r) { if (!r.img) { r.img = art(r); r.lobbyImg = art(r, true); } });

  /* ---------- today on this device ---------- */
  function ymd(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function read(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  /* the week's climb, Monday to Sunday (both open puzzles follow it) */
  var LEVEL = { 1: "Gentle", 2: "Easy", 3: "Steady", 4: "Moderate", 5: "Tricky", 6: "Hard", 0: "Hardest" };
  function today(room) {
    if (!room.daily) return null;
    var now = new Date(), key = ymd(now), y = new Date(now); y.setDate(now.getDate() - 1);
    var rec = read(room.daily.key + key), sk = read(room.daily.streak) || { n: 0, best: 0, last: "" };
    var alive = sk.last === key || sk.last === ymd(y);
    return { solved: !!rec, stars: rec && rec.s || 0, streak: alive ? (sk.n || 0) : 0, best: sk.best || 0 };
  }

  window.BW_PUZZLES = ROOMS;
  window.BWPuzzles = {
    rooms: ROOMS, art: art, today: today, ymd: ymd,
    day: function () { var d = new Date().getDay(); return { name: DAYS[d], level: LEVEL[d], index: (d + 6) % 7 }; },
    LEVEL: LEVEL
  };
})();
