/* BrainWhim's social accounts (Nov 24, 2026). One list for the whole grown-up side: footers, the phone menus and every room's Menu card.
   NEVER load this on a kids' page (no links out on the kids' side).
   To add or change an account, edit BW_SOCIAL here and bump bw-social.js?v= on the pages that load it (parlor-kit.js loads it by itself: bump BWS_V there too).
   Text links on purpose: no copies of the platforms' logos. */
(function () {
  if (window.BWSocial) return;
  var BW_SOCIAL = [
    { name: "Instagram", url: "https://www.instagram.com/brainwhim" },
    { name: "Threads", url: "https://www.threads.com/@brainwhim" },
    { name: "Facebook", url: "https://www.facebook.com/brainwhimstudios" },
    { name: "TikTok", url: "https://www.tiktok.com/@brainwhim" },
    { name: "YouTube", url: "https://www.youtube.com/@BrainWhimStudios" },
    { name: "X", url: "https://x.com/brainwhim" },
    { name: "Bluesky", url: "https://bsky.app/profile/brainwhim.bsky.social" }
  ];
  var CSS =
    ".bw-social{display:block;margin:0 0 8px;text-align:center;line-height:1.9}" +
    ".bw-social .bwso-k{display:block;margin:0 0 1px;font-size:10.5px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;opacity:.75}" +
    ".bw-social .bwso-l{display:inline-flex;flex-wrap:wrap;justify-content:center;column-gap:4px;row-gap:0}" +
    ".bw-social a.bwso{color:inherit!important;margin:0 6px!important;text-decoration:none;border-bottom:1px solid currentColor;padding-bottom:1px;opacity:.9;white-space:nowrap}" +
    ".bw-social a.bwso:hover{opacity:1;border-bottom-width:2px}" +
    ".bw-social a.bwso:focus-visible{outline:2px solid #F2BE45;outline-offset:3px;border-radius:2px}" +
    /* Home, Play, Puzzles, Learn, Live, Create: the phone ☰ menu */
    ".phone-menu .bw-social{margin:2px 0 4px;padding:6px 8px 2px;text-align:left;font-size:13px}" +
    ".phone-menu .bw-social a.bwso{display:inline!important;padding:0 0 1px!important;margin:0 12px 0 0!important;font-weight:600!important;font-size:13px!important;border-radius:0!important;background:none!important}" +
    ".phone-menu .bw-social .bwso-l{justify-content:flex-start}" +
    /* the legal pages' footer (a row of three): the follow line gets its own row underneath */
    ".site-footer:has(.bw-social){flex-wrap:wrap}.site-footer .bw-social{flex:1 0 100%;order:9;margin:6px 0 0;font-size:13px}" +
    /* the room Menu card (parlor-kit) */
    ".pk-social{margin:4px 0 0;font-size:11.5px;opacity:.8}.pk-social .bwso-k{font-size:9.5px}";
  function css() {
    if (document.getElementById("bw-social-css")) return;
    var s = document.createElement("style"); s.id = "bw-social-css"; s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }
  function html(label) {
    return (label === false ? "" : '<span class="bwso-k">' + (label || "Follow BrainWhim") + "</span>") +
      '<span class="bwso-l">' + BW_SOCIAL.map(function (s) {
        return '<a class="bwso" href="' + s.url + '" target="_blank" rel="noopener" aria-label="BrainWhim on ' + s.name + ' (opens in a new tab)">' + s.name + "</a>";
      }).join("") + "</span>";
  }
  function fill(root) {
    css();
    [].forEach.call((root || document).querySelectorAll("[data-bw-social]"), function (el) {
      if (el.getAttribute("data-bwso-done")) return;
      el.classList.add("bw-social"); el.innerHTML = html(el.getAttribute("data-bw-social") || ""); el.setAttribute("data-bwso-done", "1");
    });
  }
  window.BWSocial = { links: BW_SOCIAL, html: html, fill: fill };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { fill(); }); else fill();
})();
