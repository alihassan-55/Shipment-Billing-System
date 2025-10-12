import { Router } from 'express';
import { assertDatabaseConnection } from '../db/sequelize.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  try {
    await assertDatabaseConnection();
    res.json({ status: 'healthy', db: 'ok', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: 'unhealthy', db: 'error', error: 'DB connection failed' });
  }
});
