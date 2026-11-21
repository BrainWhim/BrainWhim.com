/* BrainWhim QR codes (Nov 20). Made in the page, no outside service (CrossPromotion note: "Open it on my child's device").
   BWQR.svg(text, {px:size, dark:"#0b1324", light:"#fff"}) returns an <svg> string. Byte mode, error level M, versions 1-10
   (up to ~210 characters, plenty for a page address). Follows the QR standard (ISO 18004); the method follows Nayuki's
   reference encoder. Checked by decoding with OpenCV. */
(function(){
  "use strict";
  var ECC=[-1,10,16,26,18,24,16,18,22,22,26], BLK=[-1,1,1,1,2,2,4,4,4,5,5];
  function rawModules(v){ var r=(16*v+128)*v+64; if(v>=2){ var n=Math.floor(v/7)+2; r-=(25*n-10)*n-55; if(v>=7) r-=36; } return r; }
  function dataCw(v){ return Math.floor(rawModules(v)/8)-ECC[v]*BLK[v]; }
  function mul(x,y){ var z=0; for(var i=7;i>=0;i--){ z=(z<<1)^((z>>>7)*0x11D); z^=((y>>>i)&1)*x; } return z&255; }
  function rsDiv(d){ var r=[],i,j,root=1; for(i=0;i<d;i++) r.push(0); r[d-1]=1;
    for(i=0;i<d;i++){ for(j=0;j<d;j++){ r[j]=mul(r[j],root); if(j+1<d) r[j]^=r[j+1]; } root=mul(root,2); } return r; }
  function rsRem(data,div){ var r=div.map(function(){ return 0; });
    data.forEach(function(b){ var f=b^r.shift(); r.push(0); div.forEach(function(c,i){ r[i]^=mul(c,f); }); }); return r; }
  function utf8(s){ var out=[]; s=unescape(encodeURIComponent(s)); for(var i=0;i<s.length;i++) out.push(s.charCodeAt(i)); return out; }
  function alignPos(v,size){ if(v===1) return []; var n=Math.floor(v/7)+2, step=Math.ceil((v*4+4)/(n*2-2))*2, r=[6];
    for(var p=size-7;r.length<n;p-=step) r.splice(1,0,p); return r; }

  function make(text){
    var bytes=utf8(text), v, bits=[];
    for(v=1;v<=10;v++){ var cc=v<10?8:16; if(4+cc+bytes.length*8<=dataCw(v)*8) break; }
    if(v>10) throw new Error("BWQR: text too long");
    function put(val,n){ for(var i=n-1;i>=0;i--) bits.push((val>>>i)&1); }
    put(4,4); put(bytes.length,v<10?8:16); bytes.forEach(function(b){ put(b,8); });
    var cap=dataCw(v)*8; put(0,Math.min(4,cap-bits.length)); put(0,(8-bits.length%8)%8);
    for(var pad=0xEC;bits.length<cap;pad^=0xEC^0x11) put(pad,8);
    var data=[]; for(var i=0;i<bits.length;i+=8){ var b=0; for(var k=0;k<8;k++) b=(b<<1)|bits[i+k]; data.push(b); }
    /* error correction, split into blocks and interleaved */
    var nb=BLK[v], el=ECC[v], raw=Math.floor(rawModules(v)/8), nShort=nb-raw%nb, shortLen=Math.floor(raw/nb), div=rsDiv(el), blocks=[], at=0;
    for(i=0;i<nb;i++){ var dat=data.slice(at,at+shortLen-el+(i<nShort?0:1)); at+=dat.length; var ec=rsRem(dat,div); if(i<nShort) dat.push(0); blocks.push(dat.concat(ec)); }
    var cw=[]; for(i=0;i<blocks[0].length;i++) for(var j=0;j<nb;j++) if(i!==shortLen-el||j>=nShort) cw.push(blocks[j][i]);
    /* the grid */
    var size=v*4+17, M=[], F=[], x, y;
    for(y=0;y<size;y++){ M.push([]); F.push([]); for(x=0;x<size;x++){ M[y].push(false); F[y].push(false); } }
    function fn(x,y,d){ M[y][x]=!!d; F[y][x]=true; }
    for(i=0;i<size;i++){ fn(6,i,i%2===0); fn(i,6,i%2===0); }
    [[3,3],[size-4,3],[3,size-4]].forEach(function(c){ for(var dy=-4;dy<=4;dy++) for(var dx=-4;dx<=4;dx++){ var d=Math.max(Math.abs(dx),Math.abs(dy)), xx=c[0]+dx, yy=c[1]+dy;
      if(xx>=0&&xx<size&&yy>=0&&yy<size) fn(xx,yy,d!==2&&d!==4); } });
    var ap=alignPos(v,size), na=ap.length;
    for(i=0;i<na;i++) for(j=0;j<na;j++){ if((i===0&&j===0)||(i===0&&j===na-1)||(i===na-1&&j===0)) continue;
      for(var ay=-2;ay<=2;ay++) for(var ax=-2;ax<=2;ax++) fn(ap[i]+ax,ap[j]+ay,Math.max(Math.abs(ax),Math.abs(ay))!==1); }
    function format(mask){ var d=(0<<3)|mask, r=d; for(var t=0;t<10;t++) r=(r<<1)^((r>>>9)*0x537); var b=((d<<10)|r)^0x5412;
      function g(n){ return (b>>>n)&1; }
      for(var t2=0;t2<=5;t2++) fn(8,t2,g(t2)); fn(8,7,g(6)); fn(8,8,g(7)); fn(7,8,g(8)); for(t2=9;t2<15;t2++) fn(14-t2,8,g(t2));
      for(t2=0;t2<8;t2++) fn(size-1-t2,8,g(t2)); for(t2=8;t2<15;t2++) fn(8,size-15+t2,g(t2)); fn(8,size-8,1); }
    format(0);
    if(v>=7){ var r=v; for(i=0;i<12;i++) r=(r<<1)^((r>>>11)*0x1F25); var vb=(v<<12)|r;
      for(i=0;i<18;i++){ var bt=(vb>>>i)&1, a=size-11+i%3, bb=Math.floor(i/3); fn(a,bb,bt); fn(bb,a,bt); } }
    /* the data, in the zigzag */
    var n=0;
    for(var right=size-1;right>=1;right-=2){ if(right===6) right=5;
      for(var vert=0;vert<size;vert++) for(j=0;j<2;j++){ x=right-j; var up=((right+1)&2)===0; y=up?size-1-vert:vert;
        if(!F[y][x]&&n<cw.length*8){ M[y][x]=((cw[n>>>3]>>>(7-(n&7)))&1)===1; n++; } } }
    /* try all eight masks, keep the easiest to scan */
    function maskAt(m,x,y){ switch(m){ case 0:return (x+y)%2===0; case 1:return y%2===0; case 2:return x%3===0; case 3:return (x+y)%3===0;
      case 4:return (Math.floor(x/3)+Math.floor(y/2))%2===0; case 5:return x*y%2+x*y%3===0; case 6:return (x*y%2+x*y%3)%2===0; default:return ((x+y)%2+x*y%3)%2===0; } }
    function apply(m){ for(var yy=0;yy<size;yy++) for(var xx=0;xx<size;xx++) if(!F[yy][xx]&&maskAt(m,xx,yy)) M[yy][xx]=!M[yy][xx]; }
    function penalty(){ var p=0,xx,yy,run,dark=0;
      for(yy=0;yy<size;yy++){ run=1; for(xx=1;xx<=size;xx++){ if(xx<size&&M[yy][xx]===M[yy][xx-1]) run++; else { if(run>=5) p+=run-2; run=1; } } }
      for(xx=0;xx<size;xx++){ run=1; for(yy=1;yy<=size;yy++){ if(yy<size&&M[yy][xx]===M[yy-1][xx]) run++; else { if(run>=5) p+=run-2; run=1; } } }
      for(yy=0;yy<size-1;yy++) for(xx=0;xx<size-1;xx++){ var c=M[yy][xx]; if(c===M[yy][xx+1]&&c===M[yy+1][xx]&&c===M[yy+1][xx+1]) p+=3; }
      var pat=[1,0,1,1,1,0,1,0,0,0,0], pat2=[0,0,0,0,1,0,1,1,1,0,1];
      function hit(get){ for(var a=0;a+11<=size;a++){ var ok1=true,ok2=true; for(var q=0;q<11;q++){ var cv=get(a+q)?1:0; if(cv!==pat[q]) ok1=false; if(cv!==pat2[q]) ok2=false; } if(ok1) p+=40; if(ok2) p+=40; } }
      for(yy=0;yy<size;yy++) hit(function(q){ return M[yy][q]; });
      for(xx=0;xx<size;xx++) hit(function(q){ return M[q][xx]; });
      for(yy=0;yy<size;yy++) for(xx=0;xx<size;xx++) if(M[yy][xx]) dark++;
      p+=Math.floor(Math.abs(dark*20-size*size*10)/(size*size))*10; return p; }
    var best=-1, bestP=1e9;
    for(var m=0;m<8;m++){ apply(m); format(m); var pp=penalty(); if(pp<bestP){ bestP=pp; best=m; } apply(m); }
    apply(best); format(best);
    return M;
  }
  function svg(text,o){
    o=o||{}; var M=make(text), n=M.length, q=4, w=n+q*2, d="";
    for(var y=0;y<n;y++) for(var x=0;x<n;x++) if(M[y][x]) d+="M"+(x+q)+" "+(y+q)+"h1v1h-1z";
    var px=o.px||160;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+w+' '+w+'" width="'+px+'" height="'+px+'" shape-rendering="crispEdges" role="img" aria-label="QR code">'+
      '<rect width="'+w+'" height="'+w+'" fill="'+(o.light||"#fff")+'"/><path d="'+d+'" fill="'+(o.dark||"#0b1324")+'"/></svg>';
  }
  window.BWQR={svg:svg, matrix:make};
})();
