with open('js/bundle.js') as f:
    lines = f.readlines()

# find // ── Draw tiles ──
start_idx = -1
for i, l in enumerate(lines):
    if '// ── Draw tiles ──' in l:
        start_idx = i
        break

# find the end of renderFrame (which is the closing brace before drawDistrictOverlay)
end_idx = -1
for i in range(start_idx, len(lines)):
    if 'requestAnimationFrame(renderFrame);' in lines[i]:
        end_idx = i + 1 # include the closing brace line
        break

tail = lines[start_idx:end_idx+1]
del lines[start_idx:end_idx+1]

# find const endR
insert_idx = -1
for i, l in enumerate(lines):
    if 'const endR   = Math.min(MAP_ROWS' in l:
        insert_idx = i + 1
        break

lines = lines[:insert_idx] + tail + lines[insert_idx:]

with open('js/bundle_fixed.js', 'w') as f:
    f.writelines(lines)
