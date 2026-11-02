/* The Counting House: check the next 365 days (run from the site folder: node tools/countinghouse/check-year.js [days])
   Reads the core out of countinghouse.html, makes each day's order, and checks:
   - the order can be made exactly from the day's six weights (the clerk's full search), and isn't one of them;
   - it needs at least the day's fewest joins;
   - its score lands in the day's band.
   Prints each weekday's score range and the slowest day. */
var fs=require("fs"), path=require("path");
var html=fs.readFileSync(path.join(process.cwd(),"countinghouse.html"),"utf8");
var core=html.match(/<script id="chCore">([\s\S]*?)<\/script>/)[1];
new Function(core)();
var CH=globalThis.CH;
var days=+(process.argv[2]||365), start=new Date(); start.setHours(12,0,0,0);
function ymd(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
var by={}, fails=[], slow=0, slowKey="";
for(var k=0;k<days;k++){
  var d=new Date(start); d.setDate(d.getDate()+k); var key=ymd(d), wd=d.getDay(), spec=CH.WEEK[wd];
  var t=Date.now(), p=CH.forDay(key,wd), ms=Date.now()-t; if(ms>slow){ slow=ms; slowKey=key; }
  var I=CH.about(CH.table(p.nums),p.target), bad=[];
  if(!I) bad.push("can't be made");
  else { var sc=CH.score(I);
    if(p.nums.indexOf(p.target)>=0) bad.push("the order is one of the weights");
    if(I.o<spec.ops) bad.push("needs only "+I.o+" joins");
    if(p.off||sc<spec.score[0]||sc>spec.score[1]) bad.push("score "+sc+" outside "+spec.score.join("-")); }
  if(bad.length) fails.push(key+" ("+spec.label+"): "+bad.join(", "));
  var b=by[wd]||(by[wd]={sc:[],o:[]}); b.sc.push(p.score); b.o.push(p.ops);
}
[1,2,3,4,5,6,0].forEach(function(wd){ var b=by[wd]; if(!b) return; var s=b.sc.sort(function(a,c){ return a-c; }), spec=CH.WEEK[wd];
  console.log((spec.label+"    ").slice(0,10)+" orders "+spec.t.join("-")+"  score "+s[0]+"-"+s[s.length-1]+" (avg "+(s.reduce(function(a,c){ return a+c; },0)/s.length).toFixed(1)+")  joins "+Math.min.apply(0,b.o)+"-"+Math.max.apply(0,b.o)); });
if(fails.length){ console.log("\nPROBLEMS ("+fails.length+"):\n"+fails.join("\n")); process.exitCode=1; }
else console.log("\nAll "+days+" days: each order can be made exactly, needs the day's joins, and lands in its score band. Slowest day: "+slow+" ms ("+slowKey+")");
