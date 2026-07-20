const fs = require('fs');
const lines = fs.readFileSync('js/bundle_fixed.js', 'utf8').split('\n');
const chunks = [];
let curr = [];

for (let i = 0; i < lines.length; i++) {
    curr.push(lines[i]);
    // check if next line is a top-level function or const/let and current size is > 150
    if (curr.length >= 150 && i + 1 < lines.length) {
        if (lines[i+1].startsWith('function ') || lines[i+1].startsWith('const ') || lines[i+1].startsWith('let ') || lines[i+1].startsWith('// ──')) {
            chunks.push(curr.join('\n'));
            curr = [];
        }
    }
}
if (curr.length > 0) chunks.push(curr.join('\n'));

fs.readdirSync('js').forEach(f => { if(f !== 'bundle_fixed.js') fs.unlinkSync('js/' + f) });

let scriptTags = "";
chunks.forEach((c, i) => {
    const fname = `chunk_${i+1}.js`;
    fs.writeFileSync(`js/${fname}`, c);
    scriptTags += `  <script src="js/${fname}"></script>\n`;
});

let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(/<script src="js\/.*?<\/script>\n/g, '');
html = html.replace('</body>', scriptTags + '</body>');
fs.writeFileSync('index.html', html);

console.log("Chunks created:", chunks.length);
