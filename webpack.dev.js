const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

const CompressionPlugin = require('compression-webpack-plugin');

module.exports = merge(common, {
  mode: 'development',
  output: {
    publicPath: '/'
  },
  devServer: {
    compress: true,
    hot: true,
    open: true,
    openPage: ['perf-basecamp'],
    port: 3000,
    historyApiFallback: true
  },
  cache: false,
  plugins: [
    new CompressionPlugin({
      test: /\.*(\?.*)?$/i
    })
  ]
});
