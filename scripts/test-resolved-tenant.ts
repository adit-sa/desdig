import { resolveTenant } from '../lib/tenant/resolver';

async function test() {
  const tenant = await resolveTenant('salupangkang');
  if (!tenant) {
    console.log('Not found');
    return;
  }
  console.log('Resolved tenant:', tenant.namaDesa);
  console.log('enabledModules:', tenant.enabledModules);
  console.log('hasProfile?:', tenant.enabledModules.length === 0 || tenant.enabledModules.includes('profile'));
}
test().catch(console.error);
