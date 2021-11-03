//@ts-check

'use strict';

const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { getThemeVariables } = require('antd/dist/theme');

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

const NODE_ENV = process.env.NODE_ENV;

/** @type env: any => WebpackConfig */
const webviewConfig = env => {
  return {
    target: 'web',
    mode: NODE_ENV,

    entry: './index.tsx',
    output: {
      path: { development: path.resolve(__dirname, 'dist'), production: path.resolve(__dirname, '../../dist') }[NODE_ENV],
      filename: 'webview.js'
    },
    devServer: {
      static: {
        directory: path.resolve(__dirname, '.static')
      },
      hot: true,
      open: true,
      port: 9000
    },
    plugins: {
      development: undefined,
      production: [
        new MiniCssExtractPlugin({
          filename: 'webview.css'
        })
      ]
    }[NODE_ENV],
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.less', '.css']
    },
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
                [
                  '@babel/preset-env',
                  '@babel/preset-react'
                ]
              ]
            }
          },
          exclude: /node_modules/
        },
        {
          test: /\.(le|c)ss$/,
          use: [
            {
              loader: { development: 'style-loader', production: MiniCssExtractPlugin.loader }[NODE_ENV]
            },
            'css-loader',
            {
              loader: 'less-loader',
              options: {
                lessOptions: {
                  /* Should be replaced since inline js will cause security issues.
                  See https://lesscss.org/usage/#less-options */
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
      development: {}, production: {
        usedExports: true,
      }
    }[NODE_ENV],
    devtool: 'inline-source-map'
  };
};

module.exports = webviewConfig;
