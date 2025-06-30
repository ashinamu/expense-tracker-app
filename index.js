const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const SECRET_KEY = 'your_secret_key'; // Change this for production

// In-memory storage
const users = [];
const expenses = [];

// Middleware to verify JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).send({ message: 'Access denied' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).send({ message: 'Token missing' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).send({ message: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Register
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (users.find(u => u.username === username)) {
    return res.status(400).send({ message: 'User already exists' });
  }
  const hashedPassword = await bcrypt.hash(password, 8);
  users.push({ username, password: hashedPassword });
  res.send({ message: 'User registered successfully' });
});

// Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user) return res.status(400).send({ message: 'User not found' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).send({ message: 'Incorrect password' });

  const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
  res.send({ token });
});

// Add expense
app.post('/expenses', authenticateToken, (req, res) => {
  const { amount, category, date, description } = req.body;
  const expense = {
    id: expenses.length + 1,
    username: req.user.username,
    amount,
    category,
    date,
    description: description || ''
  };
  expenses.push(expense);
  res.send(expense);
});

// Get expenses
app.get('/expenses', authenticateToken, (req, res) => {
  const userExpenses = expenses.filter(e => e.username === req.user.username);
  res.send(userExpenses);
});

// Delete expense
app.delete('/expenses/:id', authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);
  const index = expenses.findIndex(e => e.id === id && e.username === req.user.username);
  if (index === -1) return res.status(404).send({ message: 'Expense not found' });
  expenses.splice(index, 1);
  res.send({ message: 'Expense deleted' });
});

// Update expense - NEW ROUTE
app.put('/expenses/:id', authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);
  const index = expenses.findIndex(e => e.id === id && e.username === req.user.username);
  if (index === -1) return res.status(404).send({ message: 'Expense not found' });

  const { amount, category, date, description } = req.body;
  expenses[index] = {
    ...expenses[index],
    amount,
    category,
    date,
    description: description || ''
  };

  res.send(expenses[index]);
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
