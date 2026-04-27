import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3307,
  user: process.env.DB_USER || 'user',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'secureasset',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

const initializeDatabase = async () => {
  try {
    const conn = await pool.getConnection();
    
    // Ensure templates table exists
    await conn.query(`
      CREATE TABLE IF NOT EXISTS templates (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255),
        config JSON,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Ensure settings table exists
    await conn.query(`
      CREATE TABLE IF NOT EXISTS settings (
        setting_key VARCHAR(50) PRIMARY KEY,
        value JSON,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log('Database schema verified successfully.');
    conn.release();
  } catch (error) {
    console.error('Failed to initialize database schema:', error);
  }
};

app.get('/api/health', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    res.json({ status: 'ok', database: 'connected' });
    conn.release();
  } catch (err) {
    console.error('DB Error:', err);
    res.status(503).json({ status: 'error', message: 'DB Unreachable' });
  }
});

app.post('/api/sync', async (req, res) => {
  try {
    const { templates, settings, timestamp } = req.body;
    const conn = await pool.getConnection();
    
    if (templates && Array.isArray(templates)) {
      for (const t of templates) {
        await conn.query(
          'INSERT INTO templates (id, name, config, updated_at) VALUES (?, ?, ?, FROM_UNIXTIME(? * 0.001)) ON DUPLICATE KEY UPDATE name=VALUES(name), config=VALUES(config), updated_at=VALUES(updated_at)',
          [t.id, t.name, JSON.stringify(t.config), timestamp]
        );
      }
    }
    
    if (settings) {
      for (const [key, value] of Object.entries(settings)) {
        await conn.query(
          'INSERT INTO settings (setting_key, value, updated_at) VALUES (?, ?, FROM_UNIXTIME(? * 0.001)) ON DUPLICATE KEY UPDATE value=VALUES(value), updated_at=VALUES(updated_at)',
          [key, JSON.stringify(value), timestamp]
        );
      }
    }
    
    conn.release();
    res.json({ status: 'ok', synced: true });
  } catch (err) {
    console.error('Sync error:', err);
    res.status(500).json({ status: 'error', message: 'Sync failed' });
  }
});

// Initialize database on startup
initializeDatabase();

if (process.env.NODE_ENV !== 'production') {
  app.listen(3001, () => console.log('Backend running on port 3001'));
}

export default app;
