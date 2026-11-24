/* BrainWhim's social accounts (Nov 24, 2026). One list for the whole grown-up side: footers, the phone menus and every room's Menu card.
   NEVER load this on a kids' page (no links out on the kids' side).
   To add or change an account, edit BW_SOCIAL here and bump bw-social.js?v= on the pages that load it (parlor-kit.js loads it by itself: bump its sj.src too).
   Icons (Nov 24, Judy): each platform's OFFICIAL one-color icon from its own brand kit, unchanged except for size and trimming the empty margin
   (originals in _private/social-icons/). White icons on dark backgrounds; on a light background (dark text) the black/brand-color versions (-k).
   Don't recolor, outline, rotate or restyle them: the platforms' brand rules forbid it. Substack came only in orange: substack.png is its white one-color shape. */
(function () {
  if (window.BWSocial) return;
  var V = "1124a";
  var BW_SOCIAL = [
    { name: "Instagram", f: "instagram.svg", url: "https://www.instagram.com/brainwhim" },
    { name: "Threads", f: "threads.svg", w: .9, url: "https://www.threads.com/@brainwhim" },
    { name: "Facebook", f: "facebook.png", url: "https://www.facebook.com/brainwhimstudios" },
    { name: "TikTok", f: "tiktok.svg", w: .89, url: "https://www.tiktok.com/@brainwhim" },
    { name: "YouTube", f: "youtube.png", w: 1.43, url: "https://www.youtube.com/@BrainWhimStudios" },
    { name: "X", f: "x.svg", url: "https://x.com/brainwhim" },
    { name: "Bluesky", f: "bluesky.svg", w: 1.13, url: "https://bsky.app/profile/brainwhim.bsky.social" },
    { name: "Substack", f: "substack.png", w: .88, url: "https://brainwhim.substack.com" }
  ];
  var CSS =
    ".bw-social{display:block;margin:0 0 10px;text-align:center;--bwso:22px}" +
    ".bw-social .bwso-k{display:block;margin:0 0 9px;font-size:10.5px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;opacity:.75;line-height:1.2}" +
    ".bw-social .bwso-l{display:inline-flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:12px 20px}" +
    "@media (max-width:480px){.bw-social .bwso-l{gap:10px 12px}}" +
    ".bw-social a.bwso{display:inline-flex!important;align-items:center;justify-content:center;margin:0!important;padding:4px!important;border:0!important;background:none!important;line-height:0;border-radius:6px;transition:transform .15s}" +
    ".bw-social a.bwso img{display:block;height:var(--bwso);width:auto}" +
    "@media (hover:hover){.bw-social a.bwso:hover{transform:translateY(-2px)}}" +
    ".bw-social a.bwso:focus-visible{outline:2px solid #F2BE45;outline-offset:2px}" +
    /* Home, Play, Puzzles, Learn, Live, Create: the phone ☰ menu */
    ".phone-menu .bw-social{margin:2px 0 4px;padding:6px 8px 4px;text-align:left}" +
    ".phone-menu .bw-social .bwso-l{justify-content:flex-start;gap:10px 16px}" +
    /* the legal pages' footer (a row of three): the follow line gets its own row underneath */
    ".site-footer:has(.bw-social){flex-wrap:wrap;position:relative;z-index:1}.site-footer .bw-social{flex:1 0 100%;order:9;margin:10px 0 0}" +
    /* the room Menu card (parlor-kit) */
    ".pk-social{margin:8px 0 0;--bwso:18px}.pk-social .bwso-k{font-size:9.5px;margin-bottom:6px}.pk-social .bwso-l{gap:8px 13px}";
  function css() {
    if (document.getElementById("bw-social-css")) return;
    var s = document.createElement("style"); s.id = "bw-social-css"; s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }
  /* light background? (the element's own text is dark) */
  function onLight(el) {
    var m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/.exec(getComputedStyle(el).color || "");
    if (!m) return false;
    return (0.2126 * m[1] + 0.7152 * m[2] + 0.0722 * m[3]) / 255 < 0.45;
  }
  function html(label, dark) {
    return (label === false ? "" : '<span class="bwso-k">' + (label || "Follow BrainWhim") + "</span>") +
      '<span class="bwso-l">' + BW_SOCIAL.map(function (s) {
        var f = dark ? s.f.replace(/\.(svg|png)$/, "-k.$1") : s.f;
        return '<a class="bwso" href="' + s.url + '" target="_blank" rel="noopener" aria-label="BrainWhim on ' + s.name + ' (opens in a new tab)" title="' + s.name + '">' +
          '<img src="so/' + f + '?v=' + V + '" alt="" width="' + Math.round(22 * (s.w || 1)) + '" height="22"></a>';
      }).join("") + "</span>";
  }
  function fill(root) {
    css();
    [].forEach.call((root || document).querySelectorAll("[data-bw-social]"), function (el) {
      if (el.getAttribute("data-bwso-done")) return;
      el.classList.add("bw-social"); el.innerHTML = html(el.getAttribute("data-bw-social") || "", onLight(el)); el.setAttribute("data-bwso-done", "1");
    });
  }
  window.BWSocial = { links: BW_SOCIAL, html: html, fill: fill };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { fill(); }); else fill();
})();
