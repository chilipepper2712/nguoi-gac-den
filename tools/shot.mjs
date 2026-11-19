// Chụp màn hình game bằng Chromium headless (WebGL qua SwiftShader).
// Dùng để kiểm tra hình sau khi sửa phần render. Báo lỗi nếu console có lỗi.
//
//   node tools/shot.mjs                       → shots/shot.png, 1280x800
//   node tools/shot.mjs --size 390x844        → khung điện thoại dọc
//   node tools/shot.mjs --query "seed=3" --out shots/a.png --scale 2
//
// Cần Playwright: trong môi trường cloud đã cài sẵn; máy cá nhân thì `npm i -D playwright`.

import { createRequire } from 'node:module';
import http from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const ROOT = normalize(join(dirname(fileURLToPath(import.meta.url)), '..'));
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.svg': 'image/svg+xml',
};

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
}

const out = arg('out', 'shots/shot.png');
const [w, h] = arg('size', '1280x800').split('x').map(Number);
const query = arg('query', '');
const scale = Number(arg('scale', '1'));
const wait = Number(arg('wait', '500'));

const server = http.createServer(async (req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = normalize(join(ROOT, urlPath === '/' ? 'index.html' : urlPath));
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: scale });
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`http://127.0.0.1:${port}/${query ? `?${query}` : ''}`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
  await page.waitForTimeout(wait);
  await mkdir(dirname(join(ROOT, out)), { recursive: true });
  await page.screenshot({ path: join(ROOT, out) });
  console.log(`Đã chụp: ${out} (${w}x${h} @${scale}x)`);
} catch (e) {
  errors.push(String(e));
} finally {
  await browser.close();
  server.close();
}

if (errors.length) {
  console.error('Lỗi:\n' + errors.join('\n'));
  process.exit(1);
}
