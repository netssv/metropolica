import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { json } from './http.ts';
import type { Handler } from './types.ts';

export const handleStaticFiles: Handler = async (req, res, { rootDir }) => {
  const pathname = new URL(req.url ?? '/', `http://${req.headers.host}`).pathname;
  if (pathname === '/api' || pathname.startsWith('/api/')) return false;
  try {
    const filePath = pathname === '/' || pathname === '/index.html' ? join(rootDir, 'index.html') : join(rootDir, pathname.substring(1));
    const content = await readFile(filePath, pathname === '/' || pathname.endsWith('.html') ? 'utf8' : undefined);
    const contentType = filePath.endsWith('.css') ? 'text/css' : filePath.endsWith('.js') ? 'application/javascript' : filePath.endsWith('.html') ? 'text/html' : 'text/plain';
    res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' }); res.end(content); return true;
  } catch { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Not Found'); return true; }
};
