/* Jack's Bee Garden: checks the next 365 days (run from the site folder: node tools/beegarden/check-year.js).
   For each day it takes the day's garden from the pool, solves it afresh, and checks that the fewest moves match the
   pool's grade and land in the weekday's band, and that no garden repeats in the year. */
var fs=require("fs"), path=require("path");
var html=fs.readFileSync(path.join(process.cwd(),"beegarden.html"),"utf8");
(new Function(html.match(/<script id="jbCore">([\s\S]*?)<\/script>/)[1]))();
var JB=globalThis.JB, EPOCH=new Date(2026,9,1), DAYS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
function dayNo(d){ return Math.round((new Date(d.getFullYear(),d.getMonth(),d.getDate())-EPOCH)/864e5)+1; }
var start=new Date(), bad=0, seen={}, stats={}, slow=0;
for(var i=0;i<365;i++){
  var d=new Date(start.getFullYear(),start.getMonth(),start.getDate()+i), wd=d.getDay();
  var e=JB.pickDay(wd,Math.floor((dayNo(d)-1)/7)), z=JB.decode(e.s,e.flip), t=Date.now(), p=JB.solve(z.B,z.P), ms=Date.now()-t; slow=Math.max(slow,ms);
  var band=JB.WEEK[wd], ok=p&&p.length===e.d&&e.d>=band[0]&&e.d<=band[1]&&!seen[e.s+e.flip]&&JB.occ(z.B,z.P);
  if(!ok){ bad++; console.log("PROBLEM",d.toDateString(),e.s,e.d,p&&p.length); }
  seen[e.s+e.flip]=1; var S=stats[wd]||(stats[wd]={n:0,min:99,max:0,sum:0,pc:0}); S.n++; S.sum+=e.d; S.min=Math.min(S.min,e.d); S.max=Math.max(S.max,e.d); S.pc+=z.B.length-1;
}
[1,2,3,4,5,6,0].forEach(function(w){ var S=stats[w]; console.log(DAYS[w]+": fewest moves "+S.min+"-"+S.max+" (avg "+(S.sum/S.n).toFixed(1)+"), pieces avg "+(S.pc/S.n).toFixed(1)+", pool "+JB.POOL[w].length); });
console.log(bad?bad+" problem day(s).":"All 365 days pass: one graded garden each, no repeats. Slowest solve "+slow+" ms.");
