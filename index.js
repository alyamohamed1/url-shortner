// index.js
// ✅ FreeCodeCamp URL Shortener Microservice

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const bodyParser = require('body-parser');
const { URL } = require('url');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false })); // parses form data
app.use('/public', express.static(`${process.cwd()}/public`));

// Root route (serve your index.html directly)
app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/index.html');
});

// FCC test route
app.get('/api/hello', (req, res) => {
  res.json({ greeting: 'hello API' });
});

// In-memory database
let urlDatabase = [];
let nextId = 1;

// POST /api/shorturl
app.post('/api/shorturl', (req, res) => {
  const inputUrl = req.body.url;

  // Check if URL is valid
  let parsed;
  try {
    parsed = new URL(inputUrl);
  } catch (e) {
    return res.json({ error: 'invalid url' });
  }

  // Must start with http:// or https://
  if (!/^https?:\/\//i.test(inputUrl)) {
    return res.json({ error: 'invalid url' });
  }

  // Validate hostname via DNS lookup
  dns.lookup(parsed.hostname, (err) => {
    if (err) return res.json({ error: 'invalid url' });

    // Check if it already exists
    const existing = urlDatabase.find((u) => u.original_url === inputUrl);
    if (existing) return res.json(existing);

    const newEntry = {
      original_url: inputUrl,
      short_url: nextId
    };
    urlDatabase.push(newEntry);
    nextId++;
    res.json(newEntry);
  });
});

// GET /api/shorturl/:short_url
app.get('/api/shorturl/:short_url', (req, res) => {
  const id = parseInt(req.params.short_url);
  const found = urlDatabase.find((u) => u.short_url === id);

  if (!found) return res.json({ error: 'No short URL found for given input' });

  res.redirect(found.original_url);
});

// Start server
app.listen(port, () => console.log(`✅ Server listening on port ${port}`));

