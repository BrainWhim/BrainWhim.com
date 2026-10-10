
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
  function apply(s){
    if(!s||!s.board) return;
    ch=s.board; chTurn=s.turn||"w"; chLast=s.last||null; chOver=!!s.over;
    if(s.rights) chRights=s.rights; chEp=s.ep||null; if(s.you) chYouTook=s.you; if(s.bot) chBotTook=s.bot;
    if(typeof chPaint==="function") chPaint();
    if(chOver){ line("Game over"); if(typeof showBanner==="function") showBanner(chTurn===seat?"Checkmate":"Game over", chTurn===seat?"No legal move.":"Your opponent won.", typeof chNew==="function"?chNew:null); return; }
    line(chTurn===seat?"Your turn":"Opponent to move");
  }
  async function publish(){
    if(!room){ pending=true; line("Waiting for table"); return; }
    var up=await sb.from("rooms").update({state:snap(), status:"live", updated_at:new Date().toISOString()}).eq("id", room.id);
    line(up.error?"Save failed":"Sent");
  }
  window.bwPublish=publish;
  function boot(){
    try{ if(typeof sitDown==="function") sitDown(); }catch(e){}
    line(seat==="b"?"Opponent goes first":"Your turn. You go first");
    if(!CODE||!window.supabase||typeof BW_PLAY==="undefined"){ line("Not linked"); return; }
    sb=supabase.createClient(BW_PLAY.url, BW_PLAY.anonKey);
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
