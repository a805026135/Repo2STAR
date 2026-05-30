import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb } from './db/schema.js';

import authRoutes from './routes/auth.js';
import repoRoutes from './routes/repos.js';
import analysisRoutes from './routes/analysis.js';
import jobRoutes from './routes/jobs.js';
import exportRoutes from './routes/export.js';
import webhookRoutes from './routes/webhooks.js';
import settingsRoutes from './routes/settings.js';
import { AgentOrchestrator } from './agent/orchestrator.js';
import { SchedulerService } from './services/scheduler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '5mb' }));

// Initialize database then start server
initDb().then(() => {
  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/repos', repoRoutes);
  app.use('/api/analysis', analysisRoutes);
  app.use('/api/jobs', jobRoutes);
  app.use('/api/export', exportRoutes);
  app.use('/api/webhooks', webhookRoutes);
  app.use('/api/settings', settingsRoutes);

  // Start scheduled weekly scanner
  const scheduler = new SchedulerService(new AgentOrchestrator());
  scheduler.start();

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Serve static frontend in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, '../dist/index.html'));
    });
  }

  // Error handler
  app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  app.listen(PORT, () => {
    console.log(`Repo2STAR Agent server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
