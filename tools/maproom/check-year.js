/* The Map Room: check the next 365 days (run from the site folder: node tools/maproom/check-year.js [days])
   Reads the core and the pool out of maproom.html, dresses each day's chart, and checks:
   - the careful cartographer works it out completely with the day's rules (so it has exactly one answer, with no guessing);
   - its score lands in the day's band, and no chart repeats.
   Prints each weekday's size and score range. (Grow a new pool with tools/maproom/grow.js.) */
var fs=require("fs"), path=require("path");
var html=fs.readFileSync(path.join(process.cwd(),"maproom.html"),"utf8");
new Function(html.match(/<script id="mrCore">([\s\S]*?)<\/script>/)[1]+"\nglobalThis.MR_POOL=MR_POOL; globalThis.MR_BAND=MR_BAND;")();
var MR=globalThis.MR, POOL=globalThis.MR_POOL;
var BAND=globalThis.MR_BAND; /* the bands are kept in the page with the pool */
var days=+(process.argv[2]||365), start=new Date(); start.setHours(12,0,0,0);
function ymd(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
var by={}, fails=[], seen={};
for(var k=0;k<days;k++){
  var d=new Date(start); d.setDate(d.getDate()+k); var key=ymd(d), wd=d.getDay(), spec=MR.WEEK[wd];
  var p=MR.forDay(key,wd,POOL), g=MR.grade(p,spec.lvl), bad=[];
  if(!g.ok) bad.push("can't be worked out with the day's rules");
  if(g.score<BAND[wd][0]||g.score>BAND[wd][1]) bad.push("score "+g.score+" outside "+BAND[wd].join("-"));
  var sig=MR.encode(p.clue); if(seen[sig]) bad.push("same chart as "+seen[sig]); seen[sig]=key;
  if(bad.length) fails.push(key+" ("+spec.label+"): "+bad.join(", "));
  (by[wd]||(by[wd]=[])).push(g.score);
}
[1,2,3,4,5,6,0].forEach(function(wd){ var s=(by[wd]||[]).sort(function(a,c){ return a-c; }); if(!s.length) return; var spec=MR.WEEK[wd];
  console.log((spec.label+"    ").slice(0,10)+" "+spec.n+" x "+spec.n+"  score "+s[0]+"-"+s[s.length-1]+" (avg "+(s.reduce(function(a,c){ return a+c; },0)/s.length).toFixed(1)+")"); });
if(fails.length){ console.log("\nPROBLEMS ("+fails.length+"):\n"+fails.join("\n")); process.exitCode=1; }
else console.log("\nAll "+days+" days: worked out step by step with no guessing (one answer each), every day in its band, no repeats.");
