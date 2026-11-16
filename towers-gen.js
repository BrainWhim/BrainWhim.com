/* Zayden's Challenge: Brick Towers (Nov 16). Engine shared by zchallenge.html and tools/zchallenge/check-year.js.
   An N x N baseplate. Every row and every column holds one tower of each height 1..N. A clue on the edge says how many towers
   you can see from that side, looking along the line: a taller tower hides every shorter one behind it.
   Clues: top[c], bottom[c], left[r], right[r] (0 = no clue). Optional givens (towers already built). */
(function(root){
"use strict";
function rng(seed){ var s=seed>>>0||1; return function(){ s^=s<<13; s>>>=0; s^=s>>>17; s^=s<<5; s>>>=0; return s/4294967296; }; }
function shuffle(a,R){ for(var i=a.length-1;i>0;i--){ var j=(R()*(i+1))|0, t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
function latin(N,R){ var g=[]; for(var r=0;r<N;r++){ g.push([]); }
  function ok(r,c,v){ for(var i=0;i<c;i++) if(g[r][i]===v) return false; for(var j=0;j<r;j++) if(g[j][c]===v) return false; return true; }
  function fill(k){ if(k===N*N) return true; var r=(k/N)|0, c=k%N, vs=shuffle(seq(N),R);
    for(var i=0;i<vs.length;i++){ if(ok(r,c,vs[i])){ g[r][c]=vs[i]; if(fill(k+1)) return true; } } g[r][c]=0; return false; }
  fill(0); return g; }
function seq(N){ var a=[]; for(var i=1;i<=N;i++) a.push(i); return a; }
function seen(line){ var m=0,n=0; for(var i=0;i<line.length;i++) if(line[i]>m){ m=line[i]; n++; } return n; }
function lineOf(g,side,i,N){ var a=[]; for(var k=0;k<N;k++){ var r,c; if(side==="top"){ r=k;c=i; } else if(side==="bottom"){ r=N-1-k;c=i; } else if(side==="left"){ r=i;c=k; } else { r=i;c=N-1-k; } a.push(g[r][c]); } return a; }
function cluesOf(g){ var N=g.length, cl={top:[],bottom:[],left:[],right:[]}; ["top","bottom","left","right"].forEach(function(s){ for(var i=0;i<N;i++) cl[s].push(seen(lineOf(g,s,i,N))); }); return cl; }
/* permutations of 1..N (cached) */
var PERM={};
function perms(N){ if(PERM[N]) return PERM[N]; var out=[]; (function go(a,used){ if(a.length===N){ out.push(a.slice()); return; } for(var v=1;v<=N;v++) if(!(used&(1<<v))){ a.push(v); go(a,used|(1<<v)); a.pop(); } })([],0); return PERM[N]=out; }
/* the puzzle: {N, clues, givens:[[r,c,v]]}. Logic solver that scores the reasoning; returns {ok, score, steps} */
function logic(P){ var N=P.N, ALL=((1<<(N+1))-2), cand=[], score=0, steps={edge:0,single:0,hidden:0,line:0}, first=null;
  for(var r=0;r<N;r++){ cand.push([]); for(var c=0;c<N;c++) cand[r].push(ALL); }
  function cells(side,i){ var a=[]; for(var k=0;k<N;k++){ if(side==="top") a.push([k,i]); else if(side==="bottom") a.push([N-1-k,i]); else if(side==="left") a.push([i,k]); else a.push([i,N-1-k]); } return a; }
  // edge rules: clue k, distance d: height <= N-k+1+d
  ["top","bottom","left","right"].forEach(function(s){ for(var i=0;i<N;i++){ var k=P.clues[s][i]; if(!k) continue; var cs=cells(s,i);
    cs.forEach(function(q,d){ var mx=N-k+1+d; for(var v=mx+1;v<=N;v++) cand[q[0]][q[1]]&=~(1<<v); });
    if(k===N) cs.forEach(function(q,d){ cand[q[0]][q[1]]=1<<(d+1); }); steps.edge++; } });
  (P.givens||[]).forEach(function(g){ cand[g[0]][g[1]]=1<<g[2]; });
  var stopAt=P.stopAtFirst;
  
  var placed=[]; for(var r=0;r<N;r++){ placed.push([]); for(var c=0;c<N;c++) placed[r].push(0); }
  function bits(m){ var n=0; while(m){ m&=m-1; n++; } return n; }
  function val(m){ for(var v=1;v<=N;v++) if(m===(1<<v)) return v; return 0; }
  function place(r,c,v,why){ if(!first&&!(P.givens||[]).some(function(q){ return q[0]===r&&q[1]===c; })) first=[r,c,v,why]; placed[r][c]=v; cand[r][c]=1<<v; for(var i=0;i<N;i++){ if(i!==c) cand[r][i]&=~(1<<v); if(i!==r) cand[i][c]&=~(1<<v); } }
  function bad(){ for(var r=0;r<N;r++) for(var c=0;c<N;c++) if(!cand[r][c]) return true; return false; }
  var lines=[]; for(var i=0;i<N;i++){ lines.push(["left",i]); lines.push(["top",i]); }
  for(var guard=0;guard<500;guard++){
    if(bad()) return {ok:false,score:score,steps:steps};
    var prog=false; if(stopAt&&first) return {ok:true,first:first,score:score,steps:steps};
    // naked singles
    for(var r=0;r<N&&!prog;r++) for(var c=0;c<N&&!prog;c++) if(!placed[r][c]&&bits(cand[r][c])===1){ place(r,c,val(cand[r][c]),"only"); steps.single++; score+=.4; prog=true; }
    if(prog) continue;
    // hidden singles in rows and columns
    for(var i=0;i<N&&!prog;i++) for(var v=1;v<=N&&!prog;v++){ var rc=[],cc=[];
      for(var k=0;k<N;k++){ if(cand[i][k]&(1<<v)) rc.push(k); if(cand[k][i]&(1<<v)) cc.push(k); }
      if(rc.length===1&&!placed[i][rc[0]]){ place(i,rc[0],v,"row"); steps.hidden++; score+=1.2; prog=true; }
      else if(cc.length===1&&!placed[cc[0]][i]){ place(cc[0],i,v,"col"); steps.hidden++; score+=1.2; prog=true; } }
    if(prog) continue;
    // whole-line reasoning: which orders fit this row or column and its clues?
    var bestGain=0;
    for(var li=0;li<lines.length&&!prog;li++){ var L=lines[li], cs=L[0]==="left"?cells("left",L[1]):cells("top",L[1]),
        k1=P.clues[L[0]][L[1]], k2=P.clues[L[0]==="left"?"right":"bottom"][L[1]], un=new Array(N).fill(0), cnt=0;
      perms(N).forEach(function(p){ for(var d=0;d<N;d++) if(!(cand[cs[d][0]][cs[d][1]]&(1<<p[d]))) return;
        if(k1&&seen(p)!==k1) return; if(k2&&seen(p.slice().reverse())!==k2) return; cnt++; for(var d2=0;d2<N;d2++) un[d2]|=1<<p[d2]; });
      if(!cnt) return {ok:false,score:score,steps:steps};
      var gain=0; cs.forEach(function(q,d){ var nm=cand[q[0]][q[1]]&un[d]; if(nm!==cand[q[0]][q[1]]){ gain++; cand[q[0]][q[1]]=nm; } });
      if(gain){ steps.line++; score+=3.5+(k1&&k2?0:1); prog=true; } }
    if(prog) continue;
    break; }
  for(var r=0;r<N;r++) for(var c=0;c<N;c++) if(!placed[r][c]&&bits(cand[r][c])!==1) return {ok:false,score:score,steps:steps};
  return {ok:true,score:+score.toFixed(1),steps:steps,first:first}; }
/* count solutions (stop at 2) by backtracking */
function count(P){ var N=P.N, g=[], n=0; for(var r=0;r<N;r++){ g.push(new Array(N).fill(0)); } (P.givens||[]).forEach(function(q){ g[q[0]][q[1]]=q[2]; });
  function okLine(side,i){ var k=P.clues[side][i]; if(!k) return true; var l=lineOf(g,side,i,N); if(l.indexOf(0)>=0){ // partial check: visible so far from this side can't exceed k
      var m=0,s=0; for(var x=0;x<N;x++){ if(!l[x]) break; if(l[x]>m){ m=l[x]; s++; } } return s<=k; } return seen(l)===k; }
  function go(k){ if(n>1) return; if(k===N*N){ n++; return; } var r=(k/N)|0, c=k%N; if(g[r][c]&&(P.givens||[]).some(function(q){ return q[0]===r&&q[1]===c; })){ go(k+1); return; }
    for(var v=1;v<=N;v++){ var ok=true; for(var i=0;i<N;i++){ if((i!==c&&g[r][i]===v)||(i!==r&&g[i][c]===v)){ ok=false; break; } } if(!ok) continue;
      g[r][c]=v; if(okLine("left",r)&&okLine("top",c)&&(c<N-1||okLine("right",r))&&(r<N-1||okLine("bottom",c))) go(k+1); g[r][c]=0; } }
  go(0); return n; }
var LV=[ // warm-ups Mon..Sun, then the weekly Challenge (index 7); score bands keep the climb even (Nov 16)
  {N:4,keep:[14,16],sc:[5,8]},{N:4,keep:[11,14],sc:[8,11.5]},{N:4,keep:[9,12],sc:[11.5,15]},{N:4,keep:[7,10],sc:[15,19.5]},
  {N:4,keep:[5,8],sc:[19.5,26]},{N:5,keep:[14,18],sc:[26,34]},{N:5,keep:[10,14],sc:[34,44]},{N:6,keep:[10,14],sc:[65,95]}];
function make(lv,seed){ var p=LV[lv], N=p.N, R=rng(seed*2654435761+lv*131+11), tries=0;
  for(;;){ tries++; var g=latin(N,R), all=cluesOf(g), P={N:N,clues:JSON.parse(JSON.stringify(all)),givens:[],sol:g};
    if(!logic(P).ok) continue;
    var slots=[]; ["top","bottom","left","right"].forEach(function(s){ for(var i=0;i<N;i++) slots.push([s,i]); }); shuffle(slots,R);
    var target=p.keep[0]+((R()*(p.keep[1]-p.keep[0]+1))|0), have=4*N;
    for(var j=0;j<slots.length&&have>target;j++){ var s=slots[j], old=P.clues[s[0]][s[1]]; P.clues[s[0]][s[1]]=0;
      if(logic(P).ok) have--; else P.clues[s[0]][s[1]]=old; }
    var L=logic(P); if(!L.ok) continue;
    if(tries<400&&(L.score<p.sc[0]||L.score>p.sc[1])) continue;
    P.score=L.score; P.steps=L.steps; P.lv=lv; P.nclues=have; return P; } }
function weekOf(dayN){ return Math.floor((dayN+3)/7); } /* weeks start on Monday (day 0 = Thursday, Jan 1 1970) */
var API={LV:LV,make:make,logic:logic,count:count,cluesOf:cluesOf,seen:seen,weekOf:weekOf,rng:rng};
if(typeof module!=="undefined"&&module.exports) module.exports=API; else root.TWG=API;
})(typeof window!=="undefined"?window:globalThis);
