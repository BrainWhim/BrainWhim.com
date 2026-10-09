
(function(){
  var CODE=(location.search.match(/code=([A-Za-z0-9]+)/)||[])[1];
  if(!CODE) return;
  CODE=CODE.toUpperCase();
  window.bwOnline=true;
  function boot(){
    if(typeof sitDown==="function") sitDown();
    var msg=document.getElementById("chmsg");
    if(msg) msg.textContent="Online table";
    if(!window.supabase || typeof BW_PLAY==="undefined") return;
    var sb=supabase.createClient(BW_PLAY.url, BW_PLAY.anonKey);
    var room, myColor, sending=false, me=null;
    function snap(){
      return {board:ch, turn:chTurn, last:chLast, over:chOver, rights:chRights, ep:chEp};
    }
    function apply(s){
      if(!s||!s.board) return;
      ch=s.board; chTurn=s.turn||"w"; chLast=s.last||null; chOver=!!s.over;
      if(s.rights) chRights=s.rights; chEp=s.ep||null;
      if(typeof chPaint==="function") chPaint();
      var m=document.getElementById("chmsg");
      if(m) m.textContent = myColor&&chTurn===myColor ? "Your turn" : "Opponent to move";
    }
    async function publish(){
      if(!room||sending) return;
      sending=true;
      await sb.from("rooms").update({state:snap(), status:chOver?"done":"live", updated_at:new Date().toISOString()}).eq("id", room.id);
      sending=false;
    }
    var orig=chPaint;
    chPaint=function(){ orig(); if(window.bwOnline && room && chTurn!==myColor) publish(); };
    sb.auth.getSession().then(function(sess){
      me=sess&&sess.data&&sess.data.session?sess.data.session.user.id:null;
      return sb.from("rooms").select("*").eq("code", CODE).single();
    }).then(function(q){
      room=q.data; if(!room) return;
      if(room.host===me) myColor="w";
      else if(room.guest===me) myColor="b";
      else if(!room.guest && me){ myColor="b"; room.guest=me; sb.from("rooms").update({guest:me, status:"live"}).eq("id", room.id); }
      var m0=document.getElementById("chmsg");
      if(m0) m0.textContent = myColor==="w" ? "Your turn" : "Waiting for cobalt";
      if(room.state&&room.state.board) apply(room.state);
      else publish();
      sb.channel("room-"+CODE).on("postgres_changes",{event:"UPDATE", schema:"public", table:"rooms", filter:"code=eq."+CODE}, function(payload){
        if(payload.new && payload.new.state) apply(payload.new.state);
      }).subscribe();
    });
  }
  window.addEventListener("load", boot);
})();
