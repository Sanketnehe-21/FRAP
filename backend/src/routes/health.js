import { Router } from 'express';
import { pool } from '../db/pool.js';

const router = Router();

async function handleHealthCheck(req, res) {
  try {
    // Try to run a simple query to verify connection
    await pool.query('SELECT 1');
    res.json({
      status: 'UP',
      database: 'CONNECTED'
    });
  } catch (err) {
    console.error('Database connection test failed in health check:', err.message);
    res.status(500).json({
      status: 'DOWN',
      database: 'DISCONNECTED'
    });
  }
}

router.get('/health', handleHealthCheck);
router.get('/actuator/health', handleHealthCheck);

export default router;
