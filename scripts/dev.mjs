import { createServer } from 'node:http';
import { mkdir, readFile, writeFile, open, rm, readdir, stat } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { createHandler } from '../server/index.js';

const root = new URL('../', import.meta.url);
const directory = process.env.WILDLIFE_DATA_DIR ? new URL('file://' + process.env.WILDLIFE_DATA_DIR.replace(/\/$/, '') + '/') : new URL('.local/', root);
const media = new URL('images/', directory);
await mkdir(media, { recursive: true });
const db = new DatabaseSync(fileURLToPath(new URL('wildlife.sqlite', directory)));
db.exec('PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
const migrations = (await readdir(new URL('migrations/', root))).filter(name => name.endsWith('.sql')).sort();
const sql = await Promise.all(migrations.map(name => readFile(new URL('migrations/' + name, root), 'utf8')));
db.exec('BEGIN IMMEDIATE');
try {
  const version = db.prepare('PRAGMA user_version').get().user_version;
  for (const migration of sql.slice(version)) db.exec(migration);
  db.exec('PRAGMA user_version = ' + sql.length + '; COMMIT;');
} catch (error) {
  db.exec('ROLLBACK');
  throw error;
}
class Statement {
  constructor(query, values = []) {
    this.query = query;
    this.values = values;
  }
  bind(...values) {
    return new Statement(this.query, values);
  }
  first() {
    return db.prepare(this.query).get(...this.values) || null;
  }
  all() {
    return { results: db.prepare(this.query).all(...this.values) };
  }
  run() {
    return { meta: { changes: db.prepare(this.query).run(...this.values).changes } };
  }
  execute() {
    return /^SELECT /i.test(this.query) ? this.all() : this.run();
  }
}
const env = {
  LOCAL_DEMO: true,
  EVENT_REVIEWER_EMAILS: process.env.EVENT_REVIEWER_EMAILS,
  CAT_FUNDRAISERS_JSON: process.env.CAT_FUNDRAISERS_JSON,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  DB: {
    prepare: query => new Statement(query),
    batch(statements) {
      db.exec('BEGIN IMMEDIATE');
      try {
        const results = statements.map(statement => statement.execute());
        db.exec('COMMIT');
        return results;
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
  },
  BUCKET: {
    put: (id, content) => writeFile(new URL(id, media), content instanceof ArrayBuffer ? new Uint8Array(content) : content),
    delete: id => rm(new URL(id, media), { force: true }),
    async head(id) {
      try {
        return {size:(await stat(new URL(id, media))).size};
      } catch (error) {
        if (error.code === 'ENOENT') return null;
        throw error;
      }
    },
    async get(id, options) {
      try {
        const handle = await open(new URL(id, media));
        const range = options?.range;
        return { body: range ? Readable.toWeb(handle.createReadStream({
          start: range.offset, end: range.offset + range.length - 1,
        })) : handle.readableWebStream() };
      } catch (error) {
        if (error.code === 'ENOENT') return null;
        throw error;
      }
    },
  },
};
const worker = createHandler(filename => readFile(new URL('public/' + filename, root)));
function cliOption(name) {
  const index = process.argv.indexOf('--' + name);
  return index === -1 ? undefined : process.argv[index + 1];
}
const port = Number(cliOption('port') || process.env.PORT || 4173);
const host = cliOption('host') || process.env.WILDLIFE_HOST || '127.0.0.1';
const server = createServer(async (incoming, outgoing) => {
  try {
    const scheme = incoming.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const origin = scheme + '://' + (incoming.headers.host || 'localhost:' + port);
    const url = new URL(incoming.url, origin);
    const headers = new Headers(incoming.headers);
    headers.delete('oai-authenticated-user-id');
    headers.delete('oai-authenticated-user-email');
    if (process.env.WILDLIFE_DEMO_EMAIL) headers.set('oai-authenticated-user-email', process.env.WILDLIFE_DEMO_EMAIL);
    headers.set('oai-authenticated-user-id', process.env.WILDLIFE_DEMO_VIEWER || 'local-demo');
    const hasBody = incoming.method !== 'GET' && incoming.method !== 'HEAD';
    const request = new Request(url, {
      method: incoming.method,
      headers,
      ...(hasBody ? { body: Readable.toWeb(incoming), duplex: 'half' } : {}),
    });
    const result = await worker.fetch(request, env);
    outgoing.writeHead(result.status, Object.fromEntries(result.headers));
    if (result.body) Readable.fromWeb(result.body).pipe(outgoing);
    else outgoing.end();
  } catch (error) {
    console.error(error);
    if (!outgoing.headersSent) outgoing.writeHead(500);
    outgoing.end('Server error');
  }
});
server.listen(port, host, () => console.log('Local http://' + host + ':' + server.address().port));
