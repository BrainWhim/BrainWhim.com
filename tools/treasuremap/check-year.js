/* Captain Zayden's Map: check the next 365 days (run from the site folder: node tools/treasuremap/check-year.js [days])
   Reads the core, the pool and the day picker out of treasure-map.html, and checks that each day's map is worked out
   step by step with no guessing (exactly one answer) using that day's rules, lands in its band, and doesn't repeat.
   Grow a new pool with tools/treasuremap/grow.js and paste its output over TM_WEEK/TM_BAND/TM_POOL in the page. */
var fs=require("fs"), path=require("path");
var html=fs.readFileSync(path.join(process.cwd(),"treasure-map.html"),"utf8");
new Function(html.match(/<script id="tmCore">([\s\S]*?)<\/script>/)[1]+"\nglobalThis.TM_POOL=TM_POOL;globalThis.TM_BAND=TM_BAND;globalThis.TM_WEEK=TM_WEEK;globalThis.tmForDay=tmForDay;")();
var MR=globalThis.MR, BAND=globalThis.TM_BAND, WEEK=globalThis.TM_WEEK, N=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
var days=+(process.argv[2]||365), start=new Date(); start.setHours(12,0,0,0);
function ymd(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
var by={}, fails=[], seen={};
for(var k=0;k<days;k++){ var d=new Date(start); d.setDate(d.getDate()+k); var key=ymd(d), wd=d.getDay();
  var p=globalThis.tmForDay(key,wd), g=MR.grade(p,p.lvl), bad=[];
  if(!g.ok) bad.push("can't be worked out with the day's rules");
  if(g.score<BAND[wd][0]||g.score>BAND[wd][1]) bad.push("score "+g.score+" outside "+BAND[wd][0]+"-"+BAND[wd][1]);
  var sig=MR.encode(p.clue); if(seen[sig]) bad.push("same map as "+seen[sig]); seen[sig]=key;
  if(bad.length) fails.push(key+" ("+N[wd]+"): "+bad.join(", ")); (by[wd]||(by[wd]=[])).push(g.score); }
[1,2,3,4,5,6,0].forEach(function(wd){ var s=(by[wd]||[]).sort(function(a,c){ return a-c; }); if(!s.length) return;
  console.log((N[wd]+"    ").slice(0,10)+" "+WEEK[wd].n+" x "+WEEK[wd].n+"  score "+s[0]+"-"+s[s.length-1]+" (avg "+(s.reduce(function(a,c){ return a+c; },0)/s.length).toFixed(1)+")"); });
if(fails.length){ console.log("\nPROBLEMS ("+fails.length+"):\n"+fails.join("\n")); process.exitCode=1; }
else console.log("\nAll "+days+" days: worked out step by step with no guessing (one answer each), every day in its band, no repeats.");
