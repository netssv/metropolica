import os, subprocess
files = [
    'js/constants.js',
    'js/map.js',
    'js/camera.js',
    'js/entities.js',
    'js/render.js',
    'js/input.js',
    'js/ui.js',
    'js/api.js',
    'js/main.js',
    'js/misc.js'
]
with open('js/bundle.js', 'w') as out:
    for f in files:
        if os.path.exists(f):
            out.write(open(f).read())
            out.write('\n')

res = subprocess.run(['node', '-c', 'js/bundle.js'], capture_output=True, text=True)
print(res.returncode, res.stderr)
