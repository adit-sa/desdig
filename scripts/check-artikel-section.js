const fs = require('fs');

async function testArtikelParsing() {
  const content = fs.readFileSync('backup-on-2026-10-22-07-42-55.sql', 'utf-8');
  
  // Find INSERT INTO `artikel`
  const startIndex = content.indexOf("INSERT INTO `artikel`");
  if (startIndex === -1) {
    console.log("Not found");
    return;
  }
  
  // Find where the next table starts
  const nextInsert = content.indexOf("INSERT INTO `", startIndex + 25);
  const artikelSection = content.substring(startIndex, nextInsert !== -1 ? nextInsert : startIndex + 5000000);
  
  console.log('Section length:', artikelSection.length);
  console.log('First 400 chars:');
  console.log(artikelSection.substring(0, 400));
}
testArtikelParsing();
