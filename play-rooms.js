window.BW_ROOMS={
  chess:"chess-room.html",
  checkers:"checkers-room.html",
  backgammon:"backgammon-room.html",
  othello:"othello-room.html",
  morris:"morris-room.html",
  mancala:"mancala-room.html",
  dominoes:"dominoes-room.html"
};
function bwGuessGame(room){
  if(!room) return "";
  var g=String(room.game||"").toLowerCase();
  if(window.BW_ROOMS[g]) return g;
  var st=room.state||{};
  if(st.pts) return "backgammon";
  if(st.y && st.h) return "mancala";
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
