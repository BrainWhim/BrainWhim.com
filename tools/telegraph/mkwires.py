import json, collections, random
from quotes import Q
FRAC={1:.40,2:.34,3:.28,4:.22,5:.16,6:.10,0:.05}
qs=sorted(Q,key=lambda q:(sum(c.isalpha() for c in q[0]),q[0]))
N=len(qs); days=[1,2,3,4,5,6,0]; bands={d:[] for d in days}
for i,q in enumerate(qs):
    d=days[min(6,i*7//N)]
    t=q[0].lower(); f=collections.Counter(c for c in t if c.isalpha())
    order=[c for c,_ in sorted(f.items(),key=lambda kv:(-kv[1],kv[0]))]
    k=max(1,round(FRAC[d]*len(order)))
    bands[d].append([q[0],q[1],q[2],''.join(sorted(order[:k]))])
rng=random.Random(1031)
for d in days: rng.shuffle(bands[d])
js="/* The Telegraph Office: the day's telegrams (Oct 31, 2026). By weekday (1 = Monday ... 0 = Sunday), shortest on Monday.\n   Each: [text, author, source, letters the operator has already written in]. Built by tg/mkwires.py from tg/quotes.py. */\nvar TG_WIRES="+json.dumps({str(d):bands[d] for d in days},ensure_ascii=False,separators=(',',':'))+";\n"
open('wires.js','w').write(js); print(len(js))
