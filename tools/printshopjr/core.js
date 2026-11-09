/* ===== Print Shop Jr. core (The Outpost · The Lab; forked from the Print Shop core, Nov 9) (the jobs, the type-case maker, the grader, the day's pick): shared by the page and the tests =====
   A type case holds one wooden letter block in every compartment. Every block belongs to exactly one of the day's words,
   spelled along a path of touching blocks (side to side or corner to corner, no block used twice, no two paths crossing).
   One word, the HEADLINE, names the day's theme and runs from the case's left side to its right side.
   The grader scores how much searching a tray takes (see grade), and the maker tries layouts until the day's score lands in its band. */
(function(root){
"use strict";
function rng(seed){ var h=1779033703^seed.length; for(var i=0;i<seed.length;i++){ h=Math.imul(h^seed.charCodeAt(i),3432918353); h=h<<13|h>>>19; }
  return function(){ h=Math.imul(h^h>>>16,2246822507); h=Math.imul(h^h>>>13,3266489909); h^=h>>>16; return (h>>>0)/4294967296; }; }
function shuffle(a,r){ for(var i=a.length-1;i>0;i--){ var j=Math.floor(r()*(i+1)), t=a[i]; a[i]=a[j]; a[j]=t; } return a; }

/* ---------- the jobs (themes) ---------- */
var JOBS_TXT=root.PSJ_JOBS||/*JOBS*/"";
function parseJobs(txt){
  var out=[];
  txt.split("\n").forEach(function(line){ line=line.trim(); if(!line||line.charAt(0)==="#") return;
    var p=line.split("|"); if(p.length<4) return;
    var words=p[3].trim().split(/\s+/).map(function(w){ return w.toUpperCase(); }).filter(function(w){ return /^[A-Z]{3,8}$/.test(w); });
    out.push({id:out.length,tier:+p[0],title:p[1].trim(),head:p[2].trim().toUpperCase(),words:words}); });
  return out;
}
var JOBS=parseJobs(JOBS_TXT);

/* ---------- the week ----------
   R x C: the case (rows x columns) · tier: which jobs it draws from · nw: how many words, counting the headline ·
   twist: how readily a word turns a corner (0 = runs straight, 1 = winds) · diag: how readily it steps corner to corner ·
   vert: how often a long headline runs top to bottom instead · rev: how often it starts at the far side (right or bottom) ·
   many: prefer more, shorter words · slots: the job ticket shows each word's length ·
   score: the band the day's grade must land in (Jr. bands set Nov 9 from a year of days, tools/printshopjr/check-year.js). */
var WEEK={
  1:{R:5,C:5,tier:1,nw:[4,6],twist:.15,diag:.3,vert:0,slots:true,score:[19,25],label:"Monday"},
  2:{R:6,C:5,tier:1,nw:[5,7],twist:.3,diag:.5,vert:0,slots:true,score:[25,32],label:"Tuesday"},
  3:{R:6,C:6,tier:2,nw:[6,8],twist:.4,diag:.6,vert:0,slots:true,score:[32,41],label:"Wednesday"},
  4:{R:6,C:6,tier:2,nw:[6,9],twist:.6,diag:.8,vert:0,slots:true,score:[41,52],label:"Thursday"},
  5:{R:7,C:6,tier:3,nw:[7,9],twist:.5,diag:.7,vert:0,slots:true,score:[52,64],label:"Friday"},
  6:{R:7,C:6,tier:3,nw:[7,10],many:true,twist:.75,diag:.9,vert:.2,rev:.2,slots:true,score:[65,80],label:"Saturday"},
  0:{R:7,C:6,tier:3,nw:[7,10],many:true,twist:.9,diag:1,vert:.3,rev:.4,slots:true,score:[80,98],label:"Sunday"}
};

/* ---------- the dictionary (for extra words and the grader's look-alikes) ---------- */
var TRIE=null, DICT=null;
function dict(){
  if(DICT) return DICT;
  var src=root.PSWORDS||""; DICT=new Set(); TRIE={};
  src.split(" ").forEach(function(w){ if(!w) return; w=w.toUpperCase(); DICT.add(w); var n=TRIE; for(var i=0;i<w.length;i++){ var c=w.charAt(i); n=n[c]||(n[c]={}); } n.$=1; });
  return DICT;
}

/* ---------- the case's geometry ---------- */
function nbrs(R,C){ var N=[]; for(var i=0;i<R*C;i++){ var r=(i/C)|0, c=i%C, o=[];
    for(var dr=-1;dr<=1;dr++) for(var dc=-1;dc<=1;dc++){ if(!dr&&!dc) continue; var y=r+dr, x=c+dc; if(y>=0&&x>=0&&y<R&&x<C) o.push(y*C+x); } N.push(o); }
  return N; }
function adj(a,b,C){ var ra=(a/C)|0, rb=(b/C)|0; return a!==b&&Math.abs(ra-rb)<=1&&Math.abs(a%C-b%C)<=1; }

/* ---------- laying out a tray ----------
   own[i]: which word owns block i (-1 empty) · link: "a,b" for every step taken, so corner steps never cross another step */
function Layout(R,C){ this.R=R; this.C=C; this.N=nbrs(R,C); this.own=new Array(R*C).fill(-1); this.link={}; this.budget=0; }
Layout.prototype.crosses=function(a,b){
  var C=this.C, ra=(a/C)|0, ca=a%C, rb=(b/C)|0, cb=b%C; if(ra===rb||ca===cb) return false;
  var x=ra*C+cb, y=rb*C+ca; return !!this.link[x+","+y];
};
Layout.prototype.mark=function(path,on){ for(var k=0;k+1<path.length;k++){ var a=path[k], b=path[k+1];
  if(on){ this.link[a+","+b]=1; this.link[b+","+a]=1; } else { delete this.link[a+","+b]; delete this.link[b+","+a]; } } };
/* a random path of L empty blocks from `start`; `goal(i,k,L)` (optional) says whether block i may be the k-th; returns up to `want` paths */
Layout.prototype.paths=function(start,L,spec,r,want,goal){
  var me=this, out=[], path=[start], used={}; used[start]=1;
  function dirOf(a,b){ var C=me.C; return (((b/C)|0)-((a/C)|0))+","+((b%C)-(a%C)); }
  (function go(){
    if(out.length>=want||me.budget<=0) return;
    me.budget--;
    if(path.length===L){ out.push(path.slice()); return; }
    var a=path[path.length-1], prev=path.length>1?dirOf(path[path.length-2],a):null, cand=[];
    me.N[a].forEach(function(b){ if(me.own[b]>=0||used[b]) return; if(goal&&!goal(b,path.length,L)) return; if(me.crosses(a,b)) return;
      /* no crossing its own earlier steps either */
      var C=me.C, ra=(a/C)|0, ca=a%C, rb=(b/C)|0, cb=b%C;
      if(ra!==rb&&ca!==cb){ var x=ra*C+cb, y=rb*C+ca, ix=path.indexOf(x), iy=path.indexOf(y); if(ix>=0&&iy>=0&&Math.abs(ix-iy)===1) return; }
      var d=dirOf(a,b), diagStep=ra!==rb&&ca!==cb, w=(diagStep?spec.diag:1);
      w*=prev===null?1:(d===prev?1+(1-spec.twist)*5:1+spec.twist*2.2);
      cand.push([b,w*(.35+r())]); });
    cand.sort(function(x,y){ return y[1]-x[1]; });
    for(var q=0;q<cand.length;q++){ var b=cand[q][0]; path.push(b); used[b]=1; go(); path.pop(); delete used[b]; if(out.length>=want||me.budget<=0) return; }
  })();
  return out;
};
/* can the empty blocks still be shared out among the words left? (each patch of touching empty blocks must take whole words) */
Layout.prototype.feasible=function(lens){
  var R=this.R, C=this.C, seen={}, comps=[], i;
  for(i=0;i<R*C;i++) if(this.own[i]<0&&!seen[i]){ var st=[i], n=0; seen[i]=1;
    while(st.length){ var x=st.pop(); n++; this.N[x].forEach(function(y){ if(this.own[y]<0&&!seen[y]){ seen[y]=1; st.push(y); } },this); }
    comps.push(n); }
  if(!comps.length) return !lens.length;
  var tot=lens.reduce(function(a,b){ return a+b; },0), sum=comps.reduce(function(a,b){ return a+b; },0); if(tot!==sum) return false;
  if(comps.some(function(c){ return c<3; })) return false;
  if(comps.length===1) return true;
  var L=lens.slice().sort(function(a,b){ return b-a; }), cap=comps.slice();
  return (function go(k){ if(k===L.length) return cap.every(function(c){ return c===0; });
    var tried={}; for(var j=0;j<cap.length;j++){ if(cap[j]<L[k]||tried[cap[j]]) continue; tried[cap[j]]=1; cap[j]-=L[k]; if(go(k+1)) return true; cap[j]+=L[k]; } return false; })(0);
};
function layoutTray(spec,words,head,r,opt){
  var R=spec.R, C=spec.C, T=new Layout(R,C), paths=[], i;
  T.budget=opt&&opt.budget||6000;
  /* the headline: left side to right side (or, now and then for a long one, top to bottom) */
  var vert=head.length>=R&&r()<spec.vert, L=head.length;
  var starts=[]; for(i=0;i<(vert?C:R);i++) starts.push(vert?i:i*C); shuffle(starts,r);
  var hp=null;
  for(var s=0;s<starts.length&&!hp;s++){
    var goal=vert?function(b,k,L){ var row=(b/C)|0; return (R-1-row)<=L-1-k&&(k<L-1||row===R-1); }
                 :function(b,k,L){ var col=b%C; return (C-1-col)<=L-1-k&&(k<L-1||col===C-1); };
    var got=T.paths(starts[s],L,spec,r,4,goal);
    for(var g=0;g<got.length&&!hp;g++){ var p=got[g]; p.forEach(function(x){ T.own[x]=0; }); T.mark(p,true);
      if(T.feasible(words.map(function(w){ return w.length; }))) hp=p; else { p.forEach(function(x){ T.own[x]=-1; }); T.mark(p,false); } }
  }
  if(!hp) return null;
  var rev=r()<(spec.rev||0); if(rev) hp=hp.slice().reverse();
  paths[0]=hp;
  /* the rest: always fill the tightest corner first (the empty block with the fewest empty neighbors) */
  var left=words.map(function(w,k){ return k; });
  var ok=(function place(){
    if(!left.length) return true;
    if(T.budget<=0) return false;
    var best=-1, bn=99, ties=[];
    for(var i=0;i<R*C;i++) if(T.own[i]<0){ var n=0; T.N[i].forEach(function(y){ if(T.own[y]<0) n++; }); if(n<bn){ bn=n; ties=[i]; } else if(n===bn) ties.push(i); }
    if(best<0) best=ties[Math.floor(r()*ties.length)];
    if(bn===0) return false;
    var order=shuffle(left.slice(),r);
    for(var q=0;q<order.length;q++){ var k=order[q], w=words[k];
      var got=T.paths(best,w.length,spec,r,3);
      for(var g=0;g<got.length;g++){ var p=got[g]; if(r()<.5) p=p.slice().reverse();   /* the word may start or end in the corner */
        p.forEach(function(x){ T.own[x]=k+1; }); T.mark(p,true); left.splice(left.indexOf(k),1);
        if(T.feasible(left.map(function(j){ return words[j].length; }))&&place()){ paths[k+1]=p; return true; }
        left.push(k); p.forEach(function(x){ T.own[x]=-1; }); T.mark(p,false); }
    }
    return false;
  })();
  if(!ok) return null;
  var all=[head].concat(words), letters=new Array(R*C).fill("");
  paths.forEach(function(p,k){ p.forEach(function(x,j){ letters[x]=all[k].charAt(j); }); });
  return {R:R,C:C,words:all,paths:paths,letters:letters,vert:vert,rev:rev};
}

/* ---------- the grader ----------
   An estimate of the searching a tray takes, word by word:
   each word costs 1, plus .3 a letter; each turn in its path 1.1; each corner-to-corner step .35;
   each false start (another touching pair of blocks with its first two letters) .3.
   The headline counts 1.3 times (it's long and has to be seen whole), plus 3 when it starts at the right side (or the bottom). Then the job's tier (how sideways the theme is):
   tier 2 adds .8 a word, tier 3 adds 2 a word. And look-alikes: each real word of 6+ letters that can be traced in the
   tray but isn't one of the day's adds .04 (counted up to 400), since each one is a trail that leads nowhere. */
function walk(P,k){ var p=P.paths[k], C=P.C, turns=0, diag=0, prev=null;
  for(var j=0;j+1<p.length;j++){ var a=p[j], b=p[j+1], d=(((b/C)|0)-((a/C)|0))+","+((b%C)-(a%C)); if(((b/C)|0)!==((a/C)|0)&&b%C!==a%C) diag++; if(prev&&d!==prev) turns++; prev=d; }
  return {turns:turns,diag:diag}; }
function lookalikes(P,cap){
  dict(); if(!TRIE) return 0;
  var R=P.R, C=P.C, N=nbrs(R,C), L=P.letters, found={}, theme={}, n=0; P.words.forEach(function(w){ theme[w]=1; });
  var used=new Uint8Array(R*C);
  function go(i,node,s){ if(n>=cap) return; var ch=L[i], nx=node[ch]; if(!nx) return; s+=ch; if(nx.$&&s.length>=6&&!theme[s]&&!found[s]){ found[s]=1; n++; }
    if(s.length>=8) return; used[i]=1; for(var q=0;q<N[i].length;q++){ var j=N[i][q]; if(!used[j]) go(j,nx,s); } used[i]=0; }
  for(var i=0;i<R*C;i++) go(i,TRIE,"");
  return n;
}
function grade(P,tier){
  var C=P.C, N=nbrs(P.R,C), score=0, parts=[];
  for(var k=0;k<P.words.length;k++){ var w=P.words[k], m=walk(P,k), fs=0, a=w.charAt(0), b=w.charAt(1);
    for(var i=0;i<P.letters.length;i++) if(P.letters[i]===a) N[i].forEach(function(j){ if(P.letters[j]===b&&!(P.paths[k][0]===i&&P.paths[k][1]===j)) fs++; });
    var s=1+.3*w.length+1.1*m.turns+.35*m.diag+.3*fs; if(k===0) s=s*1.3+(P.rev?3:0);
    score+=s; parts.push({w:w,turns:m.turns,diag:m.diag,fs:fs,s:+s.toFixed(2)}); }
  var tw=tier===3?2:tier===2?.8:0; score+=tw*P.words.length;
  var la=lookalikes(P,400); score+=.04*la;
  return {score:+score.toFixed(2),parts:parts,look:la};
}

/* ---------- choosing the words ---------- */
function pickWords(job,spec,r){
  var target=spec.R*spec.C-job.head.length, pool=shuffle(job.words.filter(function(w){ return w!==job.head&&job.head.indexOf(w)<0; }),r), out=null;
  var lo=spec.nw[0]-1, hi=spec.nw[1]-1;
  var found=[], want=spec.many?40:1;
  (function go(i,sum,pick){ if(found.length>=want) return; if(sum===target&&pick.length>=lo&&pick.length<=hi){ found.push(pick.slice()); return; }
    if(sum>=target||pick.length>=hi||i>=pool.length) return;
    pick.push(pool[i]); go(i+1,sum+pool[i].length,pick); pick.pop(); go(i+1,sum,pick); })(0,0,[]);
  if(!found.length) return null;
  found.sort(function(a,b){ return b.length-a.length; });
  return found[0];
}
/* a tray for a job and a week-day spec: tries layouts until the grade lands in the day's band (keeps the nearest otherwise) */
function make(seed,job,spec,opt){
  opt=opt||{}; var r=rng(seed), best=null, tries=opt.tries||(spec.score&&spec.score[0]>=90?90:60);
  for(var t=0;t<tries;t++){
    var words=pickWords(job,spec,r); if(!words) return null;
    words.sort(function(a,b){ return b.length-a.length; });
    var P=null; for(var a=0;a<6&&!P;a++) P=layoutTray(spec,words,job.head,r);
    if(!P) continue;
    var g=grade(P,job.tier); P.score=g.score; P.look=g.look; P.job=job.id; P.title=job.title; P.tier=job.tier; P.tries=t+1;
    if(!spec.score||g.score>=spec.score[0]&&g.score<=spec.score[1]) return P;
    var d=g.score<spec.score[0]?spec.score[0]-g.score:g.score-spec.score[1];
    if(!best||d<best.d){ P.d=d; best=P; }
  }
  if(best) best.off=true;
  return best;
}

/* ---------- the day's job ----------
   Monday and Tuesday share the tier-1 jobs, Wednesday and Thursday the tier-2, Friday to Sunday the tier-3.
   Each tier's jobs are dealt in a fixed shuffled order, a week at a time, so a job comes back only after the whole tier. */
function daysFrom(key){ var p=key.split("-").map(Number); return Math.round((Date.UTC(p[0],p[1]-1,p[2])-Date.UTC(2026,9,5))/864e5); }   /* Oct 5, 2026 was a Monday */
var ORDER={};
function order(t){ if(ORDER[t]) return ORDER[t]; return ORDER[t]=shuffle(JOBS.filter(function(j){ return j.tier===t; }),rng("psj:order:"+t)); }
function jobFor(key,wd){
  var d=daysFrom(key), week=Math.floor(d/7), spec=WEEK[wd], list=order(spec.tier);
  var slot=spec.tier===1?week*2+(wd===1?0:1):spec.tier===2?week*2+(wd===3?0:1):week*3+(wd===5?0:wd===6?1:2);
  return list[((slot%list.length)+list.length)%list.length];
}
function forDay(key,wd){ var job=jobFor(key,wd), P=make("psj:"+key,job,WEEK[wd]); if(P) P.key=key; return P; }

function dictHas(w){ return dict().has(w); }
root.PSJ={rng:rng,shuffle:shuffle,JOBS:JOBS,WEEK:WEEK,dict:dict,dictHas:dictHas,nbrs:nbrs,adj:adj,layoutTray:layoutTray,grade:grade,lookalikes:lookalikes,pickWords:pickWords,make:make,jobFor:jobFor,forDay:forDay,daysFrom:daysFrom};
})(typeof window!=="undefined"?window:globalThis);
