const path = require('path');

module.exports = {
  target: 'webview',
  entry: './src/webview/index.tsx',
  output: {
    path: path.resolve(__dirname, 'out/webview'),
    filename: 'webview.js',
    libraryTarget: 'var'
  },
  externals: {
    vscode: 'commonjs vscode'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    fallback: {
      path: false,
      fs: false,
      os: false
    }
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig-webview.json'
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  }
};
