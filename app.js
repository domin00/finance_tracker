var express = require('express');
var app = express();
var sqlite = require('sqlite3');
var bodyparser = require('body-parser');
var fs = require('fs');
var finance = require('yahoo-finance');
var util = require('util')
var date = require("date-and-time");

app.set("view engine", "ejs");
app.use(bodyparser.urlencoded({extended: true}));

// initialize database
let db = new sqlite.Database('db/sqlite/finData.db', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the in-memory SQlite database.');
});

// ---- request calls ----
// variables that will be manipulated & rendered

// request home page
app.get(['/'], function(req,res) {
  // return message of succesful request
  console.log('GET request received from home.');


  // initialize variables to be rendered
  var buyprices = [];
  var buydates = [];
  var symbols = [];
  var quantities = [];
  var rowids = [];
  var now = new Date();
  var d = now.getFullYear() + "-" + (now.getMonth()+1) + "-" + now.getDate();

  // Fetch fin data from database

  db.serialize(function() {
    db.each('SELECT * FROM data;', function(err, rows) {
      buyprices.push(rows.buyprice);
      buydates.push(rows.buydate);
      symbols.push(rows.symbol);
      quantities.push(rows.quantity);

    }, function() {
      db.each('SELECT rowid FROM data;', function(err, rows) {
        rowids.push(rows.rowid)}, function() {
          console.log(rowids);
          res.render("index", {
            buyprices,
            buydates,
            symbols,
            quantities,
            rowids
          })
          res.end()
        })
      })
    })
  })

  // read finance data
  /*finance.historical({
  symbol: symbol,
  from: '2020-01-1',
  to: d,
  period: 'd'
  }, function (err, quotes) {
    if (err) { throw err; }
    console.log(util.format(
      '=== %s (%d) ===',
      'AAPL',
      quotes.length
    ));
    if (quotes[0]) {
      console.log(JSON.stringify(quotes[quotes.length - 1], null, 2));
      for (var i = 0; i <= (quotes.length -1 ); i++) {
        prices.push(quotes[i].close);
        dates.push(quotes[i].date.getFullYear() + '-' + (quotes[i].date.getMonth()+1) + '-' + quotes[i].date.getDate());
      }

      console.log(prices);
      console.log(dates)
      // render the page
      res.render("index", {prices, dates, symbol});
      res.end();
    } else {
      console.log('N/A');
    }
  });*/


// request plot
app.get('/plot', function(req,res) {
  var buyprices = [];
  var buydates = [];
  var symbols = [];
  var quantities = [];
  var rowids = [];
  console.log("GET request received from 'plot'.");
  db.each("SELECT * FROM data;", function(err, rows) {
    buyprices.push(rows.buyprice);
    buydates.push(rows.buydate);
    symbols.push(rows.symbol);
    quantities.push(rows.quantity);
    rowids.push(rows.rowid);
    console.log(rowids);
    res.redirect('/');
  })
})

// request db input and output
app.post(['/add'], function(req, res) {
  // return ding for request
  console.log('POST request received for add.');
  // run DB catcher
  db.run("INSERT INTO data VALUES (?,?,?,?)", [Number(req.body.price) , req.body.date, req.body.symbol, Number(req.body.quantity)], function(err, rows) {
    if(err) {
      console.log("Something went wrong.");
      console.log(err.message);
    }
    else{
      console.log("Item submitted.")
      res.redirect('/');
    }
  });
});


// request for deleting an input
app.post('/deleteitem', function(req,res) {
  console.log("POST request received from '/deleteitem'.");
  console.log(req.body.button);
  db.run("DELETE FROM data WHERE rowid =(?)", [req.body.button], function(err, rows) {
    if(err) {
      console.log("Something went wrong.");
      console.log(err.message);
    }
    else {
      console.log("Item deleted.");
      res.redirect('/');
    }
  });
})

app.listen(8080, function() {
  console.log('App is running on port 8080.')
});
