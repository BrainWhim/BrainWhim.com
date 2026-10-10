
(function(){
  var q=new URLSearchParams(location.search);
  var isMulti=q.get("mode")==="multiplayer"||!!q.get("match_id")||!!q.get("code");
  if(!isMulti) return;
  var CODE=(q.get("match_id")||q.get("code")||"").toUpperCase();
  var seat=q.get("seat")==="b"?"b":"w";
  window.bwOnline=true;
  window.bwMyColor=seat;
  function say(extra){
    var m=document.getElementById("chmsg");
    if(!m) return;
    var base=typeof chTurn==="undefined" ? (seat==="b"?"Opponent goes first.":"Your turn. You go first.") : (chTurn===seat?"Your turn":"Opponent to move");
    m.textContent=base+" · "+(CODE||"no table")+(extra?extra:"");
  }
  function boot(){
    if(typeof sitDown==="function") sitDown();
    say();
    if(!CODE||!window.supabase||typeof BW_PLAY==="undefined"){ say(" · not linked"); return; }
    var sb=supabase.createClient(BW_PLAY.url, BW_PLAY.anonKey);
    var room=null;
    function snap(){ return {board:ch, turn:chTurn, last:chLast, over:chOver, rights:chRights, ep:chEp}; }
    function apply(s){
      if(!s||!s.board) return;
      ch=s.board; chTurn=s.turn||"w"; chLast=s.last||null; chOver=!!s.over;
      if(s.rights) chRights=s.rights; chEp=s.ep||null;
      if(typeof chPaint==="function") chPaint();
      say();
    }
    async function publish(){
      if(!room){ say(" · no room"); return; }
      var up=await sb.from("rooms").update({state:snap(), status:"live", updated_at:new Date().toISOString()}).eq("id", room.id);
      if(up.error) say(" · save failed");
    }
    window.bwPublish=publish;
    sb.from("rooms").select("*").eq("code", CODE).single().then(function(res){
      if(res.error||!res.data){ say(" · table missing"); return; }
      room=res.data;
      if(room.state&&room.state.board) apply(room.state); else publish();
      setInterval(function(){
        sb.from("rooms").select("state").eq("code", CODE).single().then(function(r){
          if(r.error){ say(" · read failed"); return; }
          var s=r.data&&r.data.state;
          if(!s||!s.board) return;
          var key=JSON.stringify(s.last||[])+"|"+s.turn;
          var here=JSON.stringify(chLast||[])+"|"+chTurn;
          if(key!==here) apply(s);
        });
      }, 1000);
    });
  }
  if(document.readyState==="complete") boot(); else window.addEventListener("load", boot);
})();
