const { resolveTenant } = require('./lib/tenant/resolver');

async function test() {
  const tenant = await resolveTenant('salupangkang');
  console.log('Resolved tenant:', tenant.namaDesa);
  console.log('enabledModules:', tenant.enabledModules);
  console.log('hasProfile?:', tenant.enabledModules.length === 0 || tenant.enabledModules.includes('profile'));
}
test().catch(console.error);
