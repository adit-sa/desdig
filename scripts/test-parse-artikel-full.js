const fs = require('fs');

function parseMySQLValues(sqlChunk) {
  // We want to extract each ( ... ) tuple in VALUES (...)
  // Because strings can contain escaped characters \' and \", we can parse with a finite state machine
  const rows = [];
  let inString = false;
  let stringChar = '';
  let escape = false;
  let inTuple = false;
  let currentTuple = [];
  let currentToken = '';

  const valuesIndex = sqlChunk.indexOf('VALUES');
  if (valuesIndex === -1) return rows;
  const data = sqlChunk.substring(valuesIndex + 6);

  for (let i = 0; i < data.length; i++) {
    const char = data[i];

    if (escape) {
      currentToken += char;
      escape = false;
      continue;
    }

    if (char === '\\') {
      currentToken += char;
      escape = true;
      continue;
    }

    if (inString) {
      if (char === stringChar) {
        inString = false;
      } else {
        currentToken += char;
      }
      continue;
    }

    if (char === "'" || char === '"') {
      inString = true;
      stringChar = char;
      continue;
    }

    if (char === '(' && !inTuple) {
      inTuple = true;
      currentTuple = [];
      currentToken = '';
      continue;
    }

    if (char === ')' && inTuple) {
      currentTuple.push(currentToken.trim());
      rows.push(currentTuple);
      inTuple = false;
      currentTuple = [];
      currentToken = '';
      continue;
    }

    if (inTuple) {
      if (char === '\t' || char === ',') {
        // Lookahead to ensure comma isn't inside number or string
        currentTuple.push(currentToken.trim());
        currentToken = '';
      } else {
        currentToken += char;
      }
    }
  }

  return rows;
}

// Test with simpler line-by-line tab split if lines are standard
async function test() {
  const content = fs.readFileSync('backup-on-2026-10-22-07-42-55.sql', 'utf-8');
  const startArtikel = content.indexOf("INSERT INTO `artikel`");
  const endArtikel = content.indexOf(";\n", startArtikel);
  const chunk = content.substring(startArtikel, endArtikel + 1);

  // Each tuple begins with (\n or (\t
  // Let's inspect the lines inside chunk
  const lines = chunk.split('\n');
  console.log('Total lines in chunk:', lines.length);
  
  let validRows = 0;
  for (const line of lines) {
    if (line.trim().startsWith('(')) {
      validRows++;
    }
  }
  console.log('Lines starting with ( :', validRows);
}

test();
