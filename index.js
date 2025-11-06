require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const dns = require('dns');
const urlParser = require('url');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// In-memory database substitute
let urls = [];
let id = 1;

// POST endpoint for shortening URLs
app.post('/api/shorturl', function (req, res) {
  const originalUrl = req.body.url;

  try {
    const parsedUrl = new URL(originalUrl);

    // Validate protocol (http or https only)
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return res.json({ error: 'invalid url' });
    }

    // Check if the hostname is valid via DNS
    dns.lookup(parsedUrl.hostname, (err) => {
      if (err) return res.json({ error: 'invalid url' });

      // Store URL and return response
      urls.push({ original_url: originalUrl, short_url: id });
      res.json({ original_url: originalUrl, short_url: id });
      id++;
    });
  } catch {
    res.json({ error: 'invalid url' });
  }
});

// GET endpoint to redirect
app.get('/api/shorturl/:short_url', function (req, res) {
  const shortUrl = parseInt(req.params.short_url);
  const entry = urls.find((u) => u.short_url === shortUrl);

  if (entry) {
    res.redirect(entry.original_url);
  } else {
    res.json({ error: 'No short URL found for the given input' });
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
