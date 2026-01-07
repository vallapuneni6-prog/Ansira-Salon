
import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Connection Pool Configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Managed databases usually require SSL. 
  // We disable it for localhost but enable for production.
  ssl: process.env.DATABASE_URL?.includes('localhost') || !process.env.DATABASE_URL 
    ? false 
    : { rejectUnauthorized: false }
});

// Test the connection on startup
pool.connect((err, client, release) => {
  if (err) {
    return console.error('CRITICAL: Error acquiring client from database pool', err.stack);
  }
  console.log('SUCCESS: Connected to Dokploy PostgreSQL database.');
  release();
});

app.use(cors());
app.use(express.json());

// --- Health Check ---
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// --- Auth ---
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      delete user.password; 
      res.json(user);
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Salons ---
app.get('/api/salons', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM salons ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/salons', async (req, res) => {
  const { id, name, address, contact, gst_number, manager_name } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO salons (id, name, address, contact, gst_number, manager_name) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [id, name, address, contact, gst_number, manager_name]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Staff ---
app.get('/api/staff', async (req, res) => {
  const { salonId } = req.query;
  try {
    const query = salonId ? 'SELECT * FROM staff WHERE salon_id = $1' : 'SELECT * FROM staff';
    const params = salonId ? [salonId] : [];
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/staff', async (req, res) => {
  const { id, name, phone, salonId, role, salary, target, joiningDate, status } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO staff (id, name, phone, salon_id, role, salary, target, joining_date, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [id, name, phone, salonId, role, salary, target, joiningDate, status]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Invoices ---
app.get('/api/invoices', async (req, res) => {
  const { salonId } = req.query;
  try {
    const query = salonId ? 'SELECT * FROM invoices WHERE salon_id = $1 ORDER BY date DESC' : 'SELECT * FROM invoices ORDER BY date DESC';
    const params = salonId ? [salonId] : [];
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/invoices', async (req, res) => {
  const { id, salonId, customerName, customerMobile, items, subtotal, discount, gst, total, paymentMode, date } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO invoices (id, salon_id, customer_name, customer_mobile, items, subtotal, discount, gst, total, payment_mode, date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
      [id, salonId, customerName, customerMobile, JSON.stringify(items), subtotal, discount, gst, total, paymentMode, date]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Customers ---
app.get('/api/customers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers', async (req, res) => {
  const { mobile, name } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO customers (mobile, name) VALUES ($1, $2) ON CONFLICT (mobile) DO UPDATE SET name = EXCLUDED.name RETURNING *',
      [mobile, name]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Attendance ---
app.get('/api/attendance', async (req, res) => {
  const { date } = req.query;
  try {
    const result = await pool.query('SELECT * FROM attendance WHERE date = $1', [date]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/attendance', async (req, res) => {
  const { staffId, date, status, checkIn, checkOut } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO attendance (staff_id, date, status, check_in, check_out) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (staff_id, date) DO UPDATE SET status = EXCLUDED.status, check_in = EXCLUDED.check_in, check_out = EXCLUDED.check_out RETURNING *',
      [staffId, date, status, checkIn, checkOut]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Backend service active at http://0.0.0.0:${port}`);
});
