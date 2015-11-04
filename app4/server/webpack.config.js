var webpack = require('webpack');
var path = require('path');
var babelOpts = require('./package.json').babel;

function resolve(p) {
  return path.resolve(__dirname, p);
}

var isProduction = false;

module.exports = {
  entry: {
    client: ['./src/client.js']
  },
  output: {
    path: resolve('./public'),
    filename: '[name].js',
    pathinfo: !isProduction
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
  },
  plugins: [].concat(isProduction ? [
    new webpack.DefinePlugin({
      'process.env': {
        // for React
        'NODE_ENV': JSON.stringify('production')
      }
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    })
  ] : [])
};
