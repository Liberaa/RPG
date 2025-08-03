// server.js - Simple Express server
const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files from public directory
app.use(express.static('public'));

// Log requests for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.listen(port, () => {
  console.log(`Game server running at http://localhost:${port}`);
  console.log(`Serving files from: ${path.join(__dirname, 'public')}`);
});