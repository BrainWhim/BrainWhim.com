/* The Garden Plots: check the next 365 days (run from the site folder: node tools/gardenplots/check-year.js [days])
   Reads the core out of gardenplots.html, makes each day's garden, and checks:
   - exactly one answer (a full count), and it's the maker's;
   - it can be worked out step by step with no guessing, using only the reasoning the day allows;
   - its score lands in the day's band.
   Prints each weekday's size and score range, and the slowest day. */
var fs=require("fs"), path=require("path");
var html=fs.readFileSync(path.join(process.cwd(),"gardenplots.html"),"utf8");
var core=html.match(/<script id="gpCore">([\s\S]*?)<\/script>/)[1];
new Function(core)();
var GP=globalThis.GP;
var days=+(process.argv[2]||365), start=new Date(); start.setHours(12,0,0,0);
function ymd(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
var by={}, fails=[], slow=0, slowKey="";
for(var k=0;k<days;k++){
  var d=new Date(start); d.setDate(d.getDate()+k); var key=ymd(d), wd=d.getDay(), spec=GP.WEEK[wd];
  var t=Date.now(), p=GP.forDay(key,wd), ms=Date.now()-t; if(ms>slow){ slow=ms; slowKey=key; }
  var all=GP.allSols(p.n,p.reg,3), g=GP.grade(p,spec.lvl);
  var bad=[];
  if(all.length!==1) bad.push(all.length+" answers");
  else if(all[0].join()!==p.sol.join()) bad.push("answer mismatch");
  if(!g.ok) bad.push("needs guessing");
  if(p.off||g.score<spec.score[0]||g.score>spec.score[1]) bad.push("score "+g.score+" outside "+spec.score.join("-"));
  if(bad.length) fails.push(key+" ("+spec.label+"): "+bad.join(", "));
  var b=by[wd]||(by[wd]={sc:[]}); b.sc.push(g.score);
}
[1,2,3,4,5,6,0].forEach(function(wd){ var b=by[wd]; if(!b) return; var s=b.sc.sort(function(a,c){ return a-c; }), spec=GP.WEEK[wd];
  console.log((spec.label+"    ").slice(0,10)+" "+spec.n+" x "+spec.n+"  score "+s[0]+"-"+s[s.length-1]+" (avg "+(s.reduce(function(a,c){ return a+c; },0)/s.length).toFixed(1)+")"); });
if(fails.length){ console.log("\nPROBLEMS ("+fails.length+"):\n"+fails.join("\n")); process.exitCode=1; }
else console.log("\nAll "+days+" days: one answer each, no guessing needed, every day in its score band. Slowest day: "+slow+" ms ("+slowKey+")");
