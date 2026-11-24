#!/usr/bin/env python3
# Builds learn.html from index.html (Home), Nov 20. Run in the site folder.
import re, sys, importlib.util
spec=importlib.util.spec_from_file_location('cfg',sys.argv[1]); cfg=importlib.util.module_from_spec(spec); spec.loader.exec_module(cfg); C=cfg.C
s = open("index.html", encoding="utf-8").read()
def R(old, new, n=1):
    global s
    c = s.count(old)
    assert c == n, (c, old[:80])
    s = s.replace(old, new)

# ---- head ----
s = re.sub(r"<title>[^<]*</title>", "<title>@@TITLE@@</title>", s, count=1)
s = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="@@META@@">', s, count=1)
R('<script src="bw-signup.js?v=1120c"></script>', '<script src="bw-signup.js?v=1120c"></script>\n<script src="bw-qr.js?v=1120a"></script>')

CSS = r"""
/* ---------- Learn (Nov 20): the Library Wing ---------- */
.core{background:radial-gradient(circle at 26% 22%,rgba(255,255,255,.2) 0%,transparent 24%),radial-gradient(circle at 78% 80%,rgba(0,8,20,.4) 0%,transparent 50%),#071018 @@PLANET@@ center/cover;
  box-shadow:0 10px 24px rgba(0,0,0,.42),@@GLOW@@,inset -18px -20px 28px rgba(0,0,0,.42),inset 12px 10px 16px rgba(255,255,255,.16)}
/* the four rooms ride the rings as round windows into their photos; their names show below */
/* Nov 24: the room photo curved onto a sphere (hm/, tools/moon-curve.py) over the flat photo as a fallback, like Home's moons */
.orb.ph{background-size:cover,cover,100% 100%,170%;background-position:center,center,center,center 64%}
.orb.ph .lbl{width:auto;height:auto;padding:3px 10px;margin:0;overflow:visible;clip:auto;clip-path:none;border:1px solid rgba(255,255,255,.22);background:rgba(6,12,28,.62)}
.orb.ph .soonb{position:absolute;left:50%;top:-6px;transform:translate(-50%,-100%);padding:2px 7px;border-radius:10px;background:rgba(15,23,42,.8);border:1px solid rgba(229,193,88,.6);
  font-size:8.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--gold-b);white-space:nowrap;pointer-events:none;z-index:3}
.intro{max-width:760px;margin:0 0 26px}
.intro h1{margin:0 0 6px;font-size:30px;font-weight:700}
.intro p{margin:0;font-size:14px;line-height:1.6;color:rgba(255,255,255,.78)}
.wing{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.wroom{position:relative;border-radius:12px;overflow:hidden;background:var(--glass);border:1px solid var(--line);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);scroll-margin-top:16px}
.wroom img{display:block;width:100%;height:auto;aspect-ratio:3/2;object-fit:cover}
.wroom .tag{position:absolute;top:10px;left:10px;padding:3px 8px;border-radius:4px;background:rgba(15,23,42,.8);border:1px solid rgba(229,193,88,.6);font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--gold-b)}
.wroom .wb{padding:14px 16px 16px}
.wroom small{display:block;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;@@KC@@}
.wroom h3{margin:3px 0 6px;font-size:19px}
.wroom p{margin:0;font-size:13px;line-height:1.55;color:rgba(255,255,255,.78)}
.wroom .try{margin-top:10px;font-size:12px;color:rgba(255,255,255,.62)}
.wroom .try a{color:var(--gold-b);font-weight:700;text-decoration:none}
.wroom .tag.open{background:rgba(229,193,88,.92);color:#2a1d05;border-color:#f2be45}
.wroom.open{border-color:rgba(229,193,88,.55)}
.wroom h3 a{color:inherit;text-decoration:none}
.wroom .go{margin-top:12px}.wroom .go a{display:inline-block;padding:9px 14px;border-radius:6px;background:linear-gradient(180deg,#ffe7a6,#e9c46a);color:#2a1d05;font-size:13px;font-weight:700;text-decoration:none}
.wroom.lit{box-shadow:0 0 0 2px rgba(229,193,88,.8),0 0 30px rgba(120,190,255,.35);transition:box-shadow .3s}
/* For families: a grown-up opens a kids' tool here, or on the child's own device (CrossPromotion note) */
.fam{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.fcard{display:grid;grid-template-columns:92px minmax(0,1fr);gap:14px;padding:14px;border-radius:12px;background:var(--glass);border:1px solid rgba(214,190,255,.28);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
.fcard>img{width:92px;height:92px;border-radius:14px;object-fit:cover;box-shadow:0 4px 12px rgba(0,0,0,.35)}
.fcard b{display:block;font-size:15px}
.fcard .path{margin:3px 0 6px;font-size:11px;font-weight:600;color:#d8c4ff;line-height:1.45}
.fcard p{margin:0;font-size:12.5px;line-height:1.5;color:rgba(255,255,255,.76)}
.fcard .acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.fbtn{font:700 12px Montserrat,sans-serif;padding:8px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.06);color:#fff;text-decoration:none;cursor:pointer}
.fbtn:hover{border-color:rgba(229,193,88,.7);background:rgba(255,255,255,.1)}
.fbtn.go{border-color:#F2BE45;background:linear-gradient(180deg,#F6CF6A,#E0A82E);color:#1a1205}
.fqr{grid-column:1/-1;display:none;align-items:center;gap:14px;margin-top:2px;padding:12px;border-radius:10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12)}
.fqr.on{display:flex}
.fqr .code{flex:none;padding:6px;border-radius:8px;background:#fff;line-height:0}
.fqr p{font-size:12px}
.fqr .addr{display:block;margin:4px 0 8px;font-size:11.5px;color:rgba(255,255,255,.6);word-break:break-all}
.fnote{margin:12px 0 0;font-size:12px;color:rgba(255,255,255,.6)}
.tracks{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.tracks li{padding:10px 12px;border-radius:8px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);font-size:12.5px;color:rgba(255,255,255,.75);line-height:1.45}
.tracks b{display:block;color:#fff;font-size:13px}
@media (max-width:1180px) and (min-width:901px){ .fam{grid-template-columns:1fr} }
@media (max-width:900px){ .intro h1{font-size:24px} .wing,.fam{grid-template-columns:1fr} .orb.ph .soonb{display:none} }
@media (max-width:420px){ .fcard{grid-template-columns:72px minmax(0,1fr)} .fcard>img{width:72px;height:72px} .fqr{flex-direction:column;align-items:flex-start} }
"""
R("</style>\n<script src=\"bw-auth.js", CSS + "</style>\n<script src=\"bw-auth.js")

