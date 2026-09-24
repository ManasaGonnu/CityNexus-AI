/**
 * UrbanPulse AI - Standalone Backend Server (Node.js/Express)
 * Can be run independently with: node backend/server.js
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { issuesRouter } from './routes/issues.js';

dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT || process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

app.use('/api', issuesRouter);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    backend: 'UrbanPulse AI Backend Service',
    timestamp: new Date().toISOString(),
  });
});

if (process.env.NODE_ENV !== 'test' && !process.env.VITE_EMBEDDED) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`UrbanPulse AI Backend running on port ${PORT}`);
  });
}

export default app;
