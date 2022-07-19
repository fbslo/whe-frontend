var express =  require("express");
var app = express();
var bodyParser = require("body-parser");
var toobusy = require('node-toobusy');
var serveStatic = require('serve-static')
var path = require('path')
const rateLimit = require("express-rate-limit");
require('dotenv').config();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(function(req, res, next) {
  if (toobusy()) res.status(503).send("I'm busy right now, sorry.");
  else next();
});
app.disable('x-powered-by');
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});
app.use(serveStatic(path.join(__dirname, 'frontend')))
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(limiter);
app.set('view engine', 'ejs');


app.get('/', async (req, res) => {
  res.render('index/index')
})

app.get('/leo-ethereum', async (req, res) => {
  res.render('leo-ethereum/leo')
})

app.get('/leo-bsc', async (req, res) => {
  res.render('leo-bsc/leo')
})

app.get('/hbd', async (req, res) => {
  res.render('hbd/hbd')
})

app.get('/hive', async (req, res) => {
  res.render('hive/hive')
})

app.get('/sps', async (req, res) => {
  res.render('sps/sps')
})

app.get('/hive-bsc', async (req, res) => {
  res.render('hive-bsc/hive')
})

app.get('/hbd-bsc', async (req, res) => {
  res.render('hbd-bsc/hbd')
})

app.listen(8080)
