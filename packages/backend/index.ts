import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3307,
  user: 'user',
  password: 'password',
  database: 'secureasset',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

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

app.listen(3001, () => console.log('Backend running on port 3001'));
