window.BW_ROOMS={
  chess:"chess-room.html",
  checkers:"checkers-room.html",
  backgammon:"backgammon-room.html",
  othello:"othello-room.html",
  morris:"morris-room.html",
  mancala:"mancala-room.html",
  dominoes:"dominoes-room.html",
  yahtzee:"yahtzee-room.html",
  cribbage:"cribbage-room.html",
  shutbox:"shutbox-room.html"
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
  if(!page) return "tables.html";
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
    var st=Object.assign({}, room.state||{});
    if(st.rated) return;
    st.rated=true;
    st.over=true;
    st.winner=winnerSide;
    room.state=st;
    await sb.from("rooms").update({state:st, status:"done"}).eq("id", room.id);
    var host=room.host, guest=room.guest;
    if(!host||!guest) return;
    var q=await sb.from("profiles").select("id,skill_points").in("id",[host,guest]);
    if(q.error||!q.data) return;
    var map={}; q.data.forEach(function(p){ map[p.id]=Number(p.skill_points||0); });
    var hp=map[host]||0, gp=map[guest]||0;
    var hostRes=winnerSide===0?"draw":(winnerSide===1?"win":"lose");
    var guestRes=winnerSide===0?"draw":(winnerSide===2?"win":"lose");
    var hd=bwRateDelta(hp,gp,hostRes), gd=bwRateDelta(gp,hp,guestRes);
    await sb.from("profiles").update({skill_points:Math.max(0,hp+hd)}).eq("id",host);
    await sb.from("profiles").update({skill_points:Math.max(0,gp+gd)}).eq("id",guest);
    room.state=st;
  }catch(e){}
};
(function bwPresence(){
  function tick(){
    var cfg=window.BW_PLAY||{};
    if(!cfg.url || typeof supabase==="undefined") return;
    if(!window.__bwSb) window.__bwSb=supabase.createClient(cfg.url, cfg.anonKey);
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
    if(!window.__bwSb) window.__bwSb=supabase.createClient(cfg.url, cfg.anonKey);
    return window.__bwSb;
  }
  function inject(){
    if(document.getElementById("bellBtn")) return;
    if(!document.querySelector("header")) return;
    var css=document.createElement("style");
    css.textContent='header .bw-bell,.hdr .bw-bell{display:inline-flex!important;align-items:center;justify-content:center;position:relative;border:0;background:#fff;color:#1A2744;border-radius:999px;padding:6px 10px;font-weight:800;cursor:pointer;font-family:inherit;margin-left:8px;flex-shrink:0;z-index:9}.bw-bell .dot{position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;border-radius:999px;background:#c45c6a;color:#fff;font-size:11px;display:none;align-items:center;justify-content:center;padding:0 4px}.bw-bell .dot.on{display:flex}.bw-mailpane{display:none;position:fixed;right:16px;top:76px;z-index:40;width:min(360px,92vw);background:rgba(255,250,242,.96);border:1px solid rgba(201,166,107,.55);border-radius:16px;padding:12px;box-shadow:0 16px 32px rgba(40,30,16,.22);color:#1A2744}.bw-mailpane.on{display:block}.bw-mailpane h3{margin:0 0 8px;font-size:14px}.bw-note{border-top:1px solid #eadfcb;padding:8px 0;font-size:13px}.bw-note:first-of-type{border-top:0}.bw-toast{position:fixed;right:16px;bottom:16px;z-index:40;max-width:320px;background:#1A2744;color:#fff;border-radius:14px;padding:12px 14px;box-shadow:0 12px 28px rgba(0,0,0,.28);display:none}.bw-toast.on{display:block}.bw-toast .btn{border:0;border-radius:999px;padding:7px 12px;font-weight:700;font-size:12px;cursor:pointer;background:#fff;color:#1A2744;margin-left:8px}';
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
    el.innerHTML=text+' <button class="btn" type="button">Sit down</button>';
    var b=el.querySelector("button");
    if(b) b.onclick=function(){ accept(nid, code, game); };
    el.classList.add("on");
    setTimeout(function(){ el.classList.remove("on"); }, 12000);
  }
  async function accept(id, code, gameHint){
    var client=sbClient(); if(!client) return;
    var s=(await client.auth.getSession()).data.session;
    if(!s){ location.href="tables.html"; return; }
    var q=await client.from("rooms").select("*").eq("code", code).single();
    if(q.error){ alert("That table closed."); return; }
    if(q.data.host!==s.user.id && !q.data.guest){
      var u=await client.from("rooms").update({guest:s.user.id, status:"live"}).eq("id", q.data.id);
      if(u.error){ alert(u.error.message); return; }
    }
    if(id) await client.from("notices").update({status:"accepted", read:true}).eq("id", id);
    var game=gameHint||q.data.game||"chess";
    location.href=bwRoomHref(game, code, "online=1");
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
    if(!s){ list.textContent="Sign in on Tables to see invites."; if(dot) dot.classList.remove("on"); return; }
    var q=await client.from("notices").select("*").eq("to_id", s.user.id).order("created_at",{ascending:false}).limit(12);
    if(q.error){ list.textContent=q.error.message; return; }
    var rows=q.data||[];
    var pending=rows.filter(function(n){ return n.status==="pending"; });
    if(dot){
      if(pending.length){ dot.textContent=String(pending.length); dot.classList.add("on"); }
      else dot.classList.remove("on");
    }
    if(!rows.length){ list.textContent="No notes yet."; return; }
    list.innerHTML=rows.map(function(n){
      var act=n.status==="pending" && n.room_code
        ? '<div style="margin-top:6px"><button type="button" onclick="bwAcceptInvite(\''+n.id+'\',\''+n.room_code+'\',\''+(n.game||'')+'\')" style="border:0;border-radius:999px;padding:7px 12px;background:#1A2744;color:#fff;font-weight:700;margin-right:6px">Join</button><button type="button" onclick="declineInvite(\''+n.id+'\')" style="border:0;border-radius:999px;padding:7px 12px;background:#fff;border:1px solid #d7c9b0;font-weight:700">Not now</button></div>'
        : '<div style="opacity:.7;margin-top:4px">'+n.status+'</div>';
      return '<div class="bw-note">'+(n.body||"Invite")+" "+act+"</div>";
    }).join("");
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



