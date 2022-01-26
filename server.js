require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require("body-parser");

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true });

const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number,
}, { versionKey: false });

urlSchema.pre('save', function (next) {
  var short_url = 1;
  var url = this;
  Url.find({}, function (err, docs) {
    short_url = docs.length + 1;
    url.short_url = short_url;
    next();
  });
})

const Url = mongoose.model('Url', urlSchema);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl', function (req, res) {
  if (isValidHttpUrl(req.body.url)) {
    Url.findOne({ original_url: req.body.url }, function (err, urlFound) {
      if (!urlFound) {
        const url = new Url({ original_url: req.body.url });
        url.save().then(savedUrl => {
          const { original_url, short_url } = savedUrl;
          res.json({ original_url, short_url })
        });
      } else {
        const { original_url, short_url } = urlFound;
        res.json({ original_url, short_url })
      }
    });
  } else {
    res.json({ error: "Invalid URL" })
  }
});

app.get('/api/shorturl/:id', function (req, res) {
  Url.findOne({ short_url: req.params.id }, function (err, urlFound) {
    if (urlFound) {
      res.redirect(urlFound.original_url);
    } else {
      res.json({
        error: "No short URL found for the given input"
      });
    }
  });
});

function isValidHttpUrl(string) {
  let url;
  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }
  return url.protocol === "http:" || url.protocol === "https:";
}

// Basic Configuration
const port = process.env.PORT || 3000;

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