# ---- header: Learn isn't in the bar yet, so nothing is lit ----
R('<a class="on" href="index.html">Home</a>', '<a href="index.html">Home</a>')

# ---- everything below the hero ----
a = s.index('    <div class="rooms" id="rooms">')
b = s.index('    <footer>')
BODY = r"""    <div class="rooms" id="rooms">
      <section class="sec intro">
        <p class="kick">@@KICK@@</p>
        @@H1@@
        <p>@@INTRO@@</p>
      </section>

      <section class="sec" id="wing">
        <div class="sec-h"><div><p class="kick">Four Rooms</p><h2>What's Being Built</h2></div></div>
        <div class="wing" id="wingRooms"></div>
      </section>

      <section class="sec">
        <div class="sec-h"><div><p class="kick">Open Now</p><h2>Try Something Today</h2><p>@@TRYLINE@@</p></div>
          <div class="sec-r"><button class="arrow" data-row="rowTry" data-dir="-1" aria-label="Scroll back">‹</button><button class="arrow" data-row="rowTry" data-dir="1" aria-label="Scroll on">›</button><a class="more" href="puzzles.html">All Puzzles</a></div></div>
        <div class="row" id="rowTry"></div>
      </section>

      <section class="sec" id="families">
        <div class="sec-h"><div><p class="kick">For Families</p><h2>@@FAMH2@@</h2><p>@@FAMLINE@@</p></div>
          <div class="sec-r"><a class="more" href="kids.html">Enter the Kids' Corner</a></div></div>
        <div class="fam" id="famCards"></div>
        <p class="fnote">The path under each name is the way in from the Kids' Corner door, so you can walk your child there yourself.</p>
      </section>

      <section class="sec">
        <div class="box" @@SIGNUP@@></div>
      </section>

      <section class="sec two" id="about">
        <div class="box">
          <p class="kick">@@PLANKICK@@</p><h2>@@PLANH2@@</h2>
          <p>@@PLANP@@</p>
          <ul class="tracks">
@@TRACKS@@
          </ul>
        </div>
        <div class="box">
          <p class="kick">How the House Works</p><h2>Visitor, House Guest, Club Member</h2>
          <ul class="tiers">
            <li><b>Visitor</b>Try any game or today's puzzles on this device. No account needed.</li>
            <li><b>House Guest</b>A free account: unlimited games, online play, points and streaks saved.</li>
            <li class="club"><b>Club Member</b>Every table and board, Club avatars, the Streak Shield, more points a day, @@CLUBROOMS@@</li>
          </ul>
          <p style="margin-top:12px">@@ASK@@ Write to <a href="mailto:support@brainwhim.com" style="color:var(--gold-b)">support@brainwhim.com</a>. We read every note.</p>
        </div>
      </section>
    </div>
"""
s = s[:a] + BODY + s[b:]
R('<footer><nav class="pillars" aria-label="The four pillars"><a href="learn.html">Learn</a>',
  '<footer><nav class="pillars" aria-label="The four pillars"><a href="index.html">Home</a><a href="learn.html">Learn</a>')

