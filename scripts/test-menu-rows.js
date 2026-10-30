const fs = require('fs');

async function testMenus() {
  const content = fs.readFileSync('backup-on-2026-10-22-07-42-55.sql', 'utf-8');
  const startMenu = content.indexOf("INSERT INTO `menu`");
  const endMenu = content.indexOf(";\n", startMenu);
  const chunk = content.substring(startMenu, endMenu + 1);

  const lines = chunk.split('\n');
  const menus = [];

  for (const line of lines) {
    if (!line.trim().startsWith('(')) continue;
    const clean = line.replace(/^\(/, '').replace(/[\);,]+$/, '');
    const tokens = clean.split('\t').map(t => t.trim().replace(/^['"]|['",]+$/g, '').trim());
    // 0: id, 1: config_id, 2: nama, 3: link, 4: parrent, 5: link_tipe, 6: enabled, 7: urut
    const [id, config_id, nama, link, parrent, link_tipe, enabled, urut] = tokens;
    menus.push({ id, nama, link, parrent, enabled, urut });
  }

  console.log('Total menus:', menus.length);
  const rootMenus = menus.filter(m => m.parrent === '0');
  console.log('Root menus count:', rootMenus.length);
  console.log('Root menus list:');
  rootMenus.forEach(r => {
    const subs = menus.filter(m => m.parrent === r.id);
    console.log(` - [${r.id}] ${r.nama} (link: ${r.link}, enabled: ${r.enabled}, urut: ${r.urut}) -> ${subs.length} submenus`);
    subs.slice(0, 3).forEach(s => {
      console.log(`     * [${s.id}] ${s.nama} (link: ${s.link}, enabled: ${s.enabled})`);
    });
  });
}

testMenus();
