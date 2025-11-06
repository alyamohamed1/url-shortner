require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
const { URL } = require('url');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));

// Root route
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// In-memory store
let urls = [];
let counter = 1;

// POST endpoint: create short URL
app.post('/api/shorturl', (req, res) => {
  const inputUrl = req.body.url;

  // Validate URL syntax
  let parsedUrl;
  try {
    parsedUrl = new URL(inputUrl);
  } catch (err) {
    return res.json({ error: 'invalid url' });
  }

  // Check protocol
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return res.json({ error: 'invalid url' });
  }

  // DNS lookup to verify host
  dns.lookup(parsedUrl.hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    // Return existing URL if found
    const found = urls.find((u) => u.original_url === inputUrl);
    if (found) return res.json(found);

    // Otherwise, add new record
    const newEntry = {
      original_url: inputUrl,
      short_url: counter,
    };
    urls.push(newEntry);
    counter++;

    res.json(newEntry);
  });
});

// GET endpoint: redirect short URL
app.get('/api/shorturl/:short_url', (req, res) => {
  const id = parseInt(req.params.short_url);
  const found = urls.find((u) => u.short_url === id);

  if (!found) return res.json({ error: 'No short URL found for the given input' });

  res.redirect(found.original_url);
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
});
