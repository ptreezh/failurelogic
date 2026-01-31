const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 8080;

// Middleware to serve the minimal-complete-index.html for root path
app.get('/', (req, res) => {
  const filePath = path.join(__dirname, 'minimal-complete-index.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error sending minimal-complete-index.html:', err);
      res.status(500).send('Internal Server Error');
    }
  });
});

// Middleware to serve minimal-complete-index.html for specific paths
app.get('/minimal', (req, res) => {
  const filePath = path.join(__dirname, 'minimal-complete-index.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error sending minimal-complete-index.html:', err);
      res.status(500).send('Internal Server Error');
    }
  });
});

app.get('/interactive', (req, res) => {
  const filePath = path.join(__dirname, 'minimal-complete-index.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error sending minimal-complete-index.html:', err);
      res.status(500).send('Internal Server Error');
    }
  });
});

// Serve static assets (CSS, JS, images, etc.) from the root directory
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/api', express.static(path.join(__dirname, 'api')));
app.use('/manifest.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'manifest.json'));
});
app.use('/sw.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'sw.js'));
});

// Catch-all route to serve minimal-complete-index.html for SPA functionality
app.get('*', (req, res) => {
  const filePath = path.join(__dirname, 'minimal-complete-index.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error sending minimal-complete-index.html:', err);
      res.status(500).send('Internal Server Error');
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`All paths now serve minimal-complete-index.html for enhanced interactivity`);
});