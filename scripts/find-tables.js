const fs = require('fs');
const content = fs.readFileSync('backup-on-2026-10-22-07-42-55.sql', 'utf8');
const tables = content.match(/INSERT INTO [`"](\w+)[`"]/gi) || [];
const unique = Array.from(new Set(tables));
console.log('Unique INSERT INTO tables count:', unique.length);
console.log('Matching tables:', unique.filter(t => /art|berita|gal|pamong|media/i.test(t)));
console.log('First 20 tables:', unique.slice(0, 20));
