/* Circuit Builder's boards (The Outpost · Mission Control), Nov 17.
   A board is a W×H grid of tiles whose wires make one tree: the battery sits in one tile (it never turns), every dead end is a bulb,
   and every other tile is a wire (straight, corner, T or cross). The player turns tiles a quarter turn at a time until power reaches
   every bulb. Boards are made from a random spanning tree, scrambled, and graded by a step-by-step solver:
     edge rule (a wire can't point off the board, or into a tile that has no wire on that side) ........ 0.3 per tile placed
     no dead pairs (two bulbs can't face each other; a bulb can't face away into nothing) .............. inside the edge rule
     try-it (turn a tile one way, follow the edge rule, and see it break) ............................. 1.5 per tile
     loops (a wire can't close a loop: every tile is fed from the battery once) ........................ 1.0 per tile
     guess (none of that is enough) ................................................................. 4 per guess
   Mask bits: 1 up, 2 right, 4 down, 8 left. Works in the page (window.CBG) and in node (module.exports). */
(function(root){
"use strict";
var DR=[-1,0,1,0], DC=[0,1,0,-1], OPP=[2,3,0,1];
function rng(seed){ var s=(seed>>>0)||1; return function(){ s^=s<<13; s>>>=0; s^=s>>>17; s^=s<<5; s>>>=0; return s/4294967296; }; }
function rot(m,k){ k=((k%4)+4)%4; for(var i=0;i<k;i++) m=((m<<1)|(m>>3))&15; return m; }
function bits(m){ var n=0; for(var i=0;i<4;i++) if(m&(1<<i)) n++; return n; }
function rots(m){ var out=[], seen={}; for(var k=0;k<4;k++){ var r=rot(m,k); if(!seen[r]){ seen[r]=1; out.push(r); } } return out; }

/* the week: three boards a day, sizes and how many tiles start locked in place (shown with a brass pin) */
var LV=[
  {sz:[3,4,4], lock:.34, leaves:[.3,.42], sc:[0,7]},       /* Monday */
  {sz:[4,4,5], lock:.24, leaves:[.28,.4], sc:[6,13]},
  {sz:[4,5,5], lock:.16, leaves:[.26,.38], sc:[11,20]},
  {sz:[5,5,6], lock:.12, leaves:[.24,.36], sc:[16,28]},
  {sz:[5,6,6], lock:.08, leaves:[.22,.34], sc:[22,38]},
  {sz:[6,6,7], lock:.05, leaves:[.22,.32], sc:[30,52]},
  {sz:[6,7,7], lock:0,   leaves:[.2,.3],  sc:[40,75]}];      /* Sunday */

/* a random spanning tree: mostly a winding walk (few bulbs) mixed with branching (more bulbs) */
function tree(W,H,R,walk){ var N=W*H, m=new Array(N).fill(0), inT=new Array(N).fill(false), front=[];
  var s=Math.floor(R()*N); inT[s]=true; front.push(s);
  while(front.length){ var i=R()<walk?front.length-1:Math.floor(R()*front.length), c=front[i], r=Math.floor(c/W), q=c%W, opts=[];
    for(var d=0;d<4;d++){ var r2=r+DR[d], q2=q+DC[d]; if(r2<0||r2>=H||q2<0||q2>=W) continue; var n=r2*W+q2; if(!inT[n]) opts.push([d,n]); }
    if(!opts.length){ front.splice(i,1); continue; }
    var o=opts[Math.floor(R()*opts.length)]; m[c]|=1<<o[0]; m[o[1]]|=1<<OPP[o[0]]; inT[o[1]]=true; front.push(o[1]); }
  return m; }

/* power: which tiles the battery reaches, following wires that meet */
function power(W,H,m,bat){ var on=new Array(W*H).fill(false), st=[bat]; on[bat]=true;
  while(st.length){ var c=st.pop(), r=Math.floor(c/W), q=c%W;
    for(var d=0;d<4;d++){ if(!(m[c]&(1<<d))) continue; var r2=r+DR[d], q2=q+DC[d]; if(r2<0||r2>=H||q2<0||q2>=W) continue; var n=r2*W+q2;
      if(!on[n]&&(m[n]&(1<<OPP[d]))){ on[n]=true; st.push(n); } } }
  return on; }

/* ---------- the grader ---------- */
function grade(B){ var W=B.W, H=B.H, N=W*H, cand=[], score=0, guesses=0;
  for(var i=0;i<N;i++) cand.push(B.fixed[i]?[B.sol[i]]:rots(B.sol[i]));
  function nb(c,d){ var r=Math.floor(c/W)+DR[d], q=c%W+DC[d]; return (r<0||r>=H||q<0||q>=W)?-1:r*W+q; }
  /* edge rule to a fixed point; returns false on a contradiction */
  function edge(C,count){ var ch=true, placed=0;
    while(ch){ ch=false;
      for(var c=0;c<N;c++){ var before=C[c].length; if(before===1) continue;
        C[c]=C[c].filter(function(mm){ for(var d=0;d<4;d++){ var n=nb(c,d), has=!!(mm&(1<<d));
            if(n<0){ if(has) return false; continue; }
            var any=false, all=true; C[n].forEach(function(x){ var y=!!(x&(1<<OPP[d])); if(y) any=true; else all=false; });
            if(has&&!any) return false; if(!has&&all) return false;
            /* two bulbs facing each other make a dead pair (unless the whole board is two tiles) */
            if(has&&bits(mm)===1&&N>2&&C[n].length===1&&bits(C[n][0])===1&&n!==B.bat&&c!==B.bat) return false; }
          return true; });
        if(!C[c].length) return false;
        if(C[c].length<before){ ch=true; if(C[c].length===1) placed++; } } }
    if(count) score+=placed*.3; return true; }
  function done(C){ for(var c=0;c<N;c++) if(C[c].length>1) return false; return true; }
  function copy(C){ return C.map(function(a){ return a.slice(); }); }
  /* loops: a fixed group of tiles that closes a loop is wrong */
  function loopsOk(C){ var seen=new Array(N).fill(false);
    for(var s=0;s<N;s++){ if(seen[s]||C[s].length>1) continue; var st=[[s,-1]], ok=true; seen[s]=true;
      while(st.length){ var it=st.pop(), c=it[0], from=it[1]; if(C[c].length>1) continue;
        for(var d=0;d<4;d++){ if(!(C[c][0]&(1<<d))) continue; var n=nb(c,d); if(n<0||n===from||C[n].length>1) continue; if(!(C[n][0]&(1<<OPP[d]))) continue;
          if(seen[n]) return false; seen[n]=true; st.push([n,c]); } } }
    return true; }
  if(!edge(cand,true)) return {score:999,guess:9};
  var guard=0;
  while(!done(cand)&&guard++<400){
    var moved=false;
    /* try-it, then loops */
    for(var c=0;c<N&&!moved;c++){ if(cand[c].length<2) continue;
      var keep=cand[c].filter(function(mm){ var C2=copy(cand); C2[c]=[mm]; return edge(C2,false)&&loopsOk(C2); });
      if(keep.length<cand[c].length&&keep.length){ var loopOnly=cand[c].filter(function(mm){ var C2=copy(cand); C2[c]=[mm]; return edge(C2,false); }).length===keep.length;
        cand[c]=keep; score+=loopOnly?1.5:1.0; edge(cand,true); moved=true; } }
    if(!moved){ /* guess: take the solution's choice for the tile with fewest options */
      var best=-1; for(var c2=0;c2<N;c2++) if(cand[c2].length>1&&(best<0||cand[c2].length<cand[best].length)) best=c2;
      cand[best]=[B.sol[best]]; score+=4; guesses++; edge(cand,true); } }
  return {score:Math.round(score*10)/10, guess:guesses}; }

/* one board */
function make(lv,seed,size){ var L=LV[lv], R=rng(seed*2654435761+size*97+lv*13), W=size, H=size, N=W*H, best=null;
  for(var tries=0;tries<30;tries++){
    var m=tree(W,H,R,.55+R()*.4), leaves=0; m.forEach(function(x){ if(bits(x)===1) leaves++; });
    var fr=leaves/N, target=(L.leaves[0]+L.leaves[1])/2, cost=Math.abs(fr-target);
    if(fr>=L.leaves[0]&&fr<=L.leaves[1]){ best={m:m,cost:0}; break; }
    if(!best||cost<best.cost) best={m:m,cost:cost}; }
  var sol=best.m, bat=-1, opts=[];
  /* the battery goes in a tile with 1-3 wires, away from the very edge when it can */
  for(var c=0;c<N;c++){ var b=bits(sol[c]); if(b>=1&&b<=3){ var r=Math.floor(c/W), q=c%W, inner=(r>0&&r<H-1&&q>0&&q<W-1)?2:1; for(var k=0;k<inner*(b===1?1:2);k++) opts.push(c); } }
  bat=opts[Math.floor(R()*opts.length)];
  var fixed=new Array(N).fill(false); fixed[bat]=true;
  var nlock=Math.round(L.lock*N); var order=[]; for(var i=0;i<N;i++) if(i!==bat&&rots(sol[i]).length>1) order.push(i);
  for(var j=order.length-1;j>0;j--){ var t=Math.floor(R()*(j+1)), tmp=order[j]; order[j]=order[t]; order[t]=tmp; }
  order.slice(0,nlock).forEach(function(c){ fixed[c]=true; });
  /* scramble: every free tile turned 1-3 quarter turns (so none starts right, unless it can't turn into anything new) */
  var start=sol.map(function(x,c){ if(fixed[c]) return 0; var ks=[1,2,3].filter(function(k){ return rot(x,k)!==x; }); return ks.length?ks[Math.floor(R()*ks.length)]:0; });
  var B={W:W,H:H,sol:sol,bat:bat,fixed:fixed,turn:start,bulbs:0};
  sol.forEach(function(x,c){ if(c!==bat&&bits(x)===1) B.bulbs++; });
  B.grade=grade(B); return B; }

/* today's three boards: a few candidates for each, keeping the one whose grade sits best in the day's band */
function day(lv,seed){ var L=LV[lv]; return L.sz.map(function(sz,i){ var best=null;
  for(var k=0;k<6;k++){ var b=make(lv,seed*31+i*7+k*1013,sz), sc=b.grade.score, mid=(L.sc[0]+L.sc[1])/2*(.75+i*.15), d=Math.abs(sc-mid);
    if(!best||d<best.d) best={b:b,d:d}; }
  return best.b; }); }

/* the mask a tile shows after `t` quarter turns */
function cur(B,c,turn){ return rot(B.sol[c],turn==null?B.turn[c]:turn); }
var API={LV:LV,make:make,day:day,power:power,rot:rot,rots:rots,bits:bits,cur:cur,grade:grade,DR:DR,DC:DC,OPP:OPP};
if(typeof module!=="undefined"&&module.exports) module.exports=API; else root.CBG=API;
})(this);
