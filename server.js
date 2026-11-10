const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const ROOT = __dirname;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.csv': 'text/csv; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const ALLOWED_PUBLIC_FILES = new Set([
    '/index.html',
    '/style.css',
    '/estoque.js',
    '/supabase-config.js',
    '/favicon.ico'
]);

const SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Cache-Control': 'no-store, no-cache, must-revalidate'
};

const server = http.createServer((req, res) => {
    const cleanUrl = (req.url || '/').split('?')[0];
    const relPath = cleanUrl === '/' ? '/index.html' : cleanUrl;

    if (!ALLOWED_PUBLIC_FILES.has(relPath)) {
        res.writeHead(403, { ...SECURITY_HEADERS, 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Acesso negado: recurso protegido.');
        return;
    }

    const filePath = path.join(ROOT, path.normalize(relPath));

    if (!filePath.startsWith(ROOT)) {
        res.writeHead(403, SECURITY_HEADERS);
        res.end('Forbidden');
        return;
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { ...SECURITY_HEADERS, 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Arquivo não encontrado');
            return;
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
            ...SECURITY_HEADERS,
            'Content-Type': MIME_TYPES[ext] || 'application/octet-stream'
        });
        res.end(data);
    });
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`Servidor local ativo em: http://localhost:${PORT}`);
});

