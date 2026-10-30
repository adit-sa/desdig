const http = require('http');
const fs = require('fs');

http.get('http://localhost:3000/?tenant=salupangkang', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    fs.writeFileSync('scripts/debug-html.html', data);
    console.log('Saved. Total length:', data.length);
    console.log('Has id="pamong":', data.includes('id="pamong"'));
    console.log('Has Efektivitas Pelayanan:', data.includes('Efektivitas Pelayanan'));
    console.log('Has Sapiil:', data.includes('Sapiil'));
    console.log('Has Nurdianti:', data.includes('Nurdianti'));
    console.log('Has Hadir di Balai Desa:', data.includes('Hadir di Balai Desa'));
  });
});
