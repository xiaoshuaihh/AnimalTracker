import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const path = name => new URL(name, root);
const publicFiles = ['index.html', 'style.css', 'app.js', 'data.js', 'map.js', 'assets/cat.jpg', 'assets/bird.jpg', 'assets/dog.jpg'];
const assets = Object.fromEntries(await Promise.all(publicFiles.map(async name => {
  const bytes = await readFile(path('public/' + name));
  return [name, bytes.toString('base64')];
})));
await mkdir(path('dist/server/'), {recursive:true});
await mkdir(path('dist/.openai/'), {recursive:true});
await cp(path('.openai/hosting.json'), path('dist/.openai/hosting.json'));
await cp(path('migrations/'), path('dist/drizzle/'), {recursive:true});
const data = await readFile(path('public/data.js'), 'utf8');
const handler = await readFile(path('server/index.js'), 'utf8');
const entry = handler.replace("import { areas, kinds, samples, eventRoles, achievementsFor } from '../public/data.js';", data)
  + '\nconst embedded = ' + JSON.stringify(assets)
  + ';\nexport default createHandler(name => Uint8Array.from(atob(embedded[name]), c => c.charCodeAt(0)));\n';
await writeFile(path('dist/server/index.js'), entry);
