const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');

const app = express();
const port = 3000;

// PostgreSQL connection pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'crm',
  password: '123',
  port: 5432
});

console.log('Connecting to PostgreSQL database...');

pool.connect()
  .then(() => {
    console.log('Connected to PostgreSQL database');
  })
  .catch((err) => {
    console.error('Error connecting to PostgreSQL database:', err);
  });

app.use(bodyParser.json());

// CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'umair.ciitatd@gmail.com', // Replace with your Gmail address
    pass: 'rwpf qqww rcha rzen' // Use the generated App Password here
  },
  tls: {
    rejectUnauthorized: false // Disable SSL certificate verification
  }
});

// Handle POST requests to /api/orders
app.post('/api/orders', async (req, res) => {
  const { name, phone, gender, category, size, productCode, color, quantity, address } = req.body;

  console.log('Received order:', req.body);

  try {
    const query = 'INSERT INTO orders (name, phone, gender, category, size, product_code, color, quantity, address) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *';
    const values = [name, phone, gender, category, size, productCode, color, quantity, address];

    const result = await pool.query(query, values);

    console.log('Order saved:', result.rows[0]);

    // Send email with order details
    const mailOptions = {
      from: 'umair.ciitatd@gmail.com', // Use your Gmail address for both 'from' and 'to'
      to: 'umair.ciitatd@gmail.com',
      subject: 'New Order Received',
      text: `
        Order Details:
        Name: ${name}
        Phone: ${phone}
        Gender: ${gender}
        Category: ${category}
        Size: ${size}
        Product Code: ${productCode}
        Color: ${color}
        Quantity: ${quantity}
        Address: ${address}
      `
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error saving order:', error);
    res.status(500).json({ error: 'An error occurred while saving the order' });
  }
});

// Handle POST requests to /api/contact
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;

  console.log('Received contact form submission:', req.body);

  try {
    const query = 'INSERT INTO contact_submissions (name, email, message) VALUES ($1, $2, $3) RETURNING *';
    const values = [name, email, message];

    const result = await pool.query(query, values);

    console.log('Contact form submission saved:', result.rows[0]);

    // Send email notification about contact form submission
    const mailOptions = {
      from: 'umair.ciitatd@gmail.com', // Use your Gmail address for both 'from' and 'to'
      to: 'umair.ciitatd@gmail.com',
      subject: 'New Contact Form Submission',
      text: `
        Contact Form Submission Details:
        Name: ${name}
        Email: ${email}
        Message: ${message}
      `
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email notification for contact form submission:', error);
      } else {
        console.log('Email notification sent for contact form submission:', info.response);
      }
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error saving contact form submission:', error);
    res.status(500).json({ error: 'An error occurred while saving the contact form submission' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});