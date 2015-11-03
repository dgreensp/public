import express from "express";
import request from "request-promise";
import React from "react";
import ReactDOMServer from "react-dom/server";

class JSONView extends React.Component {
  render() {
    const value = this.props.data;
    if (typeof value === 'object') {
      return <div className="json-object">
        {Object.entries(value).map(
          ([k,v]) => <div className="json-object-entry">
            {k} {typeof v}
            </div>)}
      </div>;
    }
  }
}

const app = express();

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>app4</title>
</head>
<body>
  ${ReactDOMServer.renderToString(<p>Hi everyone...</p>)}

  <script src="/client.js"></script>
</body>
</html>
`);
});

app.get('/apitest', (req, res, next) => {
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
  }).catch((error) => {
    res.json({error});
  }).then((response) => {
    res.send(ReactDOMServer.renderToString(<JSONView data={response}/>));
  }).catch(next);
});

app.use(express.static('public'));

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
