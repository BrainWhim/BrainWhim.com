"""The Telegraph Office: grade every telegram (Nov 2, 2026). Run in Claude's workspace (needs the hunspell en_US
dictionary at /usr/share/hunspell/en_US.dic): python3 grade_wires.py  -> writes tgall.json next to it.

The step-by-step solver: the letters the operator gives are known. Each step, it finds the word with the fewest dictionary
words that fit its pattern (and the letters known so far), and fills it in. Cost of a step: 0.5 + 0.75 per new letter, plus
3 x log2(how many words fit) when it isn't the only one (the reader has to pick by the meaning). The total is the score.
Every telegram is graded for each number of given letters (most common letters first), as the operator gives them."""
import re,math,json,sys,collections,os
dic=open('/usr/share/hunspell/en_US.dic',encoding='latin-1').read().split('\n')[1:]
W=set()
def add(w):
  if w.isalpha() and w.isascii(): W.add(w.upper())
for line in dic:
  if not line: continue
  w,_,fl=line.partition('/')
  if not w.islower(): 
    if w[:1].isupper() and w[1:].islower() and len(w)>1: pass
    else: continue
  w=w.lower(); add(w)
  if 'S' in fl: add(w+'es' if re.search('(s|x|z|ch|sh)$',w) else (w[:-1]+'ies' if re.search('[^aeiou]y$',w) else w+'s'))
  if 'D' in fl: add(w+'d' if w.endswith('e') else (w[:-1]+'ied' if re.search('[^aeiou]y$',w) else w+'ed'))
  if 'G' in fl: add((w[:-1] if w.endswith('e') else w)+'ing')
  if 'R' in fl: add((w+'r') if w.endswith('e') else w+'er')
  if 'Y' in fl: add(w+'ly')
  if 'M' in fl: add(w+"S")  # possessive treated as word+S letters
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from quotes import Q
for w in Q:
    for t in re.findall(r"[A-Za-z]+",w[0].replace("'","")): add(t)
bylen=collections.defaultdict(list)
for w in W: bylen[len(w)].append(w)
def pat(w):
  m={};return tuple(m.setdefault(c,len(m)) for c in w)
idx=collections.defaultdict(list)
for w in W: idx[(len(w),pat(w))].append(w)
def grade(text,given):
  words=sorted(set(re.findall(r"[A-Z]+",text.upper().replace("'",""))))
  known=set(given)  # plain letters known
  score=0;steps=0;guesses=0
  while True:
    todo=[w for w in words if any(c not in known for c in w)]
    if not todo: return score,steps,guesses
    best=None
    for w in todo:
      cands=[c for c in idx[(len(w),pat(w))] if all((w[i] in known)==(c[i] in known) and (w[i] not in known or c[i]==w[i]) for i in range(len(w)))]
      # letters unknown in w must map to unknown letters: enforced above ((c[i] in known) == False)
      n=len(cands)
      if best is None or n<best[0] or (n==best[0] and len(w)>len(best[1])): best=(n,w)
    n,w=best
    u=len(set(c for c in w if c not in known));cost=0.5+0.75*u+(3*math.log2(n) if n>1 else 0)
    score+=cost;steps+=1
    if n>1: guesses+=1
    known|=set(w)

def order_of(t):
  f=collections.Counter(c for c in t.lower() if c.isalpha())
  return [c.upper() for c,_ in sorted(f.items(),key=lambda kv:(-kv[1],kv[0]))]
if __name__=="__main__":
  out=[]
  for w in Q:
    o=order_of(w[0]);sc={}
    for k in range(1,len(o)-2):
      sc[k]=round(grade(w[0],set(o[:k]))[0],2)
      if sc[k]<8: break
    out.append({"w":list(w),"L":sum(c.isalpha() for c in w[0]),"D":len(o),"sc":sc,"o":"".join(o)})
  json.dump(out,open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'tgall.json'),'w'))
  print(len(out),"telegrams graded")
