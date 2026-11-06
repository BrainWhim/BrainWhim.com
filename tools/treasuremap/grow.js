/* Captain Zayden's Map: grow the graded pool (node grow.js [per-day] > pool.js). Uses the Map Room core.
   Kids' week: 4x4 Mon -> 6x6 Sun. BAND[wd] = [minScore, maxScore, (unused), maxClues]; TW[wd] = size, top rule level, least numbers kept.
   Friday needs a corner step, Saturday two, Sunday 1-3 look-aheads. Every turn and flip is re-graded. */
require("../maproom/core.js") /* run from tools/treasuremap */; var MR=globalThis.MR;
var TW={1:{n:4,lvl:2,keep:10},2:{n:4,lvl:2},3:{n:5,lvl:2,keep:14},4:{n:5,lvl:2},5:{n:5,lvl:3},6:{n:6,lvl:3},0:{n:6,lvl:4}};
var BAND={1:[14,30,0,99],2:[28,38,0,9],3:[36,48,0,99],4:[44,54,0,12],5:[52,66,1,99],6:[66,84,2,99],0:[86,124,1,99]};
var WANT=+(process.argv[2]||30), out={}, info={};
[1,2,3,4,5,6,0].forEach(function(wd){ var sp=TW[wd], b=BAND[wd], got=[], seen={}, t=0;
  while(got.length<WANT&&t<40000){ t++;
    var p=MR.make("tm"+wd+":"+t,{n:sp.n,lvl:sp.lvl,keep:sp.keep||0});
    var land=p.inn.reduce((a,x)=>a+x,0); if(land<sp.n*sp.n*.3) continue;
    var cl=p.clue.filter(x=>x>=0).length; if(cl>b[3]) continue;
    if(p.score<b[0]||p.score>b[1]) continue;
    if(wd===5&&(p.used.corner||0)<1) continue;
    if(wd===6&&(p.used.corner||0)<2) continue;
    if(wd===0&&((p.used.ahead||0)<1||(p.used.ahead||0)>3)) continue;
    var okAll=true; for(var k=1;k<8&&okAll;k++){ var g=MR.grade({n:sp.n,clue:MR.dress(sp.n,p.clue,k)},sp.lvl); if(!g.ok||g.score<b[0]||g.score>b[1]) okAll=false; }
    if(!okAll) continue;
    var e=MR.encode(p.clue); if(seen[e]) continue; seen[e]=1; got.push({e:e,s:p.score});
  }
  got.sort((a,c)=>a.s-c.s); out[wd]=got.map(x=>x.e);
  console.error(wd,sp.n,"got",got.length,"tries",t,"scores",got[0]&&got[0].s,"-",got.length&&got[got.length-1].s,"avg",(got.reduce((a,x)=>a+x.s,0)/got.length).toFixed(1));
});
console.log("var TM_WEEK="+JSON.stringify(TW)+";\nvar TM_BAND="+JSON.stringify(BAND)+";\nvar TM_POOL="+JSON.stringify(out)+";");
