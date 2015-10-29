
module.exports = {
  entry: {
    bundle: ['./src/main.js']
  },
  output: {
    path: __dirname + '/out',
    filename: '[name].js'
  },
  target: "node",
  module: {
    loaders: [{
      test: /\.js$/,
      loader: 'babel-loader',
      query: {
        externalHelpers: true
      }
    }]
  },
  devServer: {
    contentBase: './public/'
  }
};
