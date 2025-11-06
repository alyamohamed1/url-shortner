// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
const { URL } = require('url');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));

// Root route
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// In-memory URL storage
let urls = [];
let counter = 1;

// POST: create short URL
app.post('/api/shorturl', (req, res) => {
  const inputUrl = req.body.url;

  // Validate URL format
  let parsedUrl;
  try {
    parsedUrl = new URL(inputUrl);
  } catch (err) {
    return res.json({ error: 'invalid url' });
  }

  // Ensure http/https
  if (!/^https?:\/\//i.test(inputUrl)) {
    return res.json({ error: 'invalid url' });
  }

  // Verify hostname with DNS lookup
  dns.lookup(parsedUrl.hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    // Check for existing URL
    const existing = urls.find((u) => u.original_url === inputUrl);
    if (existing) return res.json(existing);

    const newUrl = {
      original_url: inputUrl,
      short_url: counter,
    };
    urls.push(newUrl);
    counter++;

    res.json(newUrl);
  });
});

// GET: redirect short URL
app.get('/api/shorturl/:short_url', (req, res) => {
  const id = parseInt(req.params.short_url);
  const record = urls.find((u) => u.short_url === id);

  if (!record) {
    return res.json({ error: 'No short URL found for the given input' });
  }

  res.redirect(record.original_url);
});

// Start server
app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
