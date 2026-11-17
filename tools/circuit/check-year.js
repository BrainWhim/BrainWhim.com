/* node tools/check-year.js [days]: grade a year of Circuit Builder days (3 boards each) */
var G=require("../../circuit-gen.js"), days=+process.argv[2]||364, t0=20000, S=[[],[],[],[],[],[],[]], gu=[0,0,0,0,0,0,0], bl=[[],[],[],[],[],[],[]];
for(var d=0;d<days;d++){ var n=t0+d, wd=new Date(n*864e5).getUTCDay(), lv=(wd+6)%7, bs=G.day(lv,n);
  var sum=0; bs.forEach(function(b){ sum+=b.grade.score; gu[lv]+=b.grade.guess; bl[lv].push(b.bulbs); }); S[lv].push(sum); }
var names=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], prev=0;
S.forEach(function(a,i){ var av=a.reduce(function(x,y){return x+y;},0)/a.length, mn=Math.min.apply(null,a), mx=Math.max.apply(null,a), b=bl[i].reduce(function(x,y){return x+y;},0)/bl[i].length;
  console.log(names[i],"day score",av.toFixed(1),"("+mn.toFixed(1)+"-"+mx.toFixed(1)+")","step",prev?(av/prev).toFixed(2):"-","guesses/day",(gu[i]/a.length).toFixed(2),"bulbs/board",b.toFixed(1)); prev=av; });
