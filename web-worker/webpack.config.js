const path = require('path');

module.exports = {
  entry: './web-worker/src/index.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  mode: 'production',
  output: {
    filename: 'web-worker.js',
    path: path.resolve(__dirname, '../dist'),
  },
};
