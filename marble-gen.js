/* Zayden's Marble Run: board engine, solver and daily generator (Nov 16). Shared by marblerun.html and tools/marble/check-year.js.
   A board is H rows x W columns. The marble drops from the chute above column s and falls straight down through empty holes.
   A ramp sends it one column over as it drops: "R" rolls right (down to the next row, one column right), "L" rolls left.
   "X" is a wooden block: the marble gets stuck. "G" is a gem (an empty hole the marble must pass through). The cup sits under column g.
   Every gem must be collected and the marble must land in the cup. Ramps fixed on the board are dark; the player places the tray's ramps. */
(function(root){
"use strict";
function rng(seed){ var s=seed>>>0||1; return function(){ s^=s<<13; s>>>=0; s^=s>>>17; s^=s<<5; s>>>=0; return s/4294967296; }; }
var LV=[ // Mon..Sun (score bands set from the measured spread, Nov 16)
  {W:4,H:5,k:2,gems:1,fix:0,dec:0,rocks:2,sol:[1,3],sc:[5.5,7.0]},
  {W:5,H:6,k:2,gems:2,fix:1,dec:0,rocks:3,sol:[1,3],sc:[7.0,8.6]},
  {W:5,H:7,k:3,gems:2,fix:1,dec:0,rocks:3,sol:[1,2],sc:[8.6,10.2]},
  {W:5,H:7,k:3,gems:2,fix:1,dec:1,rocks:4,sol:[1,2],sc:[10.2,11.8]},
  {W:6,H:8,k:4,gems:2,fix:1,dec:1,rocks:4,sol:[1,2],sc:[12.0,13.6]},
  {W:6,H:9,k:4,gems:3,fix:1,dec:2,rocks:5,sol:[1,1],sc:[13.8,15.8]},
  {W:6,H:9,k:5,gems:3,fix:0,dec:2,rocks:5,sol:[1,1],sc:[16.0,18.4]}];
function at(b,pl,r,c){ var k=r*b.W+c; return pl&&pl[k]?pl[k]:b.cells[k]; }
/* run the marble; returns {path:[[r,c],...], end:"cup"|"miss"|"off"|"stuck", gems:n, all:bool} */
function run(b,pl){ var r=0,c=b.s,path=[],got=0,end;
  for(;;){ if(c<0||c>=b.W){ end="off"; break; } if(r>=b.H){ end=(c===b.g?"cup":"miss"); break; }
    path.push([r,c]); var v=at(b,pl,r,c);
    if(v==="X"){ end="stuck"; break; }
    if(v==="R"){ c++; r++; } else if(v==="L"){ c--; r++; } else { if(v==="G") got++; r++; } }
  return {path:path,end:end,gems:got,all:got===b.ngems&&end==="cup",win:got===b.ngems&&end==="cup"}; }
/* solver: every way to place tray ramps on the marble's path. Returns solutions (placement maps), leaves, fewest pieces */
function solve(b,inv,cap){ var sols=[],leaves=0,minK=99; cap=cap||50;
  function go(r,c,got,pl,iR,iL,k){
    for(;;){ if(c<0||c>=b.W){ leaves++; return; } if(r>=b.H){ leaves++; if(c===b.g&&got===b.ngems){ if(sols.length<cap) sols.push(Object.assign({},pl)); minK=Math.min(minK,k); } return; }
      var key=r*b.W+c, v=pl[key]||b.cells[key];
      if(v==="X"){ leaves++; return; }
      if(v==="R"){ c++; r++; continue; } if(v==="L"){ c--; r++; continue; }
      if(v==="G"){ got++; r++; continue; }
      // an empty hole on the path: leave it, or place a ramp
      if(iR>0){ pl[key]="R"; go(r+1,c+1,got,pl,iR-1,iL,k+1); delete pl[key]; }
      if(iL>0){ pl[key]="L"; go(r+1,c-1,got,pl,iR,iL-1,k+1); delete pl[key]; }
      r++; } }
  go(0,b.s,0,{},inv.R,inv.L,0); return {sols:sols,leaves:leaves,minK:minK}; }
/* difficulty score: pieces to place, gems, board size and how many dead ends the search meets per solution */
function score(b,inv,res){ var n=res.sols.length||1; return +(res.minK*1.4+b.ngems*.6+Math.log2(1+res.leaves/n)*.9+(b.W*b.H)/30).toFixed(2); }
function make(lv,seed){ var p=LV[lv], R=rng(seed*2654435761+lv*97+7), tries=0;
  for(;;){ tries++;
    var W=p.W,H=p.H,cells=new Array(W*H).fill(""), s=(R()*W)|0, c=s, path=[], moves=[];
    // the designed path: k player ramps + fix fixed ramps, the rest straight drops
    var nd=p.k+p.fix, slots=[]; for(var i=0;i<H;i++) slots.push(i); for(var i=H-1;i>0;i--){ var j=(R()*(i+1))|0, t=slots[i]; slots[i]=slots[j]; slots[j]=t; }
    var diag={}; slots.slice(0,nd).forEach(function(r){ diag[r]=1; }); var ok=true;
    for(var r=0;r<H;r++){ path.push([r,c]); if(diag[r]){ var d=(c===0)?1:(c===W-1)?-1:(R()<.5?1:-1); moves.push(d); c+=d; } else moves.push(0); }
    var g=c, onPath={}; path.forEach(function(q){ onPath[q[0]*W+q[1]]=1; });
    // which diagonal steps are fixed ramps (the rest are the player's)
    var drs=[]; moves.forEach(function(m,r){ if(m) drs.push(r); }); for(var i=drs.length-1;i>0;i--){ var j=(R()*(i+1))|0, t=drs[i]; drs[i]=drs[j]; drs[j]=t; }
    var fixed=drs.slice(0,p.fix), inv={R:0,L:0};
    drs.forEach(function(r){ var key=path[r][0]*W+path[r][1]; if(fixed.indexOf(r)>=0) cells[key]=moves[r]>0?"R":"L"; else inv[moves[r]>0?"R":"L"]++; });
    // gems on straight-drop path cells (not the first row)
    var straight=path.filter(function(q,r){ return !moves[r]&&r>0; }); if(straight.length<p.gems) continue;
    for(var i=straight.length-1;i>0;i--){ var j=(R()*(i+1))|0, t=straight[i]; straight[i]=straight[j]; straight[j]=t; }
    straight.slice(0,p.gems).forEach(function(q){ cells[q[0]*W+q[1]]="G"; });
    // blocks and a few fixed decoy ramps off the path
    var off=[]; for(var k=0;k<W*H;k++) if(!onPath[k]) off.push(k);
    for(var i=off.length-1;i>0;i--){ var j=(R()*(i+1))|0, t=off[i]; off[i]=off[j]; off[j]=t; }
    var nr=p.rocks+((R()*2)|0); off.slice(0,nr).forEach(function(k){ cells[k]="X"; });
    off.slice(nr,nr+((R()*2)|0)+(lv>=3?1:0)).forEach(function(k){ cells[k]=R()<.5?"R":"L"; });
    for(var i=0;i<p.dec;i++) inv[R()<.5?"R":"L"]++;
    var b={W:W,H:H,s:s,g:g,cells:cells,ngems:p.gems}, res=null, bad=false;
    // carve: block the cells that other routes use until only the designed kind of solution is left
    for(var it=0;it<14;it++){
      var alt=null, r0=run(b,{});
      if(r0.win) alt=r0.path; else { res=solve(b,inv,24); if(!res.sols.length){ bad=true; break; }
        if(res.minK>=p.k&&res.sols.length<=p.sol[1]) break;
        var pick=res.sols.filter(function(sl){ return Object.keys(sl).length<p.k; })[0]||res.sols[res.sols.length-1];
        alt=run(b,pick).path; }
      var free=alt.filter(function(q){ var k=q[0]*W+q[1]; return !onPath[k]&&cells[k]===""; });
      if(!free.length){ bad=true; break; } var q=free[(R()*free.length)|0]; cells[q[0]*W+q[1]]="X"; }
    if(bad||!res)continue;
    if(run(b,{}).win) continue;
    res=solve(b,inv,24); if(!res.sols.length||res.minK<p.k||res.sols.length>p.sol[1])continue;
    var sc=score(b,inv,res); if(tries<3000&&(sc<p.sc[0]||sc>p.sc[1])) continue;
    b.inv=inv; b.sol=res.sols[0]; b.score=sc; b.nsol=res.sols.length; b.lv=lv; return b; } }
/* today's three boards */
function day(lv,dayN){ return [0,1,2].map(function(i){ return make(lv,dayN*31+i*7919+3); }); }
var API={LV:LV,run:run,solve:solve,score:score,make:make,day:day,rng:rng};
if(typeof module!=="undefined"&&module.exports) module.exports=API; else root.MRG=API;
})(typeof window!=="undefined"?window:globalThis);
