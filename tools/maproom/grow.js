/* The Map Room: grow the graded pool (node grow.js > pool.txt). Each weekday's band: score range and the least use of its top rule. */
require("./core.js") /* run from tools/maproom */; var MR=globalThis.MR;
var BAND={0:[190,290,"ahead",4],1:[38,52,"loop",0],2:[48,58,"loop",1],3:[60,76,"corner",2],4:[74,92,"corner",3],5:[96,130,"ahead",1,4],6:[130,185,"ahead",1]};  /* eased Nov 6 (Judy: Tue-Fri too hard): Mon 44.6, Tue ~54, Wed ~69, Thu ~86, Fri ~116, Sat ~160, Sun ~243 */
var WANT=+(process.argv[2]||20), out={};
[1,2,3,4,5,6,0].forEach(function(wd){ var sp=MR.WEEK[wd], b=BAND[wd], got=[], seen={}, t=0;
  while(got.length<WANT&&t<20000){ t++;
    var p=MR.make("mr"+wd+":"+t,{n:sp.n,lvl:sp.lvl});
    var land=p.inn.reduce((a,x)=>a+x,0); if(land<sp.n*sp.n*.3) continue;
    if(p.score<b[0]||p.score>b[1]||(p.used[b[2]]||0)<b[3]||(b[4]&&(p.used[b[2]]||0)>b[4])) continue;
    if(sp.lvl<4&&p.top<sp.lvl&&wd!==1) continue;
    var okAll=true; for(var k=1;k<8&&okAll;k++){ var g=MR.grade({n:sp.n,clue:MR.dress(sp.n,p.clue,k)},sp.lvl); if(!g.ok||g.score<b[0]||g.score>b[1]) okAll=false; }
    if(!okAll) continue;
    var e=MR.encode(p.clue); if(seen[e]) continue; seen[e]=1; got.push({e:e,s:p.score});
  }
  got.sort((a,c)=>a.s-c.s); out[wd]=got.map(x=>x.e);
  console.error(sp.label,got.length,"tries",t,"scores",got.map(x=>x.s).join(","));
});
console.log("var MR_BAND="+JSON.stringify(BAND)+";\nvar MR_POOL="+JSON.stringify(out)+";");
