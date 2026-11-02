/* The Observatory: check the next 365 days (run from the site folder: node tools/observatory/check-year.js [days])
   Reads the core out of observatory.html (and the sky from observatory-sky.js), makes each day's chart, and checks:
   exactly one answer (the real figure); the graded solver finishes it with no guessing; its score lands in the day's band.
   Prints each weekday's star counts, sight lines and score range, and the slowest day. */
var fs=require("fs"), path=require("path");
var html=fs.readFileSync(path.join(process.cwd(),"observatory.html"),"utf8");
var core=html.match(/var OB = \(function \(\) \{[\s\S]*?\n\}\)\(\);/)[0];
new Function(fs.readFileSync(path.join(process.cwd(),"observatory-sky.js"),"utf8")+";"+core+";globalThis.OB=OB;globalThis.OB_SKY=OB_SKY;")();
var EPOCH=new Date(2026,9,1);
function dayNo(d){ return Math.round((new Date(d.getFullYear(),d.getMonth(),d.getDate())-EPOCH)/864e5)+1; }
function ymd(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
var days=+(process.argv[2]||365), start=new Date(); start.setHours(12,0,0,0);
var by={}, fails=[], off=[], slow=0, slowKey="";
for(var k=0;k<days;k++){
  var d=new Date(start); d.setDate(d.getDate()+k); var key=ymd(d), wd=d.getDay(), D=OB.DAYS[wd];
  var t=Date.now(), C=OB.pick(OB_SKY,wd,dayNo(d)), P=OB.make(key,wd,C), ms=Date.now()-t; if(ms>slow){ slow=ms; slowKey=key; }
  var g=OB.grade(P), bad=[];
  if(OB.countSol(P,OB.blank(P),2)!==1) bad.push("not one answer");
  if(!g.ok) bad.push("needs guessing");
  if(!OB.logic(P,D.level).ok) bad.push("above the day's level");
  if(bad.length) fails.push(key+" ("+D.name+", "+C.id+"): "+bad.join(", "));
  if(P.off) off.push(key+" "+D.name+" "+C.id+" score "+g.score);
  var b=by[wd]||(by[wd]={sc:[],ln:[],st:[]}); b.sc.push(g.score); b.ln.push(P.cand.length); b.st.push(C.n.length);
}
function rg(a){ a=a.slice().sort(function(x,y){ return x-y; }); return a[0]+"-"+a[a.length-1]; }
function av(a){ return (a.reduce(function(x,y){ return x+y; },0)/a.length).toFixed(1); }
[1,2,3,4,5,6,0].forEach(function(wd){ var b=by[wd]; if(!b) return; var D=OB.DAYS[wd];
  console.log((D.name+"    ").slice(0,10)+" stars "+rg(b.st)+"  sight lines "+rg(b.ln)+"  score "+rg(b.sc)+" (avg "+av(b.sc)+", band "+D.score.join("-")+")"); });
if(off.length) console.log("\n"+off.length+" days just outside their band (the closest chart is used; the constellation is too small or too tight for more decoys):\n  "+off.slice(0,12).join("\n  ")+(off.length>12?"\n  ...":""));
if(fails.length){ console.log("\nPROBLEMS ("+fails.length+"):\n"+fails.join("\n")); process.exitCode=1; }
else console.log("\nAll "+days+" days: one answer each, no guessing needed. Slowest day: "+slow+" ms ("+slowKey+")");
