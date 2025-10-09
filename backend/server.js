require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
// const app = express();

app.use(cors());
app.use(express.json());

// College Registration Endpoint
app.post('/api/colleges/register', async (req, res) => {
  try {
    const {
      name, code, address, city, state, pincode,
      email, phone, principal_name,
      college_type, category, aided, password
    } = req.body;

    // Basic validation (expand as needed)
    if (!name || !code || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert to DB
    const result = await pool.query(
      `INSERT INTO colleges (name, code, address, city, state, pincode, email, phone, principal_name, college_type, category, aided, password_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id,name,email,code`,
      [name, code, address, city, state, pincode, email, phone, principal_name, college_type, category, aided, password_hash]
    );
    res.status(201).json({ message: "College Registered", college: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') { // unique_violation
      res.status(409).json({ error: 'College code or email already exists.' });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



//simple message after clicking on backend link
app.get('/', (req, res) => {
  res.send('EduPredict API is running.');
});


const cors = require("cors");
app.use(cors({ origin: "https://edu-predict-sih.vercel.app" }));
