import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement
);

const API_URL = 'http://localhost:4000'; // Change if backend URL differs

function App() {
  // Separate states for login and expenses form
  const [token, setToken] = useState('');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    category: '',
    date: '',
    description: ''
  });

  const [expenses, setExpenses] = useState([]);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);

  // Login or Register user
  const authUser = async (isLogin) => {
    setError('');
    try {
      const url = isLogin ? '/login' : '/register';
      const res = await axios.post(API_URL + url, {
        username: loginForm.username,
        password: loginForm.password
      });
      if (isLogin) {
        setToken(res.data.token);
      } else {
        alert('Registration successful! Please login.');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.response?.data?.message || 'Error occurred');
    }
  };

  // Fetch expenses for logged-in user
  const fetchExpenses = async () => {
    try {
      const res = await axios.get(API_URL + '/expenses', {
        headers: { Authorization: 'Bearer ' + token }
      });
      setExpenses(res.data);
    } catch (err) {
      console.error('Fetch expenses error:', err);
      setError('Failed to fetch expenses');
    }
  };

  useEffect(() => {
    if (token) {
      fetchExpenses();
    } else {
      setExpenses([]);
      setEditingId(null);
      setExpenseForm({
        amount: '',
        category: '',
        date: '',
        description: ''
      });
    }
  }, [token]);

  // Add new expense
  const addExpense = async () => {
    if (!expenseForm.amount || !expenseForm.category || !expenseForm.date) {
      setError('Please fill amount, category, and date');
      return;
    }
    try {
      await axios.post(
        API_URL + '/expenses',
        {
          amount: Number(expenseForm.amount),
          category: expenseForm.category,
          date: expenseForm.date,
          description: expenseForm.description
        },
        { headers: { Authorization: 'Bearer ' + token } }
      );
      await fetchExpenses(); // Await to ensure UI updates correctly
      setExpenseForm({
        amount: '',
        category: '',
        date: '',
        description: ''
      });
      setError('');
    } catch (err) {
      console.error('Add expense error:', err);
      setError(err.response?.data?.message || 'Failed to add expense');
    }
  };

  // Delete expense
  const deleteExpense = async (id) => {
    try {
      await axios.delete(API_URL + '/expenses/' + id, {
        headers: { Authorization: 'Bearer ' + token }
      });
      await fetchExpenses();
    } catch (err) {
      console.error('Delete expense error:', err);
      setError('Failed to delete expense');
    }
  };

  // Update expense
  const updateExpense = async (id) => {
    if (!expenseForm.amount || !expenseForm.category || !expenseForm.date) {
      setError('Please fill amount, category, and date');
      return;
    }
    try {
      await axios.put(
        API_URL + '/expenses/' + id,
        {
          amount: Number(expenseForm.amount),
          category: expenseForm.category,
          date: expenseForm.date,
          description: expenseForm.description
        },
        { headers: { Authorization: 'Bearer ' + token } }
      );
      setEditingId(null);
      setExpenseForm({
        amount: '',
        category: '',
        date: '',
        description: ''
      });
      await fetchExpenses();
      setError('');
    } catch (err) {
      console.error('Update expense error:', err);
      setError(err.response?.data?.message || 'Failed to update expense');
    }
  };

  // Prepare data for charts
  const categoryTotals = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  const pieData = {
    labels: Object.keys(categoryTotals),
    datasets: [
      {
        data: Object.values(categoryTotals),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#66BB6A',
          '#BA68C8',
          '#FFA726'
        ],
        hoverOffset: 4
      }
    ]
  };

  const monthlyTotals = expenses.reduce((acc, e) => {
    const month = e.date.substring(0, 7);
    acc[month] = (acc[month] || 0) + e.amount;
    return acc;
  }, {});

  const lineData = {
    labels: Object.keys(monthlyTotals).sort(),
    datasets: [
      {
        label: 'Monthly Spending',
        data: Object.keys(monthlyTotals)
          .sort()
          .map((m) => monthlyTotals[m]),
        fill: false,
        borderColor: '#36A2EB',
        tension: 0.1
      }
    ]
  };

  // If not logged in, show login/register form
  if (!token) {
    return (
      <div style={{ maxWidth: 400, margin: 'auto', paddingTop: 50 }}>
        <h2>Expense Tracker</h2>
        <input
          placeholder="Username"
          value={loginForm.username}
          onChange={(e) =>
            setLoginForm({ ...loginForm, username: e.target.value })
          }
        />
        <br />
        <input
          type="password"
          placeholder="Password"
          value={loginForm.password}
          onChange={(e) =>
            setLoginForm({ ...loginForm, password: e.target.value })
          }
        />
        <br />
        <button onClick={() => authUser(true)}>Login</button>
        <button onClick={() => authUser(false)}>Register</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: 'auto', paddingTop: 20 }}>
      <h2>Welcome, {loginForm.username}!</h2>
      <div>
        <input
          placeholder="Amount"
          type="number"
          value={expenseForm.amount}
          onChange={(e) =>
            setExpenseForm({ ...expenseForm, amount: e.target.value })
          }
          style={{ marginRight: 10 }}
        />
        <input
          placeholder="Category"
          value={expenseForm.category}
          onChange={(e) =>
            setExpenseForm({ ...expenseForm, category: e.target.value })
          }
          style={{ marginRight: 10 }}
        />
        <input
          placeholder="Date (YYYY-MM-DD)"
          type="date"
          value={expenseForm.date}
          onChange={(e) =>
            setExpenseForm({ ...expenseForm, date: e.target.value })
          }
          style={{ marginRight: 10 }}
        />
        <input
          placeholder="Description"
          value={expenseForm.description}
          onChange={(e) =>
            setExpenseForm({ ...expenseForm, description: e.target.value })
          }
          style={{ marginRight: 10 }}
        />
        {!editingId && <button onClick={addExpense}>Add</button>}
      </div>

      <table
        width="100%"
        border="1"
        cellPadding="5"
        style={{ marginTop: 20 }}
      >
        <thead>
          <tr>
            <th>Amount</th>
            <th>Category</th>
            <th>Date</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((e) => {
            const id = e.id || e._id; // Support both
            return editingId === id ? (
              <tr key={id}>
                <td>
                  <input
                    type="number"
                    value={expenseForm.amount}
                    onChange={(ev) =>
                      setExpenseForm({ ...expenseForm, amount: ev.target.value })
                    }
                  />
                </td>
                <td>
                  <input
                    value={expenseForm.category}
                    onChange={(ev) =>
                      setExpenseForm({ ...expenseForm, category: ev.target.value })
                    }
                  />
                </td>
                <td>
                  <input
                    type="date"
                    value={expenseForm.date}
                    onChange={(ev) =>
                      setExpenseForm({ ...expenseForm, date: ev.target.value })
                    }
                  />
                </td>
                <td>
                  <input
                    value={expenseForm.description}
                    onChange={(ev) =>
                      setExpenseForm({ ...expenseForm, description: ev.target.value })
                    }
                  />
                </td>
                <td>
                  <button onClick={() => updateExpense(id)}>Save</button>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setExpenseForm({
                        amount: '',
                        category: '',
                        date: '',
                        description: ''
                      });
                      setError('');
                    }}
                  >
                    Cancel
                  </button>
                </td>
              </tr>
            ) : (
              <tr key={id}>
                <td>${e.amount}</td>
                <td>{e.category}</td>
                <td>{e.date}</td>
                <td>{e.description}</td>
                <td>
                  <button
                    onClick={() => {
                      setEditingId(id);
                      setExpenseForm({
                        amount: e.amount,
                        category: e.category,
                        date: e.date,
                        description: e.description
                      });
                      setError('');
                    }}
                  >
                    Edit
                  </button>
                  <button onClick={() => deleteExpense(id)}>Delete</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h3>Spending by Category</h3>
      <Pie data={pieData} />

      <h3>Monthly Spending</h3>
      <Line data={lineData} />

      <button
        style={{ marginTop: 20 }}
        onClick={() => {
          setToken('');
          setLoginForm({ username: '', password: '' });
          setExpenseForm({ amount: '', category: '', date: '', description: '' });
          setExpenses([]);
          setEditingId(null);
          setError('');
        }}
      >
        Logout
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default App;
