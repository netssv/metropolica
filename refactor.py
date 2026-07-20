import os
import re

# Add the rule
os.makedirs('.agents', exist_ok=True)
with open('.agents/AGENTS.md', 'w') as f:
    f.write("# Rules\n\n## Refactoring Rule\n- Files MUST NOT exceed 200 lines. Modularize your code using components, imports, and clear directory structures.\n")

# CSS Splitting
css_content = open('index.css', 'r').read()
css_sections = re.split(r'/\* ── (.+?) ─+ \*/', css_content)

os.makedirs('css', exist_ok=True)
main_css = "/* Main CSS Entry Point */\n@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');\n"

current_file = None
file_content = ""

# Very naive split for CSS
# We'll just group them into a few files
css_groups = {
    'base.css': ['Reset & base', 'Game root', 'Canvas'],
    'hud.css': ['HUD layer', 'Top status bar', 'Left toolbar', 'Zoom controls', 'Corruption strip (top-right)'],
    'components.css': ['Tile inspector', 'Bottom slide-up dashboard', 'District cards', 'Org cards', 'Finance / Opinion', 'Controls pane', 'Citizens', 'Status badge', 'Empty state'],
    'modals.css': ['Modals', 'Toast notifications']
}

section_to_file = {}
for file, sections in css_groups.items():
    for sec in sections:
        section_to_file[sec] = file

files_data = {f: "" for f in css_groups.keys()}
files_data['misc.css'] = ""

current_f = 'misc.css'
if len(css_sections) > 0:
    files_data['misc.css'] += css_sections[0]

for i in range(1, len(css_sections), 2):
    title = css_sections[i].strip()
    content = css_sections[i+1]
    f = section_to_file.get(title, 'misc.css')
    files_data[f] += f"/* ── {title} ── */\n" + content

for f, content in files_data.items():
    if content.strip():
        with open(f"css/{f}", 'w') as out:
            out.write(content)
        main_css += f"@import url('css/{f}');\n"

with open('index.css', 'w') as f:
    f.write(main_css)

# JS Splitting
js_content = open('index.js', 'r').read()
js_sections = re.split(r'// [═─]+ (.+?) [═─]+', js_content)

os.makedirs('js', exist_ok=True)

js_groups = {
    'constants.js': ['Map constants', 'Global state'],
    'map.js': ['Tile map', 'MAP GENERATION'],
    'camera.js': ['Camera'],
    'entities.js': ['Pedestrians'],
    'render.js': ['TILE RENDERING', 'RENDER LOOP'],
    'input.js': ['INPUT HANDLERS', 'TOOL SYSTEM'],
    'ui.js': ['TILE INSPECTOR', 'DASHBOARD PANEL', 'HUD UPDATE', 'DISTRICT CARDS', 'ORGANIZATIONS', 'CORRUPTION', 'FOOTPRINT LOG', 'OPINION BREAKDOWN', 'TREASURY DETAIL', 'CITIZENS LIST', 'CITIZEN MODAL', 'PRESS MODAL', 'TOAST'],
    'api.js': ['API'],
    'main.js': ['Game loop', 'INIT']
}

section_to_js = {}
for file, sections in js_groups.items():
    for sec in sections:
        section_to_js[sec] = file

js_files_data = {f: "" for f in js_groups.keys()}
js_files_data['misc.js'] = ""

current_f = 'misc.js'
if len(js_sections) > 0:
    js_files_data['misc.js'] += js_sections[0]

for i in range(1, len(js_sections), 2):
    title = js_sections[i].strip()
    content = js_sections[i+1]
    f = section_to_js.get(title, 'misc.js')
    js_files_data[f] += f"// ── {title} ──\n" + content

js_order = ['constants.js', 'map.js', 'camera.js', 'entities.js', 'render.js', 'input.js', 'ui.js', 'api.js', 'main.js']

for f in js_files_data:
    if js_files_data[f].strip():
        with open(f"js/{f}", 'w') as out:
            # We want to export/import to make it true modules, but that requires rewriting global variables.
            # Instead, we'll keep them as global scripts for now, but attach to window.
            # Wait, if we attach to window we have to rewrite. If we just leave it, `let` and `const` won't be shared across scripts if loaded as normal scripts?
            # Actually, if they are normal scripts (not modules), `let` and `const` are shared in the global scope if defined at top level!
            out.write(js_files_data[f])

# HTML Update
html_content = open('index.html', 'r').read()

script_tags = ""
for f in js_order:
    if js_files_data.get(f, "").strip():
        script_tags += f'  <script src="js/{f}"></script>\n'
if js_files_data.get('misc.js', "").strip():
    script_tags += f'  <script src="js/misc.js"></script>\n'

html_content = re.sub(r'<script type="module" src="index.js"></script>', script_tags, html_content)

# We can also extract modals to reduce html size
modal_match = re.search(r'<!-- ══ PRESS CONFERENCE MODAL ══ -->(.*?)<!-- ══ TOAST CONTAINER ══ -->', html_content, re.DOTALL)
if modal_match:
    os.makedirs('components', exist_ok=True)
    with open('components/modals.html', 'w') as f:
        f.write(modal_match.group(1))
    
    html_content = html_content.replace(modal_match.group(1), '\n  <!-- Modals will be loaded here -->\n  <div id="modals-container"></div>\n')
    
    # Add script to load modals
    fetch_script = """
  <script>
    fetch('components/modals.html')
      .then(r => r.text())
      .then(html => {
        document.getElementById('modals-container').innerHTML = html;
        if(window.bindEvents) bindEvents();
      });
  </script>
"""
    html_content = html_content.replace('</body>', fetch_script + '</body>')

with open('index.html', 'w') as f:
    f.write(html_content)

print("Refactor complete")
