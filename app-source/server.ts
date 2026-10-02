import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import authRoutes from './server/routes/auth';
import masterRoutes from './server/routes/master';
import ownerRoutes from './server/routes/owner';
import cashierRoutes from './server/routes/cashier';
import posRoutes from './server/routes/pos';
import dbRoutes from './server/routes/database';

dotenv.config();

async function startServer() {
  const app = express();
  // Dev server in AI Studio environment MUST run on port 3000
  const PORT = 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/master', masterRoutes);
  app.use('/api/owner', ownerRoutes);
  app.use('/api/cashier', cashierRoutes);
  app.use('/api/pos', posRoutes);
  app.use('/api/database', dbRoutes);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'RAHAYA COFFEE POS Server',
      timestamp: new Date().toISOString(),
    });
  });

  if (!isProd) {
    // Mount Vite middleware in development mode
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Explicit SPA fallback for all HTML page requests
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      // Skip API routes that 404
      if (url.startsWith('/api')) {
        res.status(404).json({ error: 'Endpoint API tidak ditemukan' });
        return;
      }
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    // Production static files
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[Server Error]:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[RAHAYA COFFEE POS] Server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[RAHAYA COFFEE POS] Failed to start server:', err);
  process.exit(1);
});
