const express = require('express');
const path = require('path');
const app = express();
const PORT = 8080;

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Route to serve index.html for all routes (for SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'minimal-complete-index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Serving minimal-complete-index.html as the main page`);
});