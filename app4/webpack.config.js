var webpack = require('webpack');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var path = require('path');
var babelOpts = require('./package.json').babel;

// silence Babel deprecation warning about custom formatters
require('babel-core/lib/transformation/file/logger').prototype.deprecate = function () {};

function resolve(p) {
  return path.resolve(__dirname, p);
}

var isProduction = false;

module.exports = {
  entry: {
    //client: ['./src/client.js']
    Wow: ['./src/Wow.js']
  },
  output: {
    path: resolve('./built'),
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
        loader: ExtractTextPlugin.extract('style-loader', 'css-loader!less-loader')
      }
    ]
  },
  plugins: [
    new ExtractTextPlugin("[name].css")
  ].concat(isProduction ? [
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
