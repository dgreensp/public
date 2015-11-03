
module.exports = {
  entry: {
    client: ['./lib/client.js']
  },
  output: {
    path: __dirname + '/public',
    filename: '[name].js',
    pathinfo: true
  },
  module: {
    loaders: []
  },
  devServer: {
    contentBase: './public/'
  }
};
