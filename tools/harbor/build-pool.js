/* Builds the graded pool for the Harbor: reads the hill-climb files (hard days) and makes easy days with random marinas,
   trims boats that do nothing, re-checks every start with a plain search, keeps puzzles that aren't near copies of each other,
   and prints the POOL object for the page. */
require("./core.js");
var HB=globalThis.HB, fs=require("fs");
var BANDS={1:[6,9],2:[10,13],3:[14,17],4:[18,22],5:[23,27],6:[28,33],0:[34,60]};
var WANT=80;
function decode(s){ var B=[],P=[],seen={}; for(var c=0;c<36;c++){ var ch=s[c]; if(ch==="."||seen[ch]) continue; seen[ch]=1;
  var r=Math.floor(c/6), col=c%6, h=col<5&&s[c+1]===ch, len=1; if(h){ while(col+len<6&&s[c+len]===ch) len++; } else { while(r+len<6&&s[c+len*6]===ch) len++; }
  var b=h?{r:r,c:0,len:len,h:true}:{r:0,c:col,len:len,h:false}; var idx=ch==="A"?0:-1; if(idx===0){ B.unshift(b); P.unshift(h?col:r); } else { B.push(b); P.push(h?col:r); } }
  return {B:B,P:P}; }
function encode(B,P){ var g=HB.occ(B,P), L="ABCDEFGHIJKLMNOPQRSTUVWXYZ", o=""; for(var c=0;c<36;c++) o+=g[c]<0?".":L[g[c]]; return o; }
function sig(B,P){ return B.map(function(b,i){ return (b.h?"h":"v")+(b.h?b.r:b.c)+":"+P[i]+":"+b.len; }); }
function trim(B,P){ var path=HB.solve(B,P), d=path.length;
  for(var j=B.length-1;j>=1;j--){ var used=path.some(function(m){ return m[0]===j; }); if(used) continue;
    var B2=B.slice(0,j).concat(B.slice(j+1)), P2=P.slice(0,j).concat(P.slice(j+1)), s=HB.solve(B2,P2);
    if(s&&s.length===d){ B=B2; P=P2; path=s; } }
  return {B:B,P:P,d:d}; }
var cand={}; Object.keys(BANDS).forEach(function(k){ cand[k]=[]; });
function band(d){ for(var k in BANDS) if(d>=BANDS[k][0]&&d<=BANDS[k][1]) return k; return null; }
var lines=[]; fs.readdirSync(".").filter(function(f){ return /^pool-.*\.jsonl$/.test(f); }).forEach(function(f){ lines=lines.concat(fs.readFileSync(f,"utf8").trim().split("\n")); });
lines.forEach(function(l){ var o=JSON.parse(l), k=band(o.d); if(k==null) return; var z=decode(o.s); cand[k].push({B:z.B,P:z.P,src:"climb"}); });
/* easy days: random marinas (the cluster's hardest start) */
var r=HB.rng("harbor-easy");
for(var t=0;t<(process.env.ONLY?0:30000);t++){ var low=[1,2,3][t%3]; if(cand[low].length>WANT*6) continue;
  var n=5+Math.floor(r()*5)+(low-1), L=(function(){ var B=[{r:2,c:0,len:2,h:true}],P=[Math.floor(r()*3)],tries=0; while(B.length<n+1&&tries<300){ tries++; var len=r()<.3?3:2,h=r()<.5,line=Math.floor(r()*6),pos=Math.floor(r()*(7-len)); if(h&&line===2) continue; var b=h?{r:line,c:0,len:len,h:true}:{r:0,c:line,len:len,h:false}; if(HB.occ(B.concat([b]),P.concat([pos]))){ B.push(b); P.push(pos); } } return {B:B,P:P}; })();
  var C=HB.cluster(L.B,L.P); if(!C) continue; var mx=-1,at=-1; for(var i=0;i<C.d.length;i++) if(C.d[i]>mx){ mx=C.d[i]; at=i; }
  var k=band(mx); if(k==null||+k>3) continue; cand[k].push({B:L.B,P:C.list[at].slice(),src:"rand"}); }
var POOL=process.env.ONLY?JSON.parse(fs.readFileSync("pool.json","utf8")):{}, report={};
Object.keys(BANDS).forEach(function(k){
  if(process.env.ONLY&&process.env.ONLY!==k) return;
  var list=cand[k], rr=HB.rng("pick:"+k), keep=[], sigs=[];
  for(var i=list.length-1;i>0;i--){ var j=Math.floor(rr()*(i+1)), tmp=list[i]; list[i]=list[j]; list[j]=tmp; }
  for(var q=0;q<list.length&&keep.length<WANT;q++){
    var T=trim(list[q].B,list[q].P); if(band(T.d)!==k) continue;
    if(T.B.length<5) continue;
    var sg=sig(T.B,T.P), near=sigs.some(function(o){ var same=sg.filter(function(x){ return o.indexOf(x)>=0; }).length; return same>=Math.max(sg.length,o.length)*(k==="0"?.75:.6); });
    if(near) continue;
    sigs.push(sg); keep.push({s:encode(T.B,T.P),d:T.d,b:T.B.length-1}); }
  POOL[k]=keep; report[k]={cands:list.length,kept:keep.length,d:keep.map(function(x){ return x.d; }).sort(function(a,b){return a-b;}).join(" "),boats:keep.reduce(function(a,x){ return a+x.b; },0)/Math.max(1,keep.length)};
});
fs.writeFileSync("pool.json",JSON.stringify(POOL));
console.log(JSON.stringify(report,null,1));
