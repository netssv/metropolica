import os, re

def chunk_file(filepath, max_lines, out_dir):
    with open(filepath, 'r') as f:
        lines = f.readlines()
    if len(lines) <= max_lines:
        return
    
    base = os.path.basename(filepath).split('.')[0]
    ext = filepath.split('.')[-1]
    
    chunks = []
    curr = []
    for line in lines:
        curr.append(line)
        if len(curr) >= max_lines and line.strip() == '}':
            chunks.append(curr)
            curr = []
    if curr:
        chunks.append(curr)
        
    for i, c in enumerate(chunks):
        out_name = f"{out_dir}/{base}_{i+1}.{ext}"
        with open(out_name, 'w') as f:
            f.writelines(c)
    os.remove(filepath)

chunk_file('js/ui.js', 180, 'js')
chunk_file('js/render.js', 180, 'js')
chunk_file('js/misc.js', 180, 'js')
chunk_file('css/components.css', 180, 'css')
chunk_file('css/hud.css', 180, 'css')

with open('index.css', 'w') as f:
    f.write("/* Modularized CSS */\n")
    for file in os.listdir('css'):
        if file.endswith('.css'):
            f.write(f"@import url('css/{file}');\n")

# Rebuild index.html script tags
html = open('index.html', 'r').read()
html = re.sub(r'<script src="js/.*?</script>\n', '', html)
script_tags = ""
for file in sorted(os.listdir('js')):
    if file.endswith('.js'):
        script_tags += f'  <script src="js/{file}"></script>\n'
html = html.replace('</body>', script_tags + '</body>')

# Extract dashboard from HTML
dash_match = re.search(r'(<div id="hud-bottom".*?</div><!-- /hud-bottom -->)', html, re.DOTALL)
if dash_match:
    with open('components/dashboard.html', 'w') as f:
        f.write(dash_match.group(1))
    html = html.replace(dash_match.group(1), '<div id="dashboard-container"></div>')
    html = html.replace('</body>', f"""
  <script>
    fetch('components/dashboard.html').then(r=>r.text()).then(h => {{
        document.getElementById('dashboard-container').innerHTML = h;
    }});
  </script>
</body>""")

with open('index.html', 'w') as f:
    f.write(html)
os.remove('index.js')
