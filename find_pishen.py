# -*- coding: utf-8 -*-
import os

hits = []
base = r'C:\Users\HC\.qclaw\workspace\todo-app'
for root, dirs, files in os.walk(base):
    if '.git' in root or 'node_modules' in root or 'dist' in root:
        continue
    for f in files:
        if f.endswith(('.ts', '.tsx', '.json', '.md', '.html', '.css')):
            path = os.path.join(root, f)
            try:
                with open(path, 'r', encoding='utf-8') as fp:
                    for i, line in enumerate(fp, 1):
                        if '皮神' in line:
                            rel = path.replace(base, '.')
                            hits.append('%s:%d' % (rel, i))
            except Exception as e:
                pass

for h in hits:
    print(h)
