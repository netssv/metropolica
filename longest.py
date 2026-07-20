import re
code = open('js/bundle.js').read()
max_len = 0
for match in re.finditer(r'^function .*?^}', code, re.MULTILINE | re.DOTALL):
    lines = match.group(0).count('\n')
    if lines > max_len:
        max_len = lines
        name = match.group(0).split('\n')[0]
print(f"Longest: {max_len} lines ({name})")
