import express from "express";
import compression from "compression";
import React from "react";
import ReactDOMServer from "react-dom/server";

import GitHubClient from "./GitHubClient";
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
${scripts.map(script => {
if (typeof script === 'string') {
return `<script src="${script}"></script>`;
} else { // { inline: '...' }
return `<script>${script.inline}</script>`;
}
}).join('\n')}
</body>
</html>`;
}

function pageForComponent(componentName, {props = null} = {}) {
  const comp = module.require('./' + componentName).default;
  const markup = ReactDOMServer.renderToString(React.createElement(comp, props));
  return genericPage({
    body: `<div id="page">${markup}</div>`,
    title: componentName,
    scripts: [
      `/${componentName}.js`,
      { inline: `WEBPACK.ComponentPage.initPage(${JSON.stringify(componentName)},
 ${JSON.stringify({props})});` }
    ],
    styles: [`/${componentName}.css`]
  });
}

const gh = new GitHubClient({
  accessToken: '9968a96970c44765d175c5a12280d63ca5ff4e7b',
  userAgent: 'dgreensp GitScope'
});

function setUpRoutes() {

  app.get('/Wow', (req, res) => {
    res.send(pageForComponent('Wow', {props:{text:'HOORAY'}}));
  });

  app.get('/APITest', (req, res, next) => {
    gh.getRaw('/repos/meteor/meteor/git/commits/90e5d3ea739834fca9937bea0935590215eefa85').then(result => {
      res.send(pageForComponent('APITest', {props:{...result}}));
    }).catch(next);
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

/*  app.get('/apitest', (req, res, next) => {
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
  });*/
}

const server = app.listen(3000, function () {
  const host = server.address().address;
  const port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
