import assert from 'node:assert/strict';
import http from 'node:http';

// Direct loopback requests also work in environments with a global HTTP proxy.
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const request = http.request(url, options, response => {
      response.resume();
      response.on('end', () => resolve({status: response.statusCode, ok: response.statusCode === 200}));
    });
    request.on('error', reject);
    request.setTimeout(3000, () => request.destroy(new Error('Request timed out')));
    request.end(options.body);
  });
}
import {spawn} from 'node:child_process';
import {readFile, unlink} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';

const port = 3187;
const url = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', String(port), '--hostname', '127.0.0.1'], {stdio: 'pipe'});
let output = '';
server.stdout.on('data', chunk => { output += chunk; process.stdout.write(chunk); });
server.stderr.on('data', chunk => { output += chunk; process.stdout.write(chunk); });
const reports = [];
const make = () => ({id: crypto.randomUUID(), category: 'Assédio', region: 'Centro', period: 'Não sei informar', month: new Date().toISOString().slice(0, 7), consent: true});
const post = (body, headers = {}) => fetch(`${url}/api/relatos`, {method: 'POST', headers: {'Content-Type': 'application/json', ...headers}, body: typeof body === 'string' ? body : JSON.stringify(body)});
try {
  let ready = false;
  for (let attempt = 0; attempt < 50; attempt++) {
    try { if ((await fetch(url)).ok) { ready = true; break; } } catch {}
    if (server.exitCode !== null) throw new Error(output);
    await delay(200);
  }
  assert(ready, output || 'Servidor não iniciou');
  for (const input of ['{', 'null', {...make(), month: '9999-01'}, {...make(), consent: false}, {...make(), id: '../../bad'}, {...make(), extra: 1}]) {
    assert.equal((await post(input)).status, 400);
  }
  assert.equal((await post('x'.repeat(1600))).status, 413);
  assert.equal((await post(make(), {Origin: 'https://example.com'})).status, 403);
  reports.push(...Array.from({length: 20}, make));
  const results = await Promise.all(reports.map(report => post(report)));
  assert(results.every(result => result.status === 201));
  const retries = await Promise.all(Array.from({length: 5}, () => post(reports[0])));
  assert(retries.every(result => result.status === 201));
  for (const report of reports) {
    const stored = JSON.parse(await readFile(`data/reports/${report.id}.json`, 'utf8'));
    const expected = {...report};
    delete expected.consent;
    assert.deepEqual(stored, {...expected, status: 'pending'});
  }
  console.log('PASS: validação, consentimento, mês, origem, limite de tamanho, 20 envios simultâneos e reenvio idempotente.');
} finally {
  server.kill('SIGTERM');
  await Promise.all(reports.map(report => unlink(`data/reports/${report.id}.json`).catch(() => {})));
}
