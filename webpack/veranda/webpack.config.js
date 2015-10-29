
module.exports = {
  entry: {
    blah: ['./main.js'],
    message: ['./message.js']
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
  }
};
