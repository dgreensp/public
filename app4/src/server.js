import express from "express";
import compression from "compression";
import request from "request-promise";
import React from "react";
import ReactDOMServer from "react-dom/server";

import Wow from "./Wow";

const app = express();
app.use(compression());
app.use(express.static('built'));
setUpRoutes();

function genericPage({body='', title='Untitled', scripts=[], styles=[]}) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  ${styles.map(u => `<link rel="stylesheet" type="text/css" href="${u}">`)}
</head>
<body>
${body}
${scripts.map(u => `<script src="${u}"></script>`).join('\n')}
</body>
</html>`;
}

function pageForComponent(componentName) {
  const comp = module.require('./' + componentName).default;
  const markup = ReactDOMServer.renderToString(React.createElement(comp, null));
  return genericPage({
    body: `<div id="page">${markup}</div>`,
    title: componentName,
    scripts: [`/${componentName}.js`],
    styles: [`/${componentName}.css`]
  });
}

function setUpRoutes() {

  app.get('/Wow', (req, res) => {
    res.send(pageForComponent('Wow'));
  });

  /*  app.get('/', (req, res) => {
    res.send(genericPage({
      title: 'app4',
      body: `
  ${ReactDOMServer.renderToString(<p>Hi <Wow/> everyone...</p>)}

  <div id="mycontainer"></div>`,
      scripts: ['/client.js'],
      styles: ['/client.css']
    }));
  });*/

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
}

const server = app.listen(3000, function () {
  const host = server.address().address;
  const port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
