var path = require('path');
var babelOpts = require('./package.json').babel;

function resolve(p) {
  return path.resolve(__dirname, p);
}

module.exports = {
  entry: {
    client: ['./src/client.js']
  },
  output: {
    path: resolve('./public'),
    filename: '[name].js',
    pathinfo: true
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        include: [resolve('./src')],
        query: {
          loose: babelOpts.loose,
          optional: babelOpts.optional,
          whitelist: babelOpts.whitelist
        }
      },
      {
        test: /\.less$/,
        loader: 'style!css!less'
      }
    ]
  },
  devServer: {
    contentBase: './public/'
  }
};
