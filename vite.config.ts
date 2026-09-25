import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

function apiFallbackPlugin(): Plugin {
  return {
    name: 'api-fallback',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (
          req.url?.startsWith('/api/servers') ||
          (req.method === 'POST' && (req.url === '/api/ask' || req.url === '/api/plan'))
        ) {
          try {
            let handler: any;
            if (req.url?.startsWith('/api/servers')) {
              const module = await import('./api/servers.js');
              handler = module.default;
            } else if (req.url === '/api/ask') {
              const module = await import('./api/ask.js');
              handler = module.default;
            } else {
              const module = await import('./api/plan.js');
              handler = module.default;
            }

            let bodyText = '';
            req.on('data', (chunk) => {
              bodyText += chunk;
            });

            req.on('end', async () => {
              try {
                (req as any).body = bodyText ? JSON.parse(bodyText) : {};
              } catch {
                (req as any).body = {};
              }

              // Parse query parameters
              const parsedUrl = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
              (req as any).query = Object.fromEntries(parsedUrl.searchParams.entries());

              const customRes: any = res;
              customRes.status = (code: number) => {
                res.statusCode = code;
                return customRes;
              };
              customRes.json = (data: any) => {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
                return customRes;
              };

              try {
                await handler(req, customRes);
              } catch (handlerErr: any) {
                if (!res.headersSent) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: handlerErr.message }));
                }
              }
            });
            return;
          } catch (e: any) {
            if (!res.headersSent) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: e.message }));
            }
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiFallbackPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || '.', '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

