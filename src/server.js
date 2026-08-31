import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import healthRoutes from './routes/healthRoutes.js';
import transactionsRoutes from './routes/transactions.js';
import recoveryRoutes from './routes/recovery.js';
import analyticsRoutes from './routes/analytics.js';
import auditRoutes from './routes/audit.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all origins for hackathon demo
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Serve static frontend dashboard assets from /public
app.use(express.static(path.join(__dirname, '../public')));

// Request logging middleware (method + path + timestamp)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check endpoints
app.use('/api', healthRoutes);  // GET /api/health

// API Routes mounted under /api prefix
const apiRouter = express.Router();
apiRouter.use('/transactions', transactionsRoutes);
apiRouter.use('/recovery-actions', recoveryRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/audit', auditRoutes);

app.use('/api', apiRouter);

// Fallback to index.html for frontend SPA routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Recovery Engine Server running on port ${PORT}`);
  console.log(`💻 Merchant Dashboard hosted at http://localhost:${PORT}`);
});
