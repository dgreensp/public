var express = require('express');
var request = require('request-promise');

var app = express();

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.get('/apitest', function (req, res) {
  request({
    uri: 'https://api.github.com/repos/meteor/meteor/git/commits/90e5d3ea739834fca9937bea0935590215eefa85',
    qs: {
      access_token: '9968a96970c44765d175c5a12280d63ca5ff4e7b'
    },
    json: true,
    headers: {
      'User-Agent': 'dgreensp GitScope'
    },
    resolveWithFullResponse: true
  }).then(function (response) {
    res.json({response: response});
  }).catch(function (err) {
    res.json({error: err});
  });
});

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
