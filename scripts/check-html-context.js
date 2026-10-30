const http = require('http');

http.get('http://localhost:3000/?tenant=salupangkang', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const idx = data.indexOf('Nurdianti');
    console.log('Index of Nurdianti:', idx);
    console.log('Context of Nurdianti (around 500 chars):');
    console.log(data.substring(Math.max(0, idx - 200), idx + 300));
  });
});
