var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: './src/index.js',
  target: 'node',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'extension.js'
  },
  externals: path.join(__dirname, 'node_modules/websocket/build/'),
  plugins: [
    // Optional binary requires that should be ignored
    new webpack.IgnorePlugin(/.*\/build\/.*\/(validation|bufferutil)/)
  ],
  devtool: 'cheap-module-source-map',
  module: {
    rules: [
      { 
        test: /\.(js)$/, 
        include: /src/, 
        use: 'babel-loader',
      }
    ]
  },
}
