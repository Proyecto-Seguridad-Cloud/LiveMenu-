import os,re
path='backend/alembic/versions'
files=[f for f in os.listdir(path) if f.endswith('.py')]
re_rev=re.compile(r"^revision:.*['\"]([0-9a-f]+)['\"]",re.M)
re_down=re.compile(r"^down_revision:.*=(.*)",re.M)
re_down_quote=re.compile(r"['\"]([0-9a-f,\s\(\)']+)['\"]")
re_down_tuple=re.compile(r"\(([^)]+)\)")
re_down_simple=re.compile(r"['\"]([0-9a-f]+)['\"]")
re_down_none=re.compile(r"None")
revisions={}
for fn in files:
    txt=open(os.path.join(path,fn),'r',encoding='utf-8').read()
    m=re_rev.search(txt)
    if not m:
        continue
    rev=m.group(1)
    # attempt to parse down_revision value
    m2=re.search(r"^down_revision:.*",txt,re.M)
    down=None
    if m2:
        line=m2.group(0)
        # try to find quoted value(s)
        q=re.findall(r"['\"]([0-9a-f,\s]+)['\"]",line)
        if q:
            down=q[0]
        else:
            # try to find tuple across lines
            mtuple=re.search(r"down_revision:.*=\s*\(([^)]+)\)",txt,re.M)
            if mtuple:
                down=mtuple.group(1)
    revisions[rev]=down
print('revisions and down:',revisions)
children=set()
for v in revisions.values():
    if v:
        # split commas
        parts=[p.strip().strip("'\"") for p in v.replace('(','').replace(')','').split(',') if p.strip()]
        for p in parts:
            children.add(p)
heads=[r for r in revisions.keys() if r not in children]
print('children:',children)
print('heads:',heads)
