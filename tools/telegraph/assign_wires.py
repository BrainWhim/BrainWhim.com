"""The Telegraph Office: place the graded telegrams on weekdays (Nov 2, 2026). Run after grade_wires.py:
python3 assign_wires.py  -> writes wires.js. Each weekday has a score band (BANDS), a fewest-unknown-letters rule (MINU) and
a preferred length (LEN, weighted lightly). An optimal assignment puts every telegram on one day with the number of given
letters that lands its score nearest the middle of that day's band."""
import json,statistics,numpy as np
from scipy.optimize import linear_sum_assignment
import os,random,sys
HERE=os.path.dirname(os.path.abspath(__file__))
q=json.load(open(os.path.join(HERE,'tgall.json')))
# the reasoning score plus the work of writing the letters in: 0.25 for each letter on the tape still to be written
for x in q:
  t=[c for c in x['w'][0].upper() if c.isalpha()]
  x['sc']={k:round(v+0.25*sum(1 for c in t if c not in x['o'][:int(k)].upper()),2) for k,v in x['sc'].items()}
BANDS={1:(18,32),2:(31,41),3:(40,51),4:(50,62),5:(61,74),6:(73,88),0:(87,140)}
CAP={1:40,2:52,3:64}   # longest telegram (letters) on easy days
MING={1:.2}   # at least this share of the different letters given on easy days
MINU={1:6,2:7,3:9,4:10,5:11,6:12,0:13}
LEN={1:20,2:26,3:32,4:38,5:44,6:50,0:58}
W=5.0;days=[1,2,3,4,5,6,0];N=len(q);SIZE={1:52,2:48,3:40,4:36,5:34,6:32,0:32}   # how many telegrams each weekday walks through (easy days hold more)
per={d:round(SIZE[d]*N/274) for d in days}; per[1]+=N-sum(per.values())
slots=[d for d in days for _ in range(per[d])]
def best(i,d):
  lo,hi=BANDS[d];mid=(lo+hi)/2;sc={int(k):v for k,v in q[i]['sc'].items() if q[i]['D']-int(k)>=MINU[d]} or {1:q[i]['sc']['1']}
  # prefer in band, closest to mid
  k=min(sc,key=lambda k:(0 if lo<=sc[k]<=hi else 1, abs(sc[k]-mid)))
  v=sc[k];pen=0 if lo<=v<=hi else 50+abs(v-mid)
  return k,v,pen+abs(v-mid)/(hi-lo)*2
C=np.zeros((N,len(slots)));K={}
for i in range(N):
  for d in days:
    k,v,c=best(i,d);K[(i,d)]=(k,v)
    c+=abs(q[i]['L']-LEN[d])/W
    if k/q[i]['D']<MING.get(d,0): c+=100
    for j,s in enumerate(slots):
      if s==d: C[i,j]=c
r,c=linear_sum_assignment(C)
out={d:[] for d in days}
for i,j in zip(r,c): d=slots[j];k,v=K[(i,d)];out[d].append((i,k,v))
for d in days:
  v=[x[2] for x in out[d]];L=[q[x[0]]['L'] for x in out[d]];fr=[x[1]/q[x[0]]['D'] for x in out[d]]
  inb=sum(1 for x in v if BANDS[d][0]<=x<=BANDS[d][1])
  print(d,len(v),"score %.0f-%.0f avg %.1f inband %d | letters %d-%d avg %.0f | given %.0f%% | unknown avg %.1f"%(min(v),max(v),statistics.mean(v),inb,min(L),max(L),statistics.mean(L),100*statistics.mean(fr),statistics.mean(q[x[0]]['D']-x[1] for x in out[d])))
rng=random.Random(1102); bands={}
for d in days:
  L=[[q[i]['w'][0],q[i]['w'][1],q[i]['w'][2],"".join(sorted(q[i]['o'][:k].lower()))] for i,k,v in out[d]]; rng.shuffle(L); bands[str(d)]=L
js=open(os.path.join(HERE,'wires-header.txt')).read()+"var TG_WIRES="+json.dumps(bands,ensure_ascii=False,separators=(',',':'))+";\n"
open(os.path.join(HERE,'wires.js'),'w').write(js); print("wrote wires.js: rename it to telegraph-wires.js and bump its ?v=")
