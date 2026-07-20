const fs = require('fs');
const lines = fs.readFileSync('js/bundle.js', 'utf8').split('\n');

let depth = 0;
let chunks = [];
let currentChunk = [];
let inComment = false;
let currentMax = 0;

for (let line of lines) {
    currentChunk.push(line);
    
    // Naive depth tracking
    let i = 0;
    while (i < line.length) {
        if (inComment) {
            if (line[i] === '*' && line[i+1] === '/') { inComment = false; i++; }
        } else {
            if (line[i] === '/' && line[i+1] === '*') { inComment = true; i++; }
            else if (line[i] === '/' && line[i+1] === '/') { break; }
            else if (line[i] === '{') { depth++; }
            else if (line[i] === '}') { depth--; }
        }
        i++;
    }
    
    if (depth === 0 && !inComment && currentChunk.length >= 120) {
        if (currentChunk.length > currentMax) currentMax = currentChunk.length;
        chunks.push(currentChunk.join('\n'));
        currentChunk = [];
    }
}
if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n'));
}

console.log("Chunks:", chunks.length, "Max lines in a chunk:", currentMax);

// Clean js directory
fs.readdirSync('js').forEach(f => { if(f !== 'bundle.js') fs.unlinkSync('js/' + f) });

let scriptTags = "";
chunks.forEach((c, i) => {
    const fname = `chunk_${i+1}.js`;
    fs.writeFileSync(`js/${fname}`, c);
    scriptTags += `  <script src="js/${fname}"></script>\n`;
});

// Update index.html
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(/<script src="js\/.*?<\/script>\n/g, '');
html = html.replace('</body>', scriptTags + '</body>');
fs.writeFileSync('index.html', html);
