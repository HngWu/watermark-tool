import express from 'express';
import cors from 'cors';
import * as mariadb from 'mariadb';

const app = express();
app.use(cors());
app.use(express.json());

const pool = mariadb.createPool({
  host: 'localhost',
  user: 'user',
  password: 'password',
  database: 'secureasset',
  connectionLimit: 5
});

app.get('/api/health', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    res.json({ status: 'ok', database: 'connected' });
    conn.release();
  } catch (err) {
    res.status(503).json({ status: 'error', message: 'DB Unreachable' });
  }
});

app.listen(3001, () => console.log('Backend running on port 3001'));
