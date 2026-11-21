#!/usr/bin/env python3
"""One header everywhere (Nov 20, Navigation Audit B). Re-runnable: rewrites the link lists in every grown-up
page's header, phone menu and old-style side menu to the canonical order. Dry run by default; pass --apply OUTDIR
to write changed files into OUTDIR (then copy them over). Kids' pages (kids.js) are left alone.
Canonical bar: Home · Play · Puzzles · Cards · Board Games · Learn · Create · Kids' Corner (Learn joined Nov 21 with the Reading Room; Create the same evening with the Writing Desk).
Live only in menus, under Coming Soon, until a room of theirs opens."""
import re, sys, glob, os
APPLY = sys.argv[2] if len(sys.argv) > 2 and sys.argv[1] == "--apply" else None
CANON = [("index.html","Home"),("play.html","Play"),("puzzles.html","Puzzles"),("lobby.html?cat=cards","Cards"),("lobby.html","Board Games"),("learn.html","Learn"),("create.html","Create"),("kids.html","Kids' Corner")]
HREFS = {h for h,_ in CANON} | {"learn.html","live.html","create.html","quickplays.html"}
ON = {"index.html":"index.html","play.html":"play.html","puzzles.html":"puzzles.html","lobby.html":"lobby.html","learn.html":"learn.html","create.html":"create.html"}
UPS = {"quickplays.html":"puzzles.html","member.html":"lobby.html"}   # pages with no phone menu: the one link phones keep
def home_of(src):
    m = re.search(r'home:\s*"([^"]+)"', src); return m.group(1) if m else None
def bar(page, src, cls=""):
    on, up = ON.get(page), home_of(src) if "parlor-kit.js" in src else UPS.get(page)
    out = []
    for h,l in CANON:
        c = [x for x in [cls, "on" if h == on else "", "up" if h == up else ""] if x]
        out.append('<a%s href="%s">%s</a>' % (' class="%s"' % " ".join(c) if c else "", h, l))
    return "".join(out)
STD_A = re.compile(r'<a(?: class="[^"]*")? href="([^"#]+)"[^>]*>[^<]*</a>')
def fix_hdr(page, s, log):
    def rep(m):
        inner = m.group(2)
        keep = STD_A.sub(lambda a: "" if a.group(1) in HREFS and 'id=' not in a.group(0) else a.group(0), inner)
        lead = re.match(r'\s*', inner).group(0); trail = re.search(r'\s*$', inner).group(0)
        if page == "quickplays.html":   # its Stats button stays first
            btn = re.search(r'<button[^>]*id="btnStats"[^>]*>.*?</button>', keep).group(0)
            new = lead + btn + bar(page, s) + keep.replace(btn, "").strip() + trail
        else:
            new = lead + bar(page, s) + keep.strip() + trail
        log.append("hdr"); return m.group(1) + new + m.group(3)
    return re.sub(r'(<(?:nav|div) class="hdr">)(.*?)(</(?:nav|div)>)', rep, s, count=1, flags=re.S)
SOON = '<span style="display:block;padding:6px 18px 2px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.45)">Coming Soon</span>'
def phone_menu(page):
    about = '<a href="#about" data-jump="about">About BrainWhim</a>' if page == "index.html" else '<a href="index.html#about">About BrainWhim</a>'
    return ('\n  <a href="index.html">Home</a><a href="play.html">Play</a><a href="puzzles.html">Today\'s Puzzles</a><a href="lobby.html">Board Game Lobby</a>'
            '<a href="lobby.html?cat=cards">Card Lobby</a><a href="quickplays.html">Quick Plays</a><a href="learn.html">Learn</a><a href="create.html">Create</a><a href="kids.html">Kids\' Corner</a>'
            '\n  <hr>' + SOON + '<a href="live.html">Live</a>\n  <hr>' + about + '\n')
def fix_pm(page, s, log):
    n = len(re.findall(r'<nav class="phone-menu"', s))
    if not n: return s
    log.append("phone-menu")
    return re.sub(r'(<nav class="phone-menu"[^>]*>).*?(</nav>)', lambda m: m.group(1) + phone_menu(page) + m.group(2), s, count=1, flags=re.S)
def fix_old(page, s, log):
    if 'class="left-menu"' not in s: return s
    links = ''.join('\n            <a href="%s" class="left-menu-link">%s</a>' % x for x in [("index.html","Home"),("play.html","Play"),("puzzles.html","Today's Puzzles"),
        ("lobby.html","Board Game Lobby"),("lobby.html?cat=cards","Card Lobby"),("quickplays.html","Quick Plays"),("learn.html","Learn"),("create.html","Create"),("kids.html","Kids' Corner"),
        ("index.html#about","About BrainWhim"),("terms.html","Terms"),("refunds.html","Refunds"),("privacy.html","Privacy"),("disclaimers.html","Disclaimers")]) + '\n        '
    s, a = re.subn(r'(<div class="left-menu-links">).*?(</div>)', lambda m: m.group(1) + links + m.group(2), s, count=1, flags=re.S)
    play = ('<h3><a href="play.html">Play</a></h3>\n                <ul>\n                    <li><a href="puzzles.html">Today\'s Puzzles</a></li>\n'
            '                    <li><a href="lobby.html">Board Games</a></li>\n                    <li><a href="lobby.html?cat=cards">Card Games</a></li>\n'
            '                    <li><a href="quickplays.html">Quick Plays</a></li>\n                </ul>\n            ')
    s, b = re.subn(r'(<div class="menu-pillar" id="menu-play">\s*).*?(</div>)', lambda m: m.group(1) + play + m.group(2), s, count=1, flags=re.S)
    nav = '\n' + ''.join('            <a href="%s" class="nav-link">%s</a>\n' % x for x in CANON) + '        '
    s, c = re.subn(r'(<nav class="header-navigation-menu">).*?(</nav>)', lambda m: m.group(1) + nav + m.group(2), s, count=1, flags=re.S)
    log.append("old-menu %d%d%d" % (a, b, c)); return s
STYLE = {
 "old": "@media (min-width:993px){.header-navigation-menu{gap:28px!important}.nav-link{white-space:nowrap}}"
        "@media (min-width:993px) and (max-width:1439px){.header-widget-box{display:none!important}}"
        "@media (min-width:993px) and (max-width:1180px){.header-navigation-menu{gap:20px!important}.nav-link{font-size:15px!important}}",
 "quickplays.html": ".hdr a{white-space:nowrap}@media (max-width:900px){.hdr a:not(.up){display:none}}",
 "member.html": ".hdr a{white-space:nowrap}@media (max-width:560px){.hdr a:not(.up){display:none}}",
}
def add_style(page, s, log):
    css = STYLE.get("old" if 'class="left-menu"' in s else page)
    if not css or 'id="bw-hdr-pass"' in s: return s
    log.append("style"); return s.replace("</head>", '<style id="bw-hdr-pass">/* tools/header-pass.py (Nov 20) */' + css + "</style>\n</head>", 1)
changed = 0
for f in sorted(glob.glob("*.html")):
    s = open(f, encoding="utf-8").read()
    if "kids.js" in s or len(s) < 1500: continue
    log = []; t = add_style(f, fix_old(f, fix_pm(f, fix_hdr(f, s, log), log), log), log)
    if t != s:
        changed += 1; print("%-20s %s" % (f, ", ".join(log)))
        if APPLY: open(os.path.join(APPLY, f), "w", encoding="utf-8").write(t)
print("changed:", changed, "(dry run)" if not APPLY else "-> " + APPLY)
