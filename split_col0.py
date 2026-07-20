import re
lines = open('js/bundle.js').read().split('\n')
chunks = []
curr = []
for line in lines:
    # If line starts with a non-space character (and is not a comment/bracket maybe), we can split
    # actually just checking if it starts with 'function ', 'let ', 'const ', 'var '
    if len(curr) >= 150 and re.match(r'^(function|let|const|var|class) ', line):
        chunks.append('\n'.join(curr))
        curr = []
    curr.append(line)
if curr:
    chunks.append('\n'.join(curr))

print(f"Chunks: {len(chunks)}, Max: {max(len(c.split(chr(10))) for c in chunks)}")

import os
for f in os.listdir('js'):
    if f != 'bundle.js': os.remove('js/'+f)

tags = ""
for i, c in enumerate(chunks):
    with open(f'js/chunk_{i+1}.js', 'w') as f:
        f.write(c)
    tags += f'  <script src="js/chunk_{i+1}.js"></script>\n'

html = open('index.html').read()
html = re.sub(r'<script src="js/.*?</script>\n', '', html)
html = html.replace('</body>', tags + '</body>')
open('index.html', 'w').write(html)
