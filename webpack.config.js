const path = require('path')
module.exports = {
  mode: 'none',
  target: 'node',
  entry: './sample/index.js',
  output: {
    path: path.resolve(__dirname, 'sample/dist'),
    filename: 'index.js'
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: [
              '@babel/plugin-syntax-dynamic-import',
              '@babel/plugin-proposal-class-properties'
            ]
          }
        }
      }
    ]
  }
}