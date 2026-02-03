const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Postgres connection with retry logic
let pool;

function createPool() {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('railway.app') 
      ? { rejectUnauthorized: false } 
      : false,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000
  });
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize database with retry
async function initDB(retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      pool = createPool();
      const client = await pool.connect();
      await client.query(`
        CREATE TABLE IF NOT EXISTS patterns (
          id TEXT PRIMARY KEY,
          params JSONB NOT NULL,
          timestamp BIGINT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_timestamp ON patterns(timestamp DESC);
      `);
      client.release();
      console.log('Database initialized successfully');
      return;
    } catch (err) {
      console.log(`Database connection attempt ${i + 1} failed:`, err.message);
      if (i < retries - 1) {
        console.log(`Retrying in ${(i + 1) * 2} seconds...`);
        await new Promise(resolve => setTimeout(resolve, (i + 1) * 2000));
      } else {
        throw err;
      }
    }
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Get all patterns
app.get('/api/patterns', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, params, timestamp FROM patterns ORDER BY timestamp DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching patterns:', err);
    res.status(500).json({ error: 'Failed to fetch patterns' });
  }
});

// Save pattern
app.post('/api/patterns', async (req, res) => {
  const { params, timestamp } = req.body;
  
  if (!params || !timestamp) {
    return res.status(400).json({ error: 'Missing params or timestamp' });
  }
  
  try {
    const id = uuidv4();
    await pool.query(
      'INSERT INTO patterns (id, params, timestamp) VALUES ($1, $2, $3)',
      [id, JSON.stringify(params), timestamp]
    );
    res.json({ id, params, timestamp });
  } catch (err) {
    console.error('Error saving pattern:', err);
    res.status(500).json({ error: 'Failed to save pattern' });
  }
});

// Delete pattern
app.delete('/api/patterns/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM patterns WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Pattern not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting pattern:', err);
    res.status(500).json({ error: 'Failed to delete pattern' });
  }
});

// Clear all patterns
app.delete('/api/patterns', async (req, res) => {
  try {
    await pool.query('DELETE FROM patterns');
    res.json({ success: true });
  } catch (err) {
    console.error('Error clearing patterns:', err);
    res.status(500).json({ error: 'Failed to clear patterns' });
  }
});

// Serve the HTML file
app.get('/', (req, res) => {
  const htmlPath = path.join(__dirname, 'pattern-generator.html');
  if (fs.existsSync(htmlPath)) {
    res.sendFile(htmlPath);
  } else {
    res.status(404).send('pattern-generator.html not found');
  }
});

// Start server first, then initialize DB
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Initialize DB after server is listening
  initDB().catch(err => {
    console.error('Failed to initialize database after retries:', err);
    console.log('Server will continue running, but database features will be unavailable');
  });
});
