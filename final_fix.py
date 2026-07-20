import re

html = open('index.html', 'r').read()
hud_match = re.search(r'(<nav id="hud-toolbar".*?</nav>)', html, re.DOTALL)
if hud_match:
    with open('components/toolbar.html', 'w') as f:
        f.write(hud_match.group(1))
    html = html.replace(hud_match.group(1), '<div id="toolbar-container"></div>')
    html = html.replace('</body>', """
  <script>
    fetch('components/toolbar.html').then(r=>r.text()).then(h => {
        document.getElementById('toolbar-container').innerHTML = h;
    });
  </script>
</body>""")
with open('index.html', 'w') as f:
    f.write(html)

lines = open('js/ui_2.js', 'r').readlines()
with open('js/ui_2a.js', 'w') as f:
    f.writelines(lines[:100])
with open('js/ui_2b.js', 'w') as f:
    f.writelines(lines[100:])
import os
os.remove('js/ui_2.js')

html = open('index.html', 'r').read()
html = html.replace('<script src="js/ui_2.js"></script>', '<script src="js/ui_2a.js"></script>\n  <script src="js/ui_2b.js"></script>')
with open('index.html', 'w') as f:
    f.write(html)

