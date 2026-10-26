/* BrainWhim scroll cues (Oct 26): every panel that scrolls (side cards, drawers, menus, pop-up windows, the avatar
   window, mail lists...) gets
     1. a soft fade along its bottom edge while there is more below (it goes away at the end), and
     2. a slim scrollbar with a faint gold thumb, so there's a cue even where the Mac hides scrollbars.
   Panels are found on their own (anything with overflow auto/scroll), so new pages need nothing extra.
   The fade is a small element kept at the bottom of the panel (position: sticky), coloured like the panel.
   (A CSS mask would be simpler, but it switches off the frosted-glass blur of the cards inside.)
   Opt a panel out with data-bws="off".                                                                     */
(function () {
  "use strict";
  if (window.BWScroll) return;
  var FADE = 44, seen = [];
  var css =
    ".bws-sb{scrollbar-width:thin;scrollbar-color:rgba(230,194,90,.45) transparent}" +
    ".bws-sb::-webkit-scrollbar{width:6px;height:6px}" +
    ".bws-sb::-webkit-scrollbar-track{background:transparent}" +
    ".bws-sb::-webkit-scrollbar-thumb{background:rgba(230,194,90,.38);border-radius:3px}" +
    ".bws-sb::-webkit-scrollbar-thumb:hover{background:rgba(230,194,90,.6)}" +
    ".bws-fade{display:block!important;position:-webkit-sticky!important;position:sticky!important;bottom:0!important;left:0;right:0;" +
      "flex:none!important;width:auto!important;height:" + FADE + "px!important;min-height:0!important;padding:0!important;border:0!important;" +
      "margin-left:0!important;margin-right:0!important;margin-bottom:0!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;" +
      "pointer-events:none!important;z-index:5;opacity:0;transition:opacity .25s ease;grid-column:1/-1}" +
    ".bws-fade.on{opacity:1}" +
    ".bws-fade.none{display:none!important}" +
    "@media (prefers-reduced-motion:reduce){.bws-fade{transition:none}}";

  function ready(fn) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn); else fn(); }
  /* the colour to fade into: the panel's own background, a little stronger; see-through panels fade into a soft shadow */
  function fadeColour(el) {
    var cs = getComputedStyle(el), m = /rgba?\(([^)]+)\)/.exec(cs.backgroundColor || ""), p = m ? m[1].split(",").map(function (x) { return parseFloat(x); }) : [0, 0, 0, 0];
    var a = p.length > 3 ? p[3] : 1;
    if (a < 0.05) return "rgba(4,8,22,.55)";
    return "rgba(" + Math.round(p[0]) + "," + Math.round(p[1]) + "," + Math.round(p[2]) + "," + Math.min(0.96, a + 0.22).toFixed(2) + ")";
  }
  function scrollsY(el) {
    if (!el || el.nodeType !== 1 || el.__bws || /^(TEXTAREA|SELECT|INPUT|HTML|BODY|IFRAME)$/.test(el.tagName)) return false;
    if (el.getAttribute("data-bws") === "off" || el.classList.contains("bws-fade")) return false;
    var oy = getComputedStyle(el).overflowY;
    return oy === "auto" || oy === "scroll";
  }
  function attach(el) {
    var f = document.createElement("i"); f.className = "bws-fade none"; f.setAttribute("aria-hidden", "true");
    var S = { el: el, f: f, t: 0 };
    el.__bws = S; seen.push(S);
    el.addEventListener("scroll", function () { update(S); }, { passive: true });
    if (window.ResizeObserver) new ResizeObserver(function () { soon(S); }).observe(el);
    if (window.MutationObserver) new MutationObserver(function (list) {
      for (var i = 0; i < list.length; i++) { var r = list[i]; if (!(r.target === el && r.type === "childList" && [].every.call(r.addedNodes, isFade) && [].every.call(r.removedNodes, isFade))) { soon(S); return; } }
    }).observe(el, { childList: true, subtree: true, characterData: true });
    update(S);
  }
  function isFade(n) { return n && n.classList && n.classList.contains("bws-fade"); }
  function soon(S) { if (S.t) return; S.t = requestAnimationFrame(function () { S.t = 0; update(S); }); }
  function update(S) {
    var el = S.el, f = S.f;
    if (!el.isConnected) return;
    var horiz = el.scrollWidth > el.clientWidth + 4 && el.scrollHeight <= el.clientHeight + 4;
    var more = el.scrollHeight > el.clientHeight + 4 && el.clientHeight > 40 && !horiz;
    el.classList.toggle("bws-sb", more);
    if (!more) { f.classList.add("none"); f.classList.remove("on"); return; }
    if (el.lastChild !== f) el.appendChild(f);              /* keep it last, even after the panel's contents are replaced */
    var cs = getComputedStyle(el), gap = parseFloat(cs.rowGap) || 0;
    if (!/grid|flex/.test(cs.display)) gap = 0;
    f.style.marginTop = (-(FADE + gap)) + "px";            /* takes no room: the panel scrolls exactly as before */
    var bl = parseFloat(cs.borderBottomLeftRadius) || 0, br = parseFloat(cs.borderBottomRightRadius) || 0;
    f.style.borderRadius = "0 0 " + Math.max(0, br - 1) + "px " + Math.max(0, bl - 1) + "px";
    f.style.background = "linear-gradient(to bottom,rgba(0,0,0,0)," + fadeColour(el) + ")";
    f.classList.remove("none");
    f.classList.toggle("on", el.scrollTop + el.clientHeight < el.scrollHeight - 4);
  }
  var scanT = 0;
  function scan() {
    scanT = 0;
    var all = document.body ? document.body.getElementsByTagName("*") : [];
    for (var i = 0; i < all.length; i++) if (scrollsY(all[i])) attach(all[i]);
    seen.forEach(update);
  }
  function scanSoon(ms) { clearTimeout(scanT); scanT = setTimeout(scan, ms || 120); }
  ready(function () {
    var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    scan(); setTimeout(scan, 900); window.addEventListener("load", function () { scanSoon(200); });
    window.addEventListener("resize", function () { scanSoon(200); });
    /* drawers, menus and windows open on a tap: look again once they've had a moment to appear */
    ["click", "touchend", "keydown"].forEach(function (ev) { document.addEventListener(ev, function () { scanSoon(350); }, { passive: true, capture: true }); });
    if (window.MutationObserver) new MutationObserver(function (list) {
      for (var i = 0; i < list.length; i++) if (list[i].addedNodes.length) { scanSoon(150); return; }
    }).observe(document.body, { childList: true });
  });
  window.BWScroll = { scan: scan };
})();
