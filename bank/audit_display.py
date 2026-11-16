import json, collections, sys

sys.stdout.reconfigure(encoding='utf-8')
items = json.load(open('bank/chem101-bank.json'))
man = json.load(open('bank/manifest.json'))
ts = set(man['typeset_required'])

for pat in ['^', '_', '->', '<->', '⇌', '→', '\\', '*', '⇋', '=']:
    n = sum(1 for i in items if pat in i['stem'] or any(pat in o for o in i['options']))
    print(repr(pat), n)

print('\n=== TYPESET ITEMS ===')
for i in items:
    if i['id'] in ts:
        print('\n---', i['id'], i['topic'], '|', i['stem'])
        for n, o in enumerate(i['options']):
            print('   ', 'ABCDE'[n], o)

print('\n=== UNDERSCORE ITEMS ===')
for i in items:
    if '_' in i['stem'] or any('_' in o for o in i['options']):
        print(i['id'], '|', i['stem'][:140])
