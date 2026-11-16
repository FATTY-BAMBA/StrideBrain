import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { readFile, writeFile, mkdir, chmod, readdir, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const root = '/tmp/sb029-cloud-qa';
const workspace = process.env.SB029_PREVIEW_WORKSPACE;
const databaseUrl = new URL(process.env.DATABASE_URL || 'http://invalid');
const appOrigin = new URL(process.env.STRIDEBRAIN_APP_ORIGIN || 'http://localhost:3000');
const operatorPort = Number(process.env.SB029_PREVIEW_OPERATOR_PORT || '3001');
if (databaseUrl.pathname !== '/stridebrain_stage8_preview' || !['localhost', '127.0.0.1'].includes(databaseUrl.hostname)) {
  throw new Error('PREVIEW_DATABASE_REQUIRED');
}
if (appOrigin.origin !== 'http://localhost:3000') {
  throw new Error('PREVIEW_LOOPBACK_ORIGIN_REQUIRED');
}
if (operatorPort !== 3001) throw new Error('PREVIEW_OPERATOR_PORT_REQUIRED');
await mkdir(root, { recursive: true, mode: 0o700 });
await chmod(root, 0o700);
await mkdir(resolve(root, 'bootstrap'), { recursive: true, mode: 0o700 });

const personas = Object.freeze({
  mei: 'membership_horizon_mei',
  finance: 'membership_horizon_finance',
  admin: 'membership_horizon_admin',
  viewer: 'membership_horizon_viewer',
  northern: 'membership_northern_owner',
});

async function privateWrite(path, value) {
  await writeFile(path, value, { mode: 0o600 });
  await chmod(path, 0o600);
}

async function records() {
  try { return JSON.parse(await readFile(resolve(root, 'issued-sessions.json'), 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
}

async function sessionService() {
  const [{ DemoSessionService }, { PrismaDemoSessionRepository }, { getPrismaClient }] = await Promise.all([
    import(pathToFileURL(resolve(workspace, 'src/modules/runtime-context/demo-session-service.ts')).href),
    import(pathToFileURL(resolve(workspace, 'src/repositories/prisma/prisma-demo-session-repository.ts')).href),
    import(pathToFileURL(resolve(workspace, 'src/lib/server/prisma.ts')).href),
  ]);
  const database = getPrismaClient();
  return { database, service: new DemoSessionService(new PrismaDemoSessionRepository(database), process.env.STRIDEBRAIN_DEMO_SESSION_SECRET) };
}

async function preflight() {
  const require = createRequire(resolve(workspace, 'package.json'));
  const { Client } = require('pg');
  const client = new Client({ connectionString: databaseUrl.href });
  await client.connect();
  try {
    const result = await client.query('SELECT current_database() AS database, to_regclass(\'public."DemoSession"\') IS NOT NULL AS session_schema_ready');
    console.log(JSON.stringify({ kind: 'PREVIEW_PREFLIGHT', ...result.rows[0], operation_read_only: true }));
  } finally { await client.end(); }
}

async function issue(persona, locale = 'en') {
  if (!Object.hasOwn(personas, persona) || !['en', 'zh-TW'].includes(locale)) throw new Error('PREVIEW_PERSONA_OR_LOCALE_REJECTED');
  const { database, service } = await sessionService();
  try {
    const issued = await service.issueForMembership(personas[persona], { locale, ttlSeconds: 60 * 60 });
    if (!issued) throw new Error('PREVIEW_FIXTURE_MEMBERSHIP_UNAVAILABLE');
    const token = randomBytes(32).toString('hex');
    const redirect = new URL(`/${locale}/projects/PRJ-XINYI-026`, appOrigin);
    const bootstrapUrl = `http://${appOrigin.hostname}:${operatorPort}/bootstrap/${token}`;
    await privateWrite(resolve(root, 'bootstrap', `${token}.json`), JSON.stringify({
      persona, locale, sessionId: issued.sessionId, expiresAt: Date.now() + 5 * 60 * 1000,
      setCookie: issued.setCookie, redirect: redirect.href,
    }));
    await privateWrite(resolve(root, `bootstrap-${persona}-${locale}.url`), `${bootstrapUrl}\n`);
    const ledger = await records();
    ledger.push({ persona, locale, sessionId: issued.sessionId, expiresAt: issued.expiresAt.toISOString() });
    await privateWrite(resolve(root, 'issued-sessions.json'), JSON.stringify(ledger, null, 2));
    console.log(JSON.stringify({ kind: 'PREVIEW_SESSION_READY', persona, locale,
      bootstrapUrlFile: resolve(root, `bootstrap-${persona}-${locale}.url`),
      bootstrapLifetimeSeconds: 300, sessionLifetimeSeconds: 3600, credentialPrinted: false }));
  } finally { await database.$disconnect(); }
}

async function revoke(persona = 'all') {
  if (persona !== 'all' && !Object.hasOwn(personas, persona)) throw new Error('PREVIEW_PERSONA_REJECTED');
  const { database, service } = await sessionService();
  try {
    const ledger = await records();
    let revoked = 0;
    for (const item of ledger.filter((entry) => persona === 'all' || entry.persona === persona)) {
      if (await service.revoke(item.sessionId)) revoked++;
    }
    for (const filename of await readdir(resolve(root, 'bootstrap'))) {
      if (!/^[a-f0-9]{64}\.json$/.test(filename)) continue;
      const path = resolve(root, 'bootstrap', filename);
      const item = JSON.parse(await readFile(path, 'utf8'));
      if (persona === 'all' || item.persona === persona) await unlink(path);
    }
    console.log(JSON.stringify({ kind: 'PREVIEW_SESSION_REVOKED', persona, count: revoked, credentialPrinted: false }));
  } finally { await database.$disconnect(); }
}

function serve() {
  const server = createServer(async (req, res) => {
    const headers = {
      'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'", 'X-Content-Type-Options': 'nosniff',
    };
    try {
      if (req.method !== 'GET' || ![`${appOrigin.hostname}:${operatorPort}`, `127.0.0.1:${operatorPort}`].includes(req.headers.host)) {
        res.writeHead(404, headers); res.end('Unavailable'); return;
      }
      if (req.url === '/health') { res.writeHead(200, headers); res.end('SB029 operator bootstrap ready'); return; }
      const match = /^\/bootstrap\/([a-f0-9]{64})$/.exec(req.url || '');
      if (!match) { res.writeHead(404, headers); res.end('Unavailable'); return; }
      const path = resolve(root, 'bootstrap', `${match[1]}.json`);
      const item = JSON.parse(await readFile(path, 'utf8'));
      await unlink(path);
      if (item.expiresAt <= Date.now() || new URL(item.redirect).origin !== appOrigin.origin) {
        res.writeHead(404, headers); res.end('Unavailable'); return;
      }
      res.writeHead(303, { ...headers, 'Set-Cookie': item.setCookie, Location: item.redirect });
      res.end();
      console.log(JSON.stringify({ kind: 'PREVIEW_BOOTSTRAP_CONSUMED', persona: item.persona, locale: item.locale }));
    } catch {
      res.writeHead(404, headers); res.end('Unavailable');
    }
  });
  server.listen(operatorPort, '127.0.0.1', () => console.log(JSON.stringify({ kind: 'PREVIEW_BOOTSTRAP_LISTENING', port: operatorPort, host: '127.0.0.1' })));
}

const [command, persona, locale] = process.argv.slice(2);
try {
  if (command === 'preflight') await preflight();
  else if (command === 'check-imports') {
    const { database } = await sessionService();
    await database.$disconnect();
    console.log('PREVIEW_SOURCE_IMPORTS_OK; no query, session, migration, or server run');
  }
  else if (command === 'issue') await issue(persona, locale);
  else if (command === 'revoke') await revoke(persona);
  else if (command === 'serve') serve();
  else throw new Error('PREVIEW_COMMAND_REQUIRED');
} catch (error) {
  console.error(JSON.stringify({ kind: 'PREVIEW_OPERATOR_FAILED', code: typeof error.code === 'string' ? error.code : 'OPERATOR_COMMAND_FAILED', detailsSuppressed: true }));
  process.exitCode = 1;
}
