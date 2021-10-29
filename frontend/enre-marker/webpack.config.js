//@ts-check

'use strict';

const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { getThemeVariables } = require('antd/dist/theme');

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

/** @type WebpackConfig */
const extensionConfig = {
  target: 'node',
	mode: 'none',

  entry: './src/extension/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
    clean: true
  },
  externals: {
    vscode: 'commonjs vscode'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      }
    ]
  },
  devtool: 'nosources-source-map'
};

/** @type WebpackConfig */
const webviewConfig = {
  target: 'web',
  mode: 'production',

  entry: './src/webview/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'webview.js'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.less', '.css']
  },
  plugins: [
    //@ts-ignore
    new MiniCssExtractPlugin({
      filename: 'webview.css'
    }),
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader'
        },
        exclude: /node_modules/
      },
      {
        test: /\.jsx?$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env']
            ]
          }
        }
      },
      {
        test: /\.(le|c)ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: "less-loader",
            options: {
              lessOptions: {
                // Should be replaced since inline js will cause security issues. See https://lesscss.org/usage/#less-options
                javascriptEnabled: true,
                modifyVars: getThemeVariables({
                  dark: false,
                  compact: true
                })
              }
            }
          }
        ]
      }
    ]
  },
  optimization: {
    usedExports: true,
  },
  devtool: 'inline-source-map'
};

// TODO: reduce bundle size
module.exports = [ extensionConfig, webviewConfig ];