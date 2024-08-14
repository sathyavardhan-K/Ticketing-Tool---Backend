  const express = require('express');
  const bodyParser = require('body-parser');
  const fs = require('fs');
  const path = require('path');
  const validator = require('validator');
  const cors = require('cors');
  const teamRoutes = require('./routes/team'); // Ensure this path is correct
  const ticketRoutes = require('./routes/ticket'); 


  const app = express();
  const port = 5000;

  // Middleware
  app.use(cors());
  app.use(bodyParser.json());

  // File paths
  const dataFilePath = path.join(__dirname, 'data.json');

  // Helper functions
  function readData() {
    if (!fs.existsSync(dataFilePath)) {
      const initialData = { users: [], teams: [], tickets: [] };
      fs.writeFileSync(dataFilePath, JSON.stringify(initialData, null, 2));
      return initialData;
    }

    const rawData = fs.readFileSync(dataFilePath, 'utf-8');
    if (!rawData) {
      return { users: [], teams: [], tickets: [] };
    }

    return JSON.parse(rawData);
  }

  function writeData(data) {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
  }

  // Routes
  app.post('/signup', (req, res) => {
    const { email, username, password } = req.body;

    // Validation
    if (!email || !validator.isEmail(email)) return res.status(400).json({ message: 'Invalid email' });
    if (!username || username.length < 3) return res.status(400).json({ message: 'Username must be at least 3 characters long' });
    if (!password || password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters long' });

    const data = readData();
    if (data.users.some(user => user.email === email || user.username === username)) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Add the new user
    data.users.push({ email, username, password });
    writeData(data);
    res.status(201).json({ message: 'User registered successfully' });
  });

  app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const data = readData();
    const user = data.users.find(user => user.username === username && user.password === password);

    if (user) {
      res.status(200).json({ message: 'Login successful' });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  });

  // Use team routes
  app.use('/api/teams', teamRoutes); 

  app.use('/api/tickets',ticketRoutes);

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
