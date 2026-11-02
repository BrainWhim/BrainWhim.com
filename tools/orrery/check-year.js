/* The Orrery: check the next 365 days (run from the site folder: node tools/orrery/check-year.js [days])
   Reads the core out of orrery.html, makes each day's orrery, and prints for each weekday:
   par (fewest turns), uphill turns (best-route turns that don't bring the planets closer), and how often
   "following your nose" (always the turn that brings them closest) gets there within par + 3.
   Checks every day makes a puzzle, its par is in band, and (from Tuesday) it has enough uphill turns. */
var fs=require("fs"), path=require("path");
var html=fs.readFileSync(path.join(process.cwd(),"orrery.html"),"utf8");
new Function(html.match(/var OR = \(function \(\) \{[\s\S]*?\n\}\)\(\);/)[0]+";globalThis.OR=OR;")();
function ymd(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
var days=+(process.argv[2]||365), start=new Date(); start.setHours(12,0,0,0);
var by={}, fails=[], slow=0, slowKey="";
for(var k=0;k<days;k++){
  var d=new Date(start); d.setDate(d.getDate()+k); var key=ymd(d), wd=d.getDay(), D=OR.DAYS[wd];
  var t=Date.now(), P=OR.make(key,wd), ms=Date.now()-t; if(ms>slow){ slow=ms; slowKey=key; }
  if(!P){ fails.push(key+" ("+D.name+"): no puzzle"); continue; }
  var U=OR.uphill(P,P._dist), s0=OR.enc(P,P.start), up=U[s0], nz=OR.nose(P,P.start,P.par,OR.rng(k+1),40);
  if(P.par<D.band[0]||P.par>D.band[1]) fails.push(key+" ("+D.name+"): par "+P.par);
  if(D.up&&up<D.up) fails.push(key+" ("+D.name+"): only "+up+" uphill turns");
  var b=by[wd]||(by[wd]={par:[],up:[],nz:[]}); b.par.push(P.par); b.up.push(up); b.nz.push(nz);
}
function rg(a){ a=a.slice().sort(function(x,y){ return x-y; }); return a[0]+"-"+a[a.length-1]; }
function av(a,f){ return (a.reduce(function(x,y){ return x+y; },0)/a.length).toFixed(f==null?1:f); }
[1,2,3,4,5,6,0].forEach(function(wd){ var b=by[wd]; if(!b) return;
  console.log((OR.DAYS[wd].name+"    ").slice(0,10)+" par "+rg(b.par)+" (avg "+av(b.par)+")  uphill "+rg(b.up)+" (avg "+av(b.up)+")  nose finds it "+Math.round(av(b.nz,3)*100)+"% of the time"); });
if(fails.length){ console.log("\nPROBLEMS ("+fails.length+"):\n"+fails.join("\n")); process.exitCode=1; }
else console.log("\nAll "+days+" days pass. Slowest day: "+slow+" ms ("+slowKey+")");