# ---- side panels: Learn's own Opening Next; no What's New here ----
a = s.index('  <section class="panel" id="pNew">'); b = s.index('  <section class="panel" id="pLadder">')
s = s[:a] + """  <section class="panel" id="pNext">
    @@NEXTH@@
    <ul class="nextl">
@@NEXTLI@@
    </ul>
  </section>
""" + s[b:]
R('<button type="button" data-open="pNew"><span class="ico">✦</span>New</button>', '<button type="button" data-open="pNext"><span class="ico">✦</span>Next</button>')
R('var SIDES={L:["pSeat","pToday","pClub"], R:["pNew","pNext","pMail"]}', 'var SIDES={L:["pSeat","pToday","pClub"], R:["pNext","pMail","pLadder"]}')
R(' if(id==="pNew") $("winBody").appendChild($("pNext"));', '')

# ---- the script: rooms, try-now, families ----
a = s.index('/* ---------- the rooms ---------- */'); b = s.index('/* ---------- today\'s puzzles (this device) ---------- */')
JS = r"""/* ---------- Learn's rooms (Pillars note, Nov 3; photos pw/, HomeCards-Prompts) ---------- */
@@ROOMS@@
function pz(id){ var P=window.BWPuzzles; if(!P) return null; for(var i=0;i<P.rooms.length;i++) if(P.rooms[i].id===id) return P.rooms[i]; return null; }
$("wingRooms").innerHTML=ROOMS.map(function(r){
  var t=r.try.map(pz).filter(Boolean).map(function(p){ return '<a href="'+p.page+'">'+esc(p.name)+'</a>'; }).join(" or ");
  if(r.page) return '<article class="wroom open" id="r-'+r.id+'"><span class="tag open">Open Now</span><a href="'+r.page+'"><img src="pw/@@PW@@-'+r.id+'-sm.jpg?v=1120a" alt="" width="1000" height="667" loading="lazy"></a>'+   /* an open room (Nov 21) */
    '<div class="wb"><small>'+esc(r.kind)+'</small><h3><a href="'+r.page+'">'+esc(r.name)+'</a></h3><p>'+esc(r.line)+'</p><p class="go"><a href="'+r.page+'">'+esc(r.cta||"Enter the Room")+' \u2192</a></p></div></article>';
  return '<article class="wroom" id="r-'+r.id+'"><span class="tag">Opening Soon</span><img src="pw/@@PW@@-'+r.id+'-sm.jpg?v=1120a" alt="" width="1000" height="667" loading="lazy">'+
    '<div class="wb"><small>'+esc(r.kind)+'</small><h3>'+esc(r.name)+'</h3><p>'+esc(r.line)+'</p>'+(t?'<p class="try">Until it opens, try '+t+'.</p>':'')+'</div></article>';
}).join("");
function pwOn(src,fn){ var i=new Image(); i.onload=function(){ fn(src); }; i.src=src; }

/* For families (CrossPromotion pairs for Learn): a grown-up page may open a kids' page directly */
@@FAM@@
var SITE="https://brainwhim.com/";
$("famCards").innerHTML=FAM.map(function(f,i){
  return '<div class="fcard"><img src="'+f[2]+'" alt="" width="92" height="92" loading="lazy"><div><b>'+esc(f[0])+'</b><div class="path">Kids\' Corner → '+esc(f[3])+'</div><p>'+esc(f[4])+'</p>'+
    '<div class="acts"><a class="fbtn go" href="'+f[1]+'">Open It Now</a><button class="fbtn" type="button" data-qr="'+i+'" aria-expanded="false">On Your Child\'s Device</button></div></div>'+
    '<div class="fqr" id="fqr'+i+'"></div></div>';
}).join("");
[].forEach.call(document.querySelectorAll("[data-qr]"),function(b){ b.onclick=function(){
  var i=+b.dataset.qr, box=$("fqr"+i), url=SITE+FAM[i][1], on=!box.classList.contains("on");
  if(on&&!box.innerHTML){
    var code=""; try{ code=window.BWQR?BWQR.svg(url,{px:120}):""; }catch(e){}
    box.innerHTML=(code?'<div class="code">'+code+'</div>':'')+'<div><p>Point your child\'s tablet camera at the code, or send yourself the link.</p><span class="addr">'+esc(url.replace("https://",""))+'</span><button class="fbtn" type="button">Copy Link</button></div>';
    var cb=box.querySelector("button");
    cb.onclick=function(){ function ok(){ cb.textContent="Copied ✓"; setTimeout(function(){ cb.textContent="Copy Link"; },1800); }
      if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(ok,function(){ prompt("Copy this link:",url); });
      else prompt("Copy this link:",url); };
  }
  box.classList.toggle("on",on); b.setAttribute("aria-expanded",on);
}; });

"""
s = s[:a] + JS + s[b:]

