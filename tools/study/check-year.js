/* The Locked Study: check a year of days (node tools/study/check-year.js [startYYYY-MM-DD] [days])
   Every lock must have exactly one answer, and every day's total grade should sit in its band. */
var fs=require("fs"), path=require("path");
var src=fs.existsSync(path.join(__dirname,"core.js"))?fs.readFileSync(path.join(__dirname,"core.js"),"utf8"):(function(){
  var h=fs.readFileSync(path.join(__dirname,"../../study.html"),"utf8"), a=h.indexOf('<script id="stCore">'), b=h.indexOf("</script>",a);
  return h.slice(a+'<script id="stCore">'.length,b); })();
var g={}; (new Function("globalThis","module",src))(g,undefined); var ST=g.ST;
var start=process.argv[2]?new Date(process.argv[2]+"T12:00:00"):new Date(2026,10,2,12), days=+(process.argv[3]||365);
function ymd(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
var bad=0, out=0, by={}, slow=0, t0=Date.now();
function sumUnique(L){
  var k=L.syms.length, n=0, vals=new Array(k).fill(1), MAX=20;
  function ev(e,m){ return e.op==="+"?e.t.reduce(function(s,x){ return s+m[x]; },0):e.op==="-"?m[e.t[0]]-m[e.t[1]]:m[e.t[0]]*m[e.t[1]]; }
  (function go(i,m){ if(n>1) return; if(i===k){ if(L.eqs.every(function(e){ return ev(e,m)===e.val; })){ n++; } return; }
    for(var v=1;v<=MAX;v++){ m[L.syms[i]]=v; go(i+1,m); } })(0,{});
  return n===1&&L.eqs.every(function(e){ return ev(e,L.v)===e.val; })&&L.q.reduce(function(s,x){ return s+L.v[x]; },0)===L.ans;
}
for(var d=0;d<days;d++){
  var dt=new Date(start); dt.setDate(start.getDate()+d); var key=ymd(dt), wd=dt.getDay(), a=Date.now();
  var p=ST.forDay(key,wd); var el=Date.now()-a; slow=Math.max(slow,el);
  var errs=[];
  if(!p){ console.log(key,"NO PUZZLE"); bad++; continue; }
  p.locks.forEach(function(L,i){
    if(L.kind==="seq"&&!(L.ans>0&&L.ans<10000&&L.terms.filter(function(x){ return x==null; }).length===1)) errs.push("seq");
    if(L.kind==="sum"&&!sumUnique(L)) errs.push("sum not unique");
    if(L.kind==="code"){ var f=ST.allCodes(L.n).filter(function(c){ return ST.fits(c,L.clues); }); if(f.length!==1||f[0].join("")!==L.ans) errs.push("code "+f.length); }
    if(L.kind==="light"){ var T=ST.lightTable(L.N); if(T.dist[L.start]!==L.min||L.min<1) errs.push("light"); }
    if(L.kind==="shelf"||(L.kind==="door"&&!L.shown)){ var P=ST.perms(L.n).filter(function(o){ return ST.okAll(o,L.clues); }); if(P.length!==1||P[0].join()!==L.order.join()) errs.push(L.kind+" "+P.length); }
    if(i<p.locks.length-1&&!(L.token>=1&&L.token<=9)) errs.push("token");
  });
  if(p.locks[p.locks.length-1].kind!=="door") errs.push("door last");
  var sp=ST.WEEK[wd].score; if(p.grade<sp[0]||p.grade>sp[1]){ out++; }
  (by[wd]=by[wd]||[]).push(p.grade);
  if(errs.length){ bad++; console.log(key,errs.join(", ")); }
}
[1,2,3,4,5,6,0].forEach(function(wd){ var a=by[wd]||[]; if(!a.length) return; a.sort(function(x,y){ return x-y; });
  console.log(ST.WEEK[wd].label.padEnd(10),"locks",ST.WEEK[wd].locks.length+1,"band",ST.WEEK[wd].score.join("-").padEnd(8),"avg",(a.reduce(function(s,x){ return s+x; },0)/a.length).toFixed(1).padStart(6),"min",a[0],"max",a[a.length-1]); });
console.log(days+" days: "+(bad?bad+" with problems":"all pass")+"; "+out+" outside their band (the closest was used); slowest day "+slow+" ms; total "+(Date.now()-t0)+" ms");
