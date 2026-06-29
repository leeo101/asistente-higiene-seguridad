const fs = require('fs');

const content = fs.readFileSync('src/pages/ATS.tsx', 'utf8');

let lines = content.split('\n');
let block = lines.slice(522, 628).join('\n');
block = block.replace(/\{[^{}]*\}/g, ' '); 
block = block.replace(/\{[^{}]*\}/g, ' '); 

let openTags = [];
let regex = /<\/?([a-zA-Z]+)(?:[^>"\']|"[^"]*"|'[^']*')*>/g;
let m;
while ((m = regex.exec(block)) !== null) {
  let tag = m[1];
  let full = m[0];
  if (full.endsWith('/>')) continue;
  if (tag === 'input' || tag === 'img' || tag === 'br' || tag === 'hr') continue;
  
  if (full.startsWith('</')) {
    if (openTags.length && openTags[openTags.length - 1].tag === tag) {
      openTags.pop();
    } else {
      console.log('Found closing tag </'+tag+'> but top of stack is ' + (openTags.length ? openTags[openTags.length-1].tag : 'empty') + ' at index ' + m.index);
    }
  } else {
    openTags.push({tag, index: m.index, snippet: full.substring(0, 50).replace(/\n/g, ' ')});
  }
}
console.log('Unclosed tags:');
for (let t of openTags) console.log(t.tag, t.snippet);
