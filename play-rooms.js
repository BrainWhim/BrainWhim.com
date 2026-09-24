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
    if(room.host!==me) return;
    st.rated=true;
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


