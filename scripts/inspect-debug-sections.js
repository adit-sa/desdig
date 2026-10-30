const fs = require('fs');
const html = fs.readFileSync('scripts/debug-html.html', 'utf-8');

const sectionMatches = html.match(/<section[^>]*id="([^"]*)"/g);
console.log('Section id matches:', sectionMatches);

const h3Matches = html.match(/<h3[^>]*>([^<]*)<\/h3>/g);
console.log('H3 matches:', h3Matches);
