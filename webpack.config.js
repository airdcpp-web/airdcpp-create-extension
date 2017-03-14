var path = require('path');
var webpack = require('webpack');

var packageJson = require('./package.json');

var release = process.env.NODE_ENV === 'production';

module.exports = {
  entry: release ? './src/index.js' : './src/main.js',
  target: 'node',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'main.js',
    libraryTarget: 'umd'
  },
  plugins: [
    // Optional binary requires that should be ignored
    new webpack.IgnorePlugin(/.*\/build\/.*\/(validation|bufferutil)/),
    new webpack.DefinePlugin({
      'EXTENSION_NAME': JSON.stringify(packageJson.name),
      'EXTENSION_VERSION': JSON.stringify(packageJson.version),
      'EXTENSION_BUILD_TIME': JSON.stringify((new Date).getTime()),
    }),
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
