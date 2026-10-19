
(function(){
  var q=new URLSearchParams(location.search);
  if(!(q.get("mode")==="multiplayer"||q.get("match_id")||q.get("code"))) return;
  var CODE=(q.get("match_id")||q.get("code")||"").toUpperCase();
  var seat=q.get("seat")==="b"?"b":"w";
  window.bwOnline=true; window.bwMyColor=seat;
  function line(text){
    var m=document.getElementById("chmsg"); if(m) m.textContent=text;
    var c=document.getElementById("chcode"); if(c) c.textContent=CODE+" · "+text;
  }
  var sb, room=null, pending=false, seen="";
  function snap(){ return {board:ch, turn:chTurn, last:chLast, over:chOver, rights:chRights, ep:chEp, you:chYouTook, bot:chBotTook}; }
  /* The other player (or anyone who can write to this table) controls the saved
     game data. Only accept a board that is exactly 8x8 of real piece letters or empty
     squares; anything else is ignored. */
  var PIECE=/^[pnbrqkPNBRQK]$/;
  function okBoard(b){
    if(!Array.isArray(b)||b.length!==8) return false;
    for(var r=0;r<8;r++){
      if(!Array.isArray(b[r])||b[r].length!==8) return false;
      for(var c=0;c<8;c++){ var v=b[r][c]; if(v!=null && v!=="" && !PIECE.test(String(v))) return false; }
    }
    return true;
  }
  function okTray(a){
    if(a==null) return true;
    if(!Array.isArray(a)||a.length>32) return false;
    for(var i=0;i<a.length;i++) if(!PIECE.test(String(a[i]))) return false;
    return true;
  }
  function apply(s){
    if(!s||!s.board) return;
    if(!okBoard(s.board)||!okTray(s.you)||!okTray(s.bot)) return;
    ch=s.board; chTurn=s.turn||"w"; chLast=s.last||null; chOver=!!s.over;
    if(s.rights) chRights=s.rights; chEp=s.ep||null; if(s.you) chYouTook=s.you; if(s.bot) chBotTook=s.bot;
    if(typeof chPaint==="function") chPaint();
    if(chOver){ line("Game over"); var lost=chTurn===seat; if(typeof showBanner==="function") showBanner(lost?"Better luck":"Checkmate!", lost?"Your opponent won.":"No legal move.", typeof chNew==="function"?chNew:null, lost?"lose":"win"); return; }
    line(chTurn===seat?"Your turn":"Opponent to move");
  }
  async function publish(){
    if(!room){ pending=true; line("Waiting for table"); return; }
    var up=await sb.from("rooms").update({state:snap(), updated_at:new Date().toISOString()}).eq("id", room.id);
    line(up.error?"Save failed":"Sent");
  }
  window.bwPublish=publish;
  function boot(){
    try{ if(typeof sitDown==="function") sitDown(); }catch(e){}
    line(seat==="b"?"Opponent goes first":"Your turn. You go first");
    if(!CODE||!window.supabase||typeof BW_PLAY==="undefined"){ line("Not linked"); return; }
    sb=window.__bwSb||(window.BW&&BW.client&&BW.client())||supabase.createClient(BW_PLAY.url, BW_PLAY.anonKey);
    sb.from("rooms").select("id,state").eq("code", CODE).single().then(function(res){
      if(res.error||!res.data){ line("Table not found"); return; }
      room=res.data; line("Linked");
      if(pending) publish();
      setInterval(function(){
        sb.from("rooms").select("state").eq("code", CODE).single().then(function(r){
          if(r.error){ line("Read failed"); return; }
          var s=r.data&&r.data.state, key=JSON.stringify(s&&s.last||[])+"|"+(s&&s.turn);
          if(s&&s.board&&key!==seen){ seen=key; apply(s); }
        });
      }, 1000);
    });
  }
  if(document.readyState==="complete") boot(); else window.addEventListener("load", boot);
})();
