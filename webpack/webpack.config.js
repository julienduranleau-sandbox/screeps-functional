const path = require('path');

module.exports = {
  devtool: 'source-map',
  entry: './src/main.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, '../default')
  }
};
