/* Color Sort (The Outpost · The Lab), Nov 12. Puzzle engine shared by colorsort.html and tools/colorsort/check-year.js.
   A bottle is an array of color numbers, bottom first; every bottle holds CAP layers.
   A pour moves the top run of one color onto an empty bottle or onto the same color, as much as fits.
   Solved: every bottle is empty or full of one color. */
(function(root){
"use strict";
var CAP=4;
function rng(seed){ return function(){ seed|=0; seed=seed+0x6D2B79F5|0; var t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function top(b){ return b.length?b[b.length-1]:-1; }
function run(b){ var c=top(b), n=0; for(var i=b.length-1;i>=0&&b[i]===c;i--) n++; return n; }
/* how many layers pour from bottle a into bottle b (0 = not allowed). Pointless pours (a whole one-color bottle into an empty one) count as not allowed for the solver only. */
function canPour(B,a,b){ if(a===b) return 0; var A=B[a], T=B[b]; if(!A.length||T.length>=CAP) return 0;
  if(T.length&&top(T)!==top(A)) return 0; return Math.min(run(A),CAP-T.length); }
function pour(B,a,b){ var n=canPour(B,a,b); if(!n) return 0; for(var i=0;i<n;i++) B[b].push(B[a].pop()); return n; }
function full(b){ return b.length===CAP&&run(b)===CAP; }
function solved(B){ return B.every(function(b){ return !b.length||full(b); }); }
function key(B){ return B.map(function(b){ return b.join(""); }).sort().join("|"); }
function clone(B){ return B.map(function(b){ return b.slice(); }); }
function moves(B){ var m=[]; for(var a=0;a<B.length;a++) for(var b=0;b<B.length;b++){ var n=canPour(B,a,b); if(!n) continue;
    if(!B[b].length&&run(B[a])===B[a].length) continue; /* moving a pure bottle into an empty one changes nothing */
    m.push([a,b]); } return m; }
/* breadth-first search: the shortest list of pours to solve, or null. Also counts the states it saw. */
function solve(B0,limit){ limit=limit||400000; var k0=key(B0); if(solved(B0)) return {path:[],seen:1};
  var Q=[B0], P={}, M={}, head=0; P[k0]=null; var seen=1;
  while(head<Q.length){ var B=Q[head++], kb=key(B), ms=moves(B);
    for(var i=0;i<ms.length;i++){ var C=clone(B); pour(C,ms[i][0],ms[i][1]); var kc=key(C); if(kc in P) continue;
      P[kc]=kb; M[kc]=[ms[i],B,C]; seen++; if(seen>limit) return null;
      if(solved(C)){ /* walk back, re-finding real bottle indexes along the way */
        var keys=[kc]; while(P[keys[0]]!==k0) keys.unshift(P[keys[0]]);
        var path=[], cur=clone(B0);
        keys.forEach(function(kk){ var mv=findMove(cur,kk); path.push(mv); pour(cur,mv[0],mv[1]); });
        return {path:path,seen:seen}; }
      Q.push(C); } }
  return null; }
function findMove(B,want){ var ms=moves(B); for(var i=0;i<ms.length;i++){ var C=clone(B); pour(C,ms[i][0],ms[i][1]); if(key(C)===want) return ms[i]; } return null; }
/* every state reachable from B0, and how many of them can no longer be solved (dead ends a kid can wander into) */
function survey(B0,limit){ limit=limit||200000; var S={}, E={}, Q=[B0], head=0, k0=key(B0); S[k0]=B0;
  while(head<Q.length){ var B=Q[head++], kb=key(B), ms=moves(B), out=[];
    for(var i=0;i<ms.length;i++){ var C=clone(B); pour(C,ms[i][0],ms[i][1]); var kc=key(C); out.push(kc); if(!(kc in S)){ S[kc]=C; Q.push(C); if(Q.length>limit) return null; } }
    E[kb]=out; }
  var good={}, ch=true, ks=Object.keys(S); ks.forEach(function(k){ if(solved(S[k])) good[k]=1; });
  while(ch){ ch=false; ks.forEach(function(k){ if(good[k]) return; if(E[k].some(function(x){ return good[x]; })){ good[k]=1; ch=true; } }); }
  var dead=ks.filter(function(k){ return !good[k]; }).length;
  /* first-move traps: pours from the start that lead somewhere unsolvable */
  var first=E[k0], trap=first.filter(function(x){ return !good[x]; }).length;
  return {states:ks.length,dead:dead,first:first.length,trap:trap}; }

/* ---------- the week (Judy's rules: a gentle but real climb; Monday not trivial; Sunday properly hard; fewer pieces, not crowded) ----------
   colors, empty bottles, and a band of shortest-solution length (pours). Checked over a year with tools/colorsort/check-year.js. */
var WEEK=[ /* Mon … Sun */
  {c:3,e:2,lo:7,hi:8},
  {c:3,e:2,lo:9,hi:10},
  {c:4,e:2,lo:11,hi:12},
  {c:4,e:2,lo:13,hi:14},
  {c:5,e:2,lo:14,hi:15},
  {c:5,e:2,lo:16,hi:16},
  {c:5,e:2,lo:17,hi:19}];
function lvOf(wd){ return wd===0?6:wd-1; }
function deal(R,c,e){ var L=[]; for(var i=0;i<c;i++) for(var j=0;j<CAP;j++) L.push(i);
  for(var i=L.length-1;i>0;i--){ var j=Math.floor(R()*(i+1)), t=L[i]; L[i]=L[j]; L[j]=t; }
  var B=[]; for(var i=0;i<c;i++) B.push(L.slice(i*CAP,i*CAP+CAP)); for(var i=0;i<e;i++) B.push([]); return B; }
/* no bottle starts already sorted, and no bottle starts with three of a kind on top */
function fair(B){ return B.every(function(b){ return !b.length||(run(b)<3); }); }
/* the colors used: picked from the six potions, the same for a given seed */
function make(lv,seed){ var W=WEEK[lv], R=rng(seed), tries=0, best=null;
  while(tries++<400){ var B=deal(R,W.c,W.e); if(!fair(B)) continue; var s=solve(B); if(!s) continue; var n=s.path.length;
    if(n>=W.lo&&n<=W.hi){ best={B:B,min:n,tries:tries}; break; }
    if(!best||Math.abs(n-(W.lo+W.hi)/2)<Math.abs(best.min-(W.lo+W.hi)/2)) best={B:B,min:n,tries:tries}; }
  /* paint: map color numbers onto a seeded pick of the six potions */
  var pal=[0,1,2,3,4,5]; for(var i=5;i>0;i--){ var j=Math.floor(R()*(i+1)), t=pal[i]; pal[i]=pal[j]; pal[j]=t; }
  var B2=best.B.map(function(b){ return b.map(function(x){ return pal[x]; }); });
  /* shuffle bottle order so the empties aren't always at the end; keep it seeded */
  for(var i=B2.length-1;i>0;i--){ var j=Math.floor(R()*(i+1)), t=B2[i]; B2[i]=B2[j]; B2[j]=t; }
  return {B:B2,min:best.min,lv:lv,c:W.c,e:W.e}; }
function daySeed(n){ return n*7919+104729; }
var API={CAP:CAP,rng:rng,top:top,run:run,canPour:canPour,pour:pour,full:full,solved:solved,solve:solve,survey:survey,moves:moves,clone:clone,
  WEEK:WEEK,lvOf:lvOf,make:make,daySeed:daySeed};
if(typeof module!=="undefined"&&module.exports) module.exports=API; else root.CSG=API;
})(this);
