import express, { type Express } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import { authRouter } from './routes/auth.js';
import { catalogRouter } from './routes/catalog.js';
import { shopRouter } from './routes/shop.js';
import { accountRouter } from './routes/account.js';
import { adminRouter } from './routes/admin.js';
import { instructorRouter } from './routes/instructor.js';
import { findingsRouter } from './routes/findings.js';
import { buildLabsRouter } from './labs/index.js';

export function createApp(): Express {
  const app = express();
  app.disable('x-powered-by');

  // Security headers for the TRUSTED surfaces (labs set their own below).
  app.use((req, res, next) => {
    if (!req.path.startsWith('/labs')) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('Referrer-Policy', 'no-referrer');
    }
    next();
  });

  app.use(cors({ origin: config.storefrontOrigin, credentials: true }));
  app.use(express.json({ limit: '256kb' })); // request size limit
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => res.json({ status: 'ok', labsEnabled: config.labsEnabled }));

  // Trusted platform routers (auth/authz enforced inside each).
  app.use('/api/auth', authRouter);
  app.use('/api/catalog', catalogRouter);
  app.use('/api/shop', shopRouter);
  app.use('/api/account', accountRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/instructor', instructorRouter);
  app.use('/api/findings', findingsRouter);

  // Intentionally vulnerable training labs (isolated, synthetic data only).
  app.use('/labs', buildLabsRouter());

  app.use((req, res) => res.status(404).json({ error: 'Not found', path: req.path }));

  // Global error handler — generic message on trusted surfaces.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = Number(err?.status ?? err?.statusCode ?? 500);
    if (status === 413) return res.status(413).json({ error: 'Request entity too large' });
    if (status >= 400 && status < 500) return res.status(status).json({ error: err?.message ?? 'Bad request' });
    console.error('[error]', err?.message ?? err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
