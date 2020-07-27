var path = require('path')

module.exports = {
  mode: "production",
  entry: './index.js',
  output: {
    filename: 'pedersen.js',
    path: path.resolve(__dirname, 'dist')
  },
  optimization: {
    minimize: false
  },
  node: {
    fs: "empty"
  }
};
