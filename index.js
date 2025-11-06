// index.js
// URL Shortener Microservice

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
const { URL } = require('url');

const app = express();
const port = process.env.PORT || 3000;

// Basic config
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/public', express.static(`${process.cwd()}/public`));

// Serve home page
app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Required FCC hello route
app.get('/api/hello', (req, res) => {
  res.json({ greeting: 'hello API' });
});

// === In-memory URL store ===
let urlDatabase = [];
let counter = 1;

// === POST /api/shorturl ===
app.post('/api/shorturl', (req, res) => {
  const inputUrl = req.body.url;

  // Validate basic URL format
  let parsed;
  try {
    parsed = new URL(inputUrl);
  } catch {
    return res.json({ error: 'invalid url' });
  }

  // Must start with http or https
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return res.json({ error: 'invalid url' });
  }

  // Check domain validity with DNS
  dns.lookup(parsed.hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    // Check if it already exists
    const existing = urlDatabase.find((e) => e.original_url === inputUrl);
    if (existing) return res.json(existing);

    const newEntry = {
      original_url: inputUrl,
      short_url: counter
    };
    urlDatabase.push(newEntry);
    counter++;

    res.json(newEntry);
  });
});

// === GET /api/shorturl/:id ===
app.get('/api/shorturl/:id', (req, res) => {
  const id = Number(req.params.id);
  const record = urlDatabase.find((e) => e.short_url === id);
  if (!record) return res.json({ error: 'No short URL found for given input' });

  res.redirect(record.original_url);
});

// === Start server ===
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});


