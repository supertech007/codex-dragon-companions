import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const CODEX = process.env.CODEX_CLI_PATH || '/Applications/ChatGPT.app/Contents/Resources/codex';
const PETS = {
  sol: { displayName: 'Sol', element: 'fire', color: '#ff7449', atlas: join(ROOT, '../work/Cinder-run/final/spritesheet-extended.webp') },
  astra: { displayName: 'Astra', element: 'thunder', color: '#6de8ff', atlas: join(ROOT, '../work/Tempest-run/final/spritesheet-extended.webp') },
  luna: { displayName: 'Luna', element: 'ice', color: '#a8dfff', atlas: join(ROOT, '../work/Rime-run/final/spritesheet-extended.webp') },
};
const REFRESH_MS = 15 * 60 * 1000;

let usage = { primary: null, secondary: null, updatedAt: null, error: 'Connecting to Codex usage…' };
let requestId = 0;
let inputBuffer = '';
const pending = new Map();
const appServer = spawn(CODEX, ['app-server', '--stdio'], { stdio: ['pipe', 'pipe', 'ignore'] });

function writeRpc(message) {
  if (appServer.exitCode !== null) throw new Error('Codex app-server is not running.');
  appServer.stdin.write(`${JSON.stringify(message)}\n`);
}

function rpc(method, params = {}) {
  const id = ++requestId;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Codex app-server timed out during ${method}.`));
    }, 20_000);
    pending.set(id, { resolve, reject, timeout });
    try {
      writeRpc({ method, id, params });
    } catch (error) {
      clearTimeout(timeout);
      pending.delete(id);
      reject(error);
    }
  });
}

appServer.stdout.setEncoding('utf8');
appServer.stdout.on('data', (chunk) => {
  inputBuffer += chunk;
  for (;;) {
    const newline = inputBuffer.indexOf('\n');
    if (newline < 0) break;
    const line = inputBuffer.slice(0, newline).trim();
    inputBuffer = inputBuffer.slice(newline + 1);
    if (!line) continue;
    try {
      const message = JSON.parse(line);
      if (!pending.has(message.id)) continue;
      const request = pending.get(message.id);
      pending.delete(message.id);
      clearTimeout(request.timeout);
      if (message.error) request.reject(new Error(message.error.message || 'Codex usage request failed.'));
      else request.resolve(message.result);
    } catch {
      // Ignore app-server notifications and non-JSON diagnostic lines.
    }
  }
});

appServer.on('error', (error) => {
  usage = { ...usage, error: `Could not start Codex app-server: ${error.message}` };
});
appServer.on('exit', (code) => {
  const message = `Codex app-server exited${code == null ? '' : ` (${code})`}. Restart this companion to reconnect.`;
  usage = { ...usage, error: message };
  for (const request of pending.values()) {
    clearTimeout(request.timeout);
    request.reject(new Error(message));
  }
  pending.clear();
});

const clamp = (value) => Math.max(0, Math.min(100, Math.round(value)));

async function refreshUsage() {
  try {
    const result = await rpc('account/rateLimits/read');
    const limits = result?.rateLimitsByLimitId?.codex ?? result?.rateLimits;
    if (!limits || !Number.isFinite(limits.primary?.usedPercent) || !Number.isFinite(limits.secondary?.usedPercent)) {
      throw new Error('Codex returned no five-hour or weekly usage reading.');
    }
    usage = {
      primary: clamp(100 - limits.primary.usedPercent),
      secondary: clamp(100 - limits.secondary.usedPercent),
      updatedAt: new Date().toISOString(),
      error: null,
    };
    console.log(`Usage refreshed: 5h ${usage.primary}% remaining; weekly ${usage.secondary}% remaining.`);
  } catch (error) {
    usage = { ...usage, error: error.message };
    console.error(error.message);
  }
}

async function initialize() {
  await rpc('initialize', { clientInfo: { name: 'live-dragon-companion', version: '1.0.0' } });
  writeRpc({ method: 'initialized' });
  await refreshUsage();
  setInterval(refreshUsage, REFRESH_MS);
}

const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.webp': 'image/webp' };
const server = createServer(async (request, response) => {
  const url = new URL(request.url || '/', 'http://127.0.0.1');
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');

  if (url.pathname === '/api/usage') {
    response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({ ...usage, refreshIntervalMs: REFRESH_MS }));
    return;
  }

  if (url.pathname === '/api/refresh' && request.method === 'POST') {
    await refreshUsage();
    response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({ ...usage, refreshIntervalMs: REFRESH_MS }));
    return;
  }

  if (url.pathname.startsWith('/pets/')) {
    const petId = url.pathname.slice('/pets/'.length);
    const pet = PETS[petId];
    if (pet) {
      try {
        const bytes = await readFile(pet.atlas);
        response.writeHead(200, { 'Content-Type': 'image/webp' });
        response.end(bytes);
      } catch {
        response.writeHead(404).end('Pet atlas not found.');
      }
      return;
    }
  }

  const requested = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
  const safePath = normalize(requested).replace(/^([/\\]|\.\.(?:[/\\]|$))+/, '');
  if (safePath.includes('..')) {
    response.writeHead(400).end('Bad path.');
    return;
  }
  try {
    const body = await readFile(join(ROOT, 'public', safePath));
    response.writeHead(200, { 'Content-Type': mime[extname(safePath)] || 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(404).end('Not found.');
  }
});

server.listen(4173, '127.0.0.1', () => {
  console.log('Live dragon companion: http://127.0.0.1:4173');
  initialize().catch((error) => {
    usage = { ...usage, error: error.message };
    console.error(error.message);
  });
});

function shutdown() {
  server.close();
  appServer.kill();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