# today's panel: keep the day list; the puzzle row becomes Learn's "Try Something Today" (its eight paired rooms)
R('  $("todayKick").textContent=d.name+"\'s Puzzles · "+d.level;\n', '')
a = s.index('  $("todayLine").textContent='); b = s.index('  }).join("");\n}\ntodayPanel();')
s = s[:a] + """  var want=[]; ROOMS.forEach(function(r){ want=want.concat(r.try); });
  $("rowTry").innerHTML=want.map(function(id){ for(var i=0;i<items.length;i++) if(items[i].r.id===id) return items[i]; return null; }).filter(Boolean).map(function(x){
    var tag=x.t.solved?'<span class="tag ok">Solved ✓</span>':'';
    return '<a class="room" href="'+x.r.page+'">'+tag+'<img src="'+x.r.img+'" alt="" width="1000" height="667" loading="lazy"><div><b>'+esc(x.r.name)+'</b><small>'+
      (x.t.streak?'🔥 '+x.t.streak+'-day streak · ':'')+esc(x.r.about)+'</small></div></a>';
""" + s[b:]
R(C['DAYOLD'], C['DAYNEW'])

# ---- the system: Learn's planet in the middle, its four rooms on the rings, each trailed by two open puzzle rooms ----
a = s.index('var CATS=['); b = s.index('var G_DESK =')
s = s[:a] + """var AT=[[71,-12,-134],[288,188,124],[41,-30,-114],[137,79,-3]], ATP=[[80,2,-130],[296,180,136],[37,-25,-104],[211,109,5]];
/* rooms with orb:false (the Book Club) ride as a moon of another room (its `moon`) instead of a ring of their own (Nov 23) */
var CATS=ROOMS.filter(function(r){ return r.orb!==false; }).map(function(r,i){ return {name:r.name, sub:(r.page?"Open now · ":"Opening Soon · ")+r.kind, href:r.page||"#r-"+r.id, open:!!r.page, img:"pw/@@PW@@-"+r.id+"-sm.jpg?v=1120a", glow:r.glow, at:AT[i], atP:ATP[i], ph:1,
  moons:(r.moon?[r.moon]:[]).concat(r.try.map(pz).filter(Boolean).map(function(p){ return [p.name,p.img,p.page,"Open now · today's puzzle"]; })).slice(0,2)}; });
""" + s[b:]
R('o.style.setProperty("--img","url(\'"+c.img+"\')");', 'o.style.setProperty("--img",c.ph?moonBg(c.img):"url(\'"+c.img+"\')");')
R('var o=document.createElement("a"); o.href=c.href; o.className="orb";', 'var o=document.createElement("a"); o.href=c.href; o.className="orb"+(c.ph?" ph":"");')
R("o.innerHTML='<span class=\"lbl\" style=\"font-size:'+G.font+'px\">'+c.name+'</span>';",
  "o.innerHTML='<span class=\"lbl\" style=\"font-size:'+(c.ph?G.font*.82:G.font)+'px\">'+c.name+'</span>';\n    if(c.ph&&!c.open) o.addEventListener(\"click\",function(e){ e.preventDefault(); goRoom(c.href.slice(1)); });")
R("var G_DESK ={bw:900,bh:630,core:168,", "function goRoom(id){ var el=$(id); if(!el) return; $(\"lane\").scrollTo({top:el.getBoundingClientRect().top-$(\"lane\").getBoundingClientRect().top+$(\"lane\").scrollTop-16,behavior:\"smooth\"}); el.classList.add(\"lit\"); setTimeout(function(){ el.classList.remove(\"lit\"); },1600); }\nvar G_DESK ={bw:900,bh:630,core:168,")
R('$("cue").onclick=function(){ $("lane").scrollTo({top:$("rooms").offsetTop-8,behavior:"smooth"}); };',
  '$("cue").onclick=function(){ $("lane").scrollTo({top:$("rooms").offsetTop-8,behavior:"smooth"}); };\ndocument.addEventListener("click",function(e){ var a=e.target.closest&&e.target.closest(\'a[href^="#r-"]\'); if(!a||a.classList.contains("orb")) return; e.preventDefault(); closeWin(); goRoom(a.getAttribute("href").slice(1)); });')
for k,v in C.items(): s=s.replace("@@"+k+"@@",v)
assert "@@" not in s, s[s.index("@@")-60:s.index("@@")+60]
open(C["OUT"], "w", encoding="utf-8").write(s)
print("ok", len(s))
