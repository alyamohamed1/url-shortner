// index.js
// URL Shortener Microservice (final version)

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const { URL } = require('url');

const app = express();
const port = process.env.PORT || 3000;

// Basic config
app.use(cors());
app.use(express.urlencoded({ extended: false })); // <-- handles POST form body
app.use('/public', express.static(`${process.cwd()}/public`));

// Home page
app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// FCC hello route
app.get('/api/hello', (req, res) => {
  res.json({ greeting: 'hello API' });
});

// In-memory DB
let urls = [];
let counter = 1;

// POST /api/shorturl
app.post('/api/shorturl', (req, res) => {
  const inputUrl = req.body.url;

  let parsed;
  try {
    parsed = new URL(inputUrl);
  } catch {
    return res.json({ error: 'invalid url' });
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return res.json({ error: 'invalid url' });
  }

  dns.lookup(parsed.hostname, (err) => {
    if (err) return res.json({ error: 'invalid url' });

    const existing = urls.find(u => u.original_url === inputUrl);
    if (existing) return res.json(existing);

    const newEntry = {
      original_url: inputUrl,
      short_url: counter++
    };
    urls.push(newEntry);
    res.json(newEntry);
  });
});

// GET /api/shorturl/:id
app.get('/api/shorturl/:id', (req, res) => {
  const id = Number(req.params.id);
  const record = urls.find(u => u.short_url === id);
  if (!record) return res.json({ error: 'No short URL found for given input' });
  res.redirect(record.original_url);
});

// Start
app.listen(port, () => console.log(`Listening on port ${port}`));


