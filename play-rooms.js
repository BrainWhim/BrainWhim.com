/* SAFE RENDERING HELPER
   Text that comes from the database (names, invite messages) must go on the page
   as plain TEXT, never as HTML. This builds an element and sets its text safely,
   so a malicious value can never run as code. Use it instead of innerHTML for data. */
window.bwMakeEl=function(tag, cls, text){
  var e=document.createElement(tag);
  if(cls) e.className=cls;
  if(text!=null) e.textContent=String(text);
  return e;
};
window.BW_ROOMS={
  chess:"chess.html",
  checkers:"checkers.html",
  backgammon:"backgammon.html",
  othello:"othello.html",
  morris:"morris.html",
  mancala:"mancala.html",
  dominoes:"dominoes.html",
  yahtzee:"yahtzee.html",
  cribbage:"cribbage.html",
  shutbox:"shutbox.html"
};
function bwGuessGame(room){
  if(!room) return "";
  var g=String(room.game||"").toLowerCase();
  if(window.BW_ROOMS[g]) return g;
  var st=room.state||{};
  if(st.pts) return "backgammon";
  if(st.game==="shutbox" || (Array.isArray(st.open) && "score1" in st)) return "shutbox";
  if(st.y && st.h) return "mancala";
  if(st.game==="cribbage" || st.tossed) return "cribbage";
  if(st.game==="yahtzee" || (st.p1!==undefined && st.dice && st.rolls!==undefined)) return "yahtzee";
  if(st.h1 && st.h2 && st.bone) return "dominoes";
  if(st.placed || (st.board && st.board.length===24)) return "morris";
  if(st.took1 || st.took2) return "checkers";
  if(st.board && st.board.length===8 && typeof (st.board[0]&&st.board[0][0])==="number") return "othello";
  if(st.board && st.board.length===8 && typeof (st.board[0]&&st.board[0][0])==="string") return "chess";
  return g||"chess";
}
function bwRoomPage(game){
  game=String(game||"").toLowerCase();
  return window.BW_ROOMS[game]||"";
}
function bwRoomHref(game, code, extra){
  var page=bwRoomPage(game);
  if(!page) return "lobby.html";
  var q="?code="+encodeURIComponent(code||"")+"&game="+encodeURIComponent(game);
  if(extra) q+="&"+extra.replace(/^[?&]/,"");
  return page+q;
}
function bwThisGame(){
  var f=(location.pathname.split("/").pop()||"").toLowerCase();
  for(var k in window.BW_ROOMS) if(window.BW_ROOMS[k]===f) return k;
  return "";
}
function bwSendToGame(game, code){
  var here=bwThisGame();
  game=String(game||"").toLowerCase();
  if(!game || !bwRoomPage(game) || game===here) return false;
  location.replace(bwRoomHref(game, code||"", location.search.indexOf("online=1")>=0?"online=1":""));
  return true;
}
function bwTitle(pts){
  pts=Number(pts||0);
  if(pts<=100) return "New";
  if(pts<=500) return "Beginner";
  if(pts<=1000) return "Club";
  return "Expert";
}
function bwTitleIndex(pts){
  var t=bwTitle(pts);
  return t==="New"?0:t==="Beginner"?1:t==="Club"?2:3;
}
function bwCanMatch(a,b){
  return Math.abs(bwTitleIndex(a)-bwTitleIndex(b))<=1;
}
function bwRateDelta(myPts, oppPts, result){
  if(result==="draw") return 0;
  var d=bwTitleIndex(oppPts)-bwTitleIndex(myPts);
  if(result==="win") return d>0?12:d<0?4:8;
  return d>0?-2:d<0?-8:-4;
}
window.bwTitle=bwTitle;
window.bwCanMatch=bwCanMatch;
window.bwRateGame=async function(sb, room, me, winnerSide){
  try{
    if(!sb||!room||!me||winnerSide==null) return;
    /* Each player's browser reports once. The server (bw_report_result in supabase-scores.sql)
       decides whether points move; the browser can no longer write skill_points itself. */
    if(room.__bwReported) return;
    room.__bwReported=true;
    var st=Object.assign({}, room.state||{});
    st.over=true;
    st.winner=winnerSide;
    room.state=st;
    await sb.from("rooms").update({state:st, status:"done"}).eq("id", room.id);
    var r=await sb.rpc("bw_report_result", {p_room:String(room.id), p_winner:Number(winnerSide)});
    if(r.error) room.__bwReported=false;   /* let a later call retry if the server was unreachable */
  }catch(e){}
};
(function bwPresence(){
  function tick(){
    var cfg=window.BW_PLAY||{};
    if(!cfg.url || typeof supabase==="undefined") return;
    if(!window.__bwSb) window.__bwSb=(window.BW&&BW.client&&BW.client())||supabase.createClient(cfg.url, cfg.anonKey);
    window.__bwSb.auth.getSession().then(function(r){
      var u=r.data && r.data.session && r.data.session.user;
      if(!u) return;
      window.__bwSb.from("profiles").update({last_seen:new Date().toISOString()}).eq("id", u.id);
    });
  }
  function start(){
    tick();
    if(window.__bwBeat) clearInterval(window.__bwBeat);
    window.__bwBeat=setInterval(tick, 20000);
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", start);
  else start();
  document.addEventListener("visibilitychange", function(){ if(!document.hidden) tick(); });
})();
(function bwMailEverywhere(){
  function sbClient(){
    var cfg=window.BW_PLAY||{};
    if(!cfg.url || typeof supabase==="undefined") return null;
    if(!window.__bwSb) window.__bwSb=(window.BW&&BW.client&&BW.client())||supabase.createClient(cfg.url, cfg.anonKey);
    return window.__bwSb;
  }
  function inject(){
    if(document.getElementById("bellBtn")) return;
    if(!document.querySelector("header")) return;
    var css=document.createElement("style");
    css.textContent='header .bw-bell,.hdr .bw-bell{display:inline-flex!important;align-items:center;justify-content:center;position:relative;border:0;background:#fff;color:#1A2744;border-radius:999px;padding:6px 10px;font-weight:800;cursor:pointer;font-family:inherit;margin-left:8px;flex-shrink:0;z-index:9}.bw-bell .dot{position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;border-radius:999px;background:#c45c6a;color:#fff;font-size:11px;display:none;align-items:center;justify-content:center;padding:0 4px}.bw-bell .dot.on{display:flex}.bw-mailpane{display:none;position:fixed;right:16px;top:76px;z-index:90;width:min(360px,92vw);max-height:70vh;overflow:auto;background:rgba(15,23,42,.88);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,.18);border-radius:18px;padding:16px 16px 12px;box-shadow:0 24px 50px rgba(0,0,0,.45);color:#fff;font-family:Montserrat,system-ui,sans-serif;text-align:left}.bw-mailpane.on{display:block}#mailPane.bw-mailpane h3{margin:0 0 12px;text-align:center;font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#e6c25a!important}#mailList{font-size:13px;line-height:1.45;color:rgba(255,255,255,.9)}#mailList>button{border:0;background:none;padding:0;font:inherit;font-weight:700;color:#e6c25a;text-decoration:underline;cursor:pointer}.bw-note{padding:10px 12px;margin:0 0 8px;border-radius:12px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);font-size:13px;font-weight:600;color:#fff}.bw-note .st{margin-top:4px;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.55)}.bw-note .acts{display:flex;gap:6px;margin-top:8px}.bw-mbtn{flex:1;border-radius:6px;padding:8px 12px;font:700 13px Montserrat,system-ui,sans-serif;cursor:pointer;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.25);color:rgba(255,255,255,.9)}.bw-mbtn:hover{background:rgba(255,255,255,.16)}.bw-mbtn.go{background:rgba(212,175,55,.18);border-color:rgba(212,175,55,.7);color:#f0d27a}.bw-mbtn.go:hover{background:rgba(212,175,55,.3)}.bw-toast{position:fixed;right:16px;bottom:16px;z-index:95;max-width:340px;background:rgba(15,23,42,.9);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid rgba(212,175,55,.55);color:#fff;border-radius:12px;padding:12px 14px;font:600 13px/1.45 Montserrat,system-ui,sans-serif;box-shadow:0 12px 28px rgba(0,0,0,.35);display:none}.bw-toast.on{display:block}.bw-toast .btn{border-radius:6px;padding:7px 12px;font:700 12px Montserrat,system-ui,sans-serif;cursor:pointer;background:rgba(212,175,55,.18);border:1px solid rgba(212,175,55,.7);color:#f0d27a;margin-left:8px}';
    document.head.appendChild(css);
    var header=document.querySelector("header");
    header.style.position=header.style.position||"relative";
    var bell=document.createElement("button");
    bell.className="bw-bell"; bell.id="bellBtn"; bell.type="button";
    bell.innerHTML='✉ <span class="dot" id="mailDot">0</span>';
    bell.onclick=function(){ toggle(); };
    var nav=header.querySelector("nav.hdr")||header.querySelector("nav");
    if(nav) nav.appendChild(bell);
    else header.appendChild(bell);
    var pane=document.createElement("div");
    pane.className="bw-mailpane"; pane.id="mailPane";
    pane.innerHTML='<h3>Mailbox</h3><div id="mailList">Sign in to see invites.</div>';
    document.body.appendChild(pane);
    /* dark glass like the rest of the site (Oct 24); a tap outside or Escape closes it */
    document.addEventListener("click",function(e){ if(pane.classList.contains("on")&&!pane.contains(e.target)&&!bell.contains(e.target)) pane.classList.remove("on"); });
    document.addEventListener("keydown",function(e){ if(e.key==="Escape") pane.classList.remove("on"); });
    var toast=document.createElement("div");
    toast.className="bw-toast"; toast.id="bwToast";
    document.body.appendChild(toast);
  }
  function placePane(){
    var pane=document.getElementById("mailPane");
    var header=document.querySelector("header");
    if(!pane) return;
    var bottom=header?header.getBoundingClientRect().bottom:72;
    pane.style.top=Math.max(bottom+8, 76)+"px";
  }
  function toggle(){
    var pane=document.getElementById("mailPane");
    if(pane){
      pane.classList.toggle("on");
      if(pane.classList.contains("on")) placePane();
    }
    load();
  }
  window.toggleMail=toggle;
  function showToast(text, code, nid, game){
    var el=document.getElementById("bwToast")||document.getElementById("toast");
    if(!el) return;
    el.textContent=text;   // plain text only, never HTML
    var b=bwMakeEl("button","btn","Sit down"); b.type="button";
    b.onclick=function(){ accept(nid, code, game); };
    el.appendChild(document.createTextNode(" "));
    el.appendChild(b);
    el.classList.add("on");
    setTimeout(function(){ el.classList.remove("on"); }, 12000);
  }
  async function accept(id, code, gameHint){
    var client=sbClient(); if(!client) return;
    var s=(await client.auth.getSession()).data.session;
    if(!s || s.user.is_anonymous){
      if(!window.BW){ location.href="lobby.html"; return; }
      var gate=await BW.openAuth({reason:"Sign in to join your friend's table."});
      if(!gate.ok) return;
      s=(await client.auth.getSession()).data.session;
      if(!s) return;
    }
    if(window.BW && !(await BW.startMatch({mode:"online"}))) return;
    var q=await client.from("rooms").select("*").eq("code", code).single();
    if(q.error){ alert("That table closed."); return; }
    if(q.data.host!==s.user.id && !q.data.guest){
      var u=await client.from("rooms").update({guest:s.user.id, status:"live"}).eq("id", q.data.id);
      if(u.error){ alert(u.error.message); return; }
    }
    if(id) await client.from("notices").update({status:"accepted", read:true}).eq("id", id);
    var game=gameHint||q.data.game||"chess";
    var seat=(q.data.host===s.user.id)?"w":"b";
    location.href=bwRoomHref(game, code, "online=1&mode=multiplayer&match_id="+encodeURIComponent(code)+"&seat="+seat);
  }
  window.acceptInvite=window.acceptInvite||accept;
  window.bwAcceptInvite=accept;
  async function decline(id){
    var client=sbClient(); if(!client) return;
    await client.from("notices").update({status:"declined", read:true}).eq("id", id);
    load();
  }
  window.declineInvite=window.declineInvite||decline;
  async function load(){
    var list=document.getElementById("mailList");
    var dot=document.getElementById("mailDot");
    var client=sbClient();
    if(!client || !list) return;
    var s=(await client.auth.getSession()).data.session;
    if(!s || s.user.is_anonymous){
      list.textContent="";
      var lnk=bwMakeEl("button","","Sign in"); lnk.type="button";
      lnk.onclick=function(){ if(window.BW) BW.openAuth({reason:"Sign in to see your invites."}); else location.href="lobby.html"; };
      list.appendChild(lnk); list.appendChild(document.createTextNode(" to see invites."));
      if(dot) dot.classList.remove("on"); return;
    }
    var q=await client.from("notices").select("*").eq("to_id", s.user.id).order("created_at",{ascending:false}).limit(12);
    if(q.error){ list.textContent=q.error.message; return; }
    var rows=q.data||[];
    var pending=rows.filter(function(n){ return n.status==="pending"; });
    if(dot){
      if(pending.length){ dot.textContent=String(pending.length); dot.classList.add("on"); }
      else dot.classList.remove("on");
    }
    if(!rows.length){ list.textContent="No notes yet."; return; }
    list.textContent="";
    rows.forEach(function(n){
      var row=bwMakeEl("div","bw-note");
      row.appendChild(document.createTextNode((n.body||"Invite")+" "));   // plain text only
      if(n.status==="pending" && n.room_code){
        var act=bwMakeEl("div","acts");
        var join=bwMakeEl("button","bw-mbtn go","Join"); join.type="button";
        join.onclick=function(){ accept(n.id, n.room_code, n.game||""); };
        var no=bwMakeEl("button","bw-mbtn","Not Now"); no.type="button";
        no.onclick=function(){ decline(n.id); };
        act.appendChild(join); act.appendChild(no); row.appendChild(act);
      } else {
        var st=bwMakeEl("div","st",n.status);
        row.appendChild(st);
      }
      list.appendChild(row);
    });
  }
  async function listen(){
    var client=sbClient(); if(!client) return;
    var s=(await client.auth.getSession()).data.session;
    if(!s) return;
    if(window.__bwMailCh) client.removeChannel(window.__bwMailCh);
    window.__bwMailCh=client.channel("mail-"+s.user.id).on("postgres_changes",{
      event:"INSERT", schema:"public", table:"notices", filter:"to_id=eq."+s.user.id
    }, function(payload){
      var n=payload.new;
      showToast(n.body||"You were invited to a table.", n.room_code, n.id, n.game);
      load();
    }).subscribe();
    load();
  }
  function start(){
    var already=!!document.getElementById("bellBtn");
    inject();
    if(!already) listen();
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();

(function bwSets(){
  var file=(location.pathname.split("/").pop()||"").toLowerCase();
  if(!/^(chess-room)(\.html)?$/.test(file)) return;   /* checkers (Oct 22) and chess (Oct 23) moved onto the parlor kit; chess-room.html only forwards */
  var SETS=[
    {id:"classic", name:"Ivory · Onyx", need:0, member:false},
    {id:"cobalt", name:"Cobalt · Emerald", need:501, member:true},
    {id:"gold", name:"Gold · Onyx", need:501, member:true}
  ];
  function allowed(set, pts, member){
    if(set.need<=0) return true;
    if(member) return true;
    return (pts||0)>=set.need;
  }
  /* Club member card: the same dark glass as the parlor pop-ups */
  function bwMemberCard(pts){
    if(!document.getElementById("bwGlassCss")){
      var st=document.createElement("style"); st.id="bwGlassCss";
      st.textContent='.bw-gveil{position:fixed;inset:0;z-index:130;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(8,12,22,.45);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}'+
        '.bw-gcard{width:min(420px,94vw);max-height:84dvh;overflow:auto;padding:22px;border-radius:18px;background:rgba(15,23,42,.72);border:1px solid rgba(255,255,255,.18);box-shadow:0 24px 50px rgba(0,0,0,.4);color:#fff;font-family:Montserrat,system-ui,sans-serif;text-align:left}'+
        '.bw-gcard .k{margin:0 0 6px;text-align:center;color:#d4af37;font-size:12px;letter-spacing:.16em;text-transform:uppercase}'+
        '.bw-gcard h2{margin:0 0 14px;text-align:center;font-size:21px}'+
        '.bw-gcard ul{margin:0 0 14px;padding-left:20px;font-size:14px;line-height:1.5;color:rgba(255,255,255,.9)}.bw-gcard li{margin:0 0 6px}'+
        '.bw-gcard .pts{text-align:center;font-size:13px;color:rgba(255,255,255,.75);margin:0 0 14px}'+
        '.bw-gcard button{display:block;width:100%;padding:12px 14px;border-radius:12px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);color:#fff;font:700 13px Montserrat,system-ui,sans-serif;cursor:pointer}'+
        '.bw-gcard button:hover{background:rgba(255,255,255,.14)}';
      document.head.appendChild(st);
    }
    var v=document.createElement("div"); v.className="bw-gveil";
    v.innerHTML='<div class="bw-gcard" role="dialog" aria-label="Club membership"><p class="k">BrainWhim Club</p><h2>Your Seat Is a Club Seat</h2>'+
      '<ul>'+
      '<li><b>Every set unlocked</b> in every room: pieces, discs, dice, stones and tiles.</li>'+
      '<li><b>More House points:</b> up to 20 games a day earn points (free accounts: 3).</li></ul>'+
      '<p class="pts">'+(Number(pts)||0)+' points on your account</p><button type="button">Back to the Table</button></div>';
    function close(){ if(v.parentNode) v.parentNode.removeChild(v); document.removeEventListener("keydown",esc); }
    function esc(e){ if(e.key==="Escape") close(); }
    v.addEventListener("click",function(e){ if(e.target===v||e.target.tagName==="BUTTON") close(); });
    document.addEventListener("keydown",esc);
    document.body.appendChild(v);
  }
  window.bwMemberCard=bwMemberCard;
  function pieceFile(side, letter, setId){
    var set=setId||document.body.getAttribute("data-set")||"classic";
    var L=(letter||"P").toUpperCase();
    var s=side==="b"?"b":"w";
    if(set==="gold") return (s==="w"?"piece-gold-w-":"piece-gold-b-")+L+".png?v=19";
    if(set==="cobalt") return "piece-"+s+"-"+L+".png?v=19";
    return (s==="w"?"piece-ivory-w-":"piece-onyx-b-")+L+".png?v=7";
  }
  window.bwPieceFile=pieceFile;
  function restylePieces(){
    document.querySelectorAll("img.pcimg, img.flyer").forEach(function(img){
      var side=img.getAttribute("data-side");
      var letter=img.getAttribute("data-piece");
      if(!side||!letter){
        var m=(img.getAttribute("src")||"").match(/piece-(?:parlor-w|parlor-b|ivory-w|onyx-b|gold-w|gold-b|silver-b|silver-w)-([KQRBNP])/i);
        if(m){
          letter=m[1];
          side=/onyx-b|gold-b|silver-b|parlor-b|piece-b-/.test(img.getAttribute("src")||"")?"b":"w";
        } else {
          m=(img.getAttribute("src")||"").match(/piece-([wb])-([KQRBNP])/i);
          if(!m) return;
          side=m[1].toLowerCase(); letter=m[2];
        }
      }
      img.setAttribute("data-side", side);
      img.setAttribute("data-piece", letter);
      img.src=pieceFile(side, letter);
    });
    if(typeof window.chPaint==="function") try{ window.chPaint(); }catch(e){}
  }
  function apply(id){
    document.body.setAttribute("data-set", id||"classic");
    try{ localStorage.setItem("bwSet", id||"classic"); }catch(e){}
    restylePieces();
  }
  function injectCss(){
    var s=document.createElement("style");
    s.textContent='body[data-set="dusk"] img[src*="piece-w-"],body[data-set="dusk"] img[src*="checker-w"]{filter:hue-rotate(210deg) saturate(1.85) brightness(1.06) drop-shadow(0 0 6px rgba(120,80,200,.55)) drop-shadow(0 5px 3px rgba(0,0,0,.32))!important}'+
      'body[data-set="gilded"] img[src*="piece-w-"],body[data-set="gilded"] img[src*="checker-w"]{filter:sepia(.85) saturate(2.1) hue-rotate(-18deg) brightness(1.12) drop-shadow(0 0 7px rgba(218,170,60,.7)) drop-shadow(0 5px 3px rgba(0,0,0,.32))!important}'+
      'body[data-set="dusk"] img[src*="piece-b-"],body[data-set="dusk"] img[src*="checker-b"],body[data-set="gilded"] img[src*="piece-b-"],body[data-set="gilded"] img[src*="checker-b"]{filter:drop-shadow(0 5px 3px rgba(0,0,0,.32))!important}'+
      '.bw-member{max-width:640px;margin:0 auto 8px;padding:8px 10px;display:flex;flex-wrap:wrap;gap:8px;justify-content:center;align-items:center;background:rgba(255,252,247,.94);border-radius:16px;backdrop-filter:blur(8px);position:relative;z-index:20}'+
      '.bw-member p{margin:0;font-size:12px;font-weight:600;color:#1A2744;width:100%;text-align:center}'+
      '.bw-sets-btn,.bw-sub-btn{border:0;border-radius:999px;padding:6px 12px;background:#fff;color:#1A2744;font-weight:800;font-size:12px;cursor:pointer;font-family:inherit;border:1px solid #d7c9b0}'+
      '.bw-sub-btn{background:#1A2744;color:#fff;border-color:#1A2744}'+
      '.bw-sets{display:none;position:fixed;right:12px;top:88px;z-index:80;width:min(280px,92vw);background:rgba(255,250,242,.98);border:1px solid rgba(201,166,107,.55);border-radius:16px;padding:12px;color:#1A2744;box-shadow:0 16px 40px rgba(0,0,0,.28)}'+
      '.bw-sets.on{display:block}.bw-sets.on{position:static;width:auto;background:transparent;border:0;box-shadow:none;padding:0;color:inherit}.bw-sets h3{margin:0 0 8px;font-size:14px}.bw-sets button{display:block;width:100%;text-align:left;margin:0 0 6px;border:1px solid #d7c9b0;background:#fff;border-radius:12px;padding:8px 10px;font-weight:700;cursor:pointer}'+
      '.bw-sets button.on{border-color:#1A2744;background:#1A2744;color:#fff}.bw-sets button.lock{opacity:.6;cursor:default}'+
      '.set-row{display:flex;flex-direction:column;align-items:flex-start;text-align:left;padding:14px 16px;gap:4px;font-family:Montserrat,sans-serif}.set-name{font-size:14px;font-weight:600;letter-spacing:.01em;font-family:Montserrat,sans-serif}.set-sub{font-size:11px;font-weight:500;font-style:italic;letter-spacing:.04em;color:rgba(255,255,255,.62);font-family:Montserrat,sans-serif}.set-row{position:relative}.upgrade{position:absolute;right:12px;top:12px;background:rgba(212,175,55,.2);border:1px solid #d4af37;color:#fff;font-size:10px;font-weight:700;padding:4px 8px;border-radius:4px;letter-spacing:.06em;text-transform:uppercase}';
    document.head.appendChild(s);
  }
  function panel(pts, member){
    var cur=document.body.getAttribute("data-set")||"classic";
    return SETS.map(function(set){
      var ok=allowed(set,pts,member);
      var on=set.id===cur;
      var sub=set.id==="classic"?"Starter Set • Free":set.id==="gold"?(on?"Elite Tier (Equipped)":"Elite Tier"):"Club Member Tier";
      var title=set.name+(ok?"":" 🔒");
      var badge=ok?"":'<span class="upgrade">Join Club</span>';
      return '<button type="button" class="set-row'+(on?" on":"")+(ok?"":" lock")+'" data-set="'+set.id+'"><span class="set-name">'+title+'</span><span class="set-sub">'+sub+'</span>'+badge+'</button>';
    }).join("");
  }
  async function boot(){
    injectCss();
    var saved="classic";
    try{ saved=localStorage.getItem("bwSet")||"classic"; }catch(e){}
    var pts=0, member=false;
    try{
      var cfg=window.BW_PLAY||{};
      if(cfg.url && typeof supabase!=="undefined"){
        if(!window.__bwSb) window.__bwSb=(window.BW&&BW.client&&BW.client())||supabase.createClient(cfg.url, cfg.anonKey);
        var sess=(await window.__bwSb.auth.getSession()).data.session;
        if(sess){
          var q=await window.__bwSb.from("profiles").select("skill_points,member").eq("id", sess.user.id).maybeSingle();
          if(q.data){ pts=Number(q.data.skill_points||0); member=!!q.data.member; }
        }
      }
    }catch(e){}
    if(!allowed(SETS.filter(function(s){return s.id===saved;})[0]||SETS[0], pts, member)) saved="classic";
    apply(saved);
    var bar=document.createElement("div");
    bar.className="bw-member";
    bar.innerHTML='<p class="acct">Account & Settings</p>';
    var btn=document.createElement("button");
    var label=/yahtzee|shutbox/.test(file)?"Dice Sets":/mancala/.test(file)?"Stone Sets":/dominoes/.test(file)?"Tile Sets":/othello|cribbage|morris|backgammon/.test(file)?"Table Sets":"Piece Sets";
    btn.className="bw-sets-btn"; btn.type="button"; btn.textContent=label;
    var sub=document.createElement("button");
    sub.className="bw-sub-btn"; sub.type="button"; sub.textContent="Subscribe";
    if(member){
      sub.textContent="Member";
      sub.onclick=function(){ bwMemberCard(pts); };
    } else {
      sub.onclick=function(){ location.href="member.html"; };
    }
    /* chess shows its sets list in the side panel already, so it skips the extra button */
    if(!document.getElementById("room-ch")) bar.appendChild(btn);
    bar.appendChild(sub);
    function openSets(){ var el=document.getElementById("bwSets"); if(el){ el.classList.toggle("on"); paint(); } }
    var sit=document.querySelector("#room-ch .sitbar") || document.querySelector(".sitbar");
    if(sit && !document.getElementById("room-ch")){
      var before=document.createElement("button");
      before.className="sit"; before.type="button"; before.textContent=label;
      before.onclick=openSets;
      sit.appendChild(before);
      var after=document.createElement("button");
      after.className="stand"; after.type="button"; after.textContent=label;
      after.onclick=openSets;
      sit.appendChild(after);
    } else if(!document.getElementById("room-ch")) {
      var hdr=document.querySelector("header .hdr")||document.querySelector("header");
      if(hdr){
        var headBtn=document.createElement("button");
        headBtn.className="bw-sets-btn"; headBtn.type="button"; headBtn.textContent=label;
        hdr.appendChild(headBtn);
        headBtn.onclick=openSets;
      }
    }
    bar.style.display="";
    var room=document.getElementById("room-ch");
    var home=document.getElementById("setHome");
    if(home) home.appendChild(bar);
    else if(room) room.appendChild(bar);
    else {
      var games=document.querySelector(".games");
      if(games && games.parentNode) games.parentNode.insertBefore(bar, games.nextSibling);
      else document.body.appendChild(bar);
    }
    var box=document.createElement("div");
    box.className="bw-sets"; box.id="bwSets";
    box.innerHTML="<h3>Sets</h3><div id=\"bwSetList\"></div>";
    if(home){ home.appendChild(box); box.classList.add("on"); }
    else if(room) room.appendChild(box); else document.body.appendChild(box);
    function paint(){ document.getElementById("bwSetList").innerHTML=panel(pts, member); }
    paint();
    btn.onclick=function(){ box.classList.toggle("on"); paint(); };
    box.onclick=function(ev){
      var b=ev.target.closest("button[data-set]"); if(!b) return;
      var id=b.getAttribute("data-set");
      var set=SETS.filter(function(s){return s.id===id;})[0];
      if(!allowed(set,pts,member)){ location.href="member.html"; return; }
      apply(id); paint();
    };
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
