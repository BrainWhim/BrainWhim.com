"""The Print Shop: build the extra-words dictionary (Nov 2, 2026).
Expands hunspell en_US (its suffix rules) and keeps plain lowercase words of 4-8 letters.
Writes printshop-words.js: window.PSWORDS = "word word ..." (sorted). Run: python3 mkdict.py"""
import re
aff = open('/usr/share/hunspell/en_US.aff', encoding='latin-1').read().split('\n')
rules = {}
i = 0
while i < len(aff):
    p = aff[i].split()
    if len(p) >= 4 and p[0] in ('SFX', 'PFX') and p[2] in ('Y', 'N') and p[3].isdigit():
        kind, flag, cross, n = p[0], p[1], p[2], int(p[3])
        lst = []
        for j in range(1, n + 1):
            q = aff[i + j].split()
            strip = '' if q[2] == '0' else q[2]
            add = '' if q[3] == '0' else q[3].split('/')[0]
            cond = q[4] if len(q) > 4 else '.'
            lst.append((strip, add, cond))
        rules[flag] = (kind, lst)
        i += n + 1
        continue
    i += 1

def apply(word, flag):
    kind, lst = rules[flag]
    out = []
    for strip, add, cond in lst:
        if kind == 'SFX':
            if re.search(cond + '$', word) and (not strip or word.endswith(strip)):
                out.append((word[:len(word) - len(strip)] if strip else word) + add)
        else:
            if re.match(cond, word) and (not strip or word.startswith(strip)):
                out.append(add + (word[len(strip):] if strip else word))
    return out

words = set()
for line in open('/usr/share/hunspell/en_US.dic', encoding='latin-1').read().split('\n')[1:]:
    if not line: continue
    w, _, fl = line.partition('/')
    if not re.fullmatch(r'[a-z]+', w): continue   # no names, no apostrophes
    words.add(w)
    for f in fl:
        if f in rules and rules[f][0] == 'SFX':
            for x in apply(w, f): words.add(x)

# words no one wants to see turn up on a type tray (kept short and plain; matched as whole words)
BLOCK = set("""
anal anus arse arses ass asses bastard bastards bitch bitches bitchy bollocks boob boobs boner booty bugger buggers butt butts
clit cock cocks coon coons crap crappy cum cunt cunts damn damned dammit dick dicks dildo dildos dyke dykes fag fags faggot fart farts
fuck fucks fucked fucker fucking gook gooks homo homos hooker hookers horny jizz kike kikes knob lesbo nazi nazis negro nigga nigger
niggers nude nudes orgasm orgy pecker penis penises piss pissed porn porno prick pricks pube pubes pussy queer queers rape raped rapes
rapist screw screwed scrotum semen sex sexy shag shit shits shitty slag slut sluts smut spic spics sperm tit tits titty turd turds
twat twats vagina wank wanker whore whores wop wops cripple retard retards spaz kill kills killed killer suicide hitler slave slaves
""".split())
keep = sorted(w for w in words if 4 <= len(w) <= 8 and w.isalpha() and w.isascii() and w not in BLOCK and not any(w.startswith(b) and len(b) >= 4 and b in ('fuck','shit','cunt','nigg','whore','slut','dick','piss','porn','rape') for b in BLOCK))
open(__import__('os').path.join(__import__('os').path.dirname(__file__), '..', '..', 'printshop-words.js'), 'w').write('/* The Print Shop: words that count as extra words (hunspell en_US, 4-8 letters; Nov 2, 2026) */\nvar PSWORDS="' + ' '.join(keep) + '";\n')
print(len(keep), sum(len(w) + 1 for w in keep))
for t in ['type', 'inked', 'baker', 'bakery', 'rolls', 'scones', 'running', 'quickly', 'unhappy', 'redo']:
    print(t, t in set(keep))
