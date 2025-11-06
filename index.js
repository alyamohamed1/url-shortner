// URL Shortener Microservice

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
const { URL } = require('url');

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/public', express.static(`${process.cwd()}/public`));

// Home page
app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// FCC hello endpoint (keep it)
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

// In-memory "database" for URLs
let urlStore = [];
let nextId = 1;

// POST /api/shorturl  -> create / return a short URL
app.post('/api/shorturl', function (req, res) {
  const inputUrl = req.body.url;

  // Basic URL format + protocol check
  let parsed;
  try {
    parsed = new URL(inputUrl);
  } catch (e) {
    return res.json({ error: 'invalid url' });
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return res.json({ error: 'invalid url' });
  }

  // Verify host exists using DNS
  dns.lookup(parsed.hostname, function (err) {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    // If we've already shortened this URL, reuse it
    const existing = urlStore.find((entry) => entry.original_url === inputUrl);
    if (existing) {
      return res.json(existing);
    }

    const record = {
      original_url: inputUrl,
      short_url: nextId,
    };
    urlStore.push(record);
    nextId += 1;

    res.json(record);
  });
});

// GET /api/shorturl/:short_url  -> redirect to original
app.get('/api/shorturl/:short_url', function (req, res) {
  const id = parseInt(req.params.short_url, 10);

  const record = urlStore.find((entry) => entry.short_url === id);

  if (!record) {
    // Not required by tests, but nice to have:
    return res.json({ error: 'No short URL found for the given input' });
  }

  res.redirect(record.original_url);
});

// Start server
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});

