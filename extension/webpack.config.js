const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    background: './background/index.ts',
    content: './content-scripts/index.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
    }
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-env',
                '@babel/preset-typescript',
                '@babel/preset-react'
              ],
              plugins: [
                [
                  'module-resolver',
                  {
                    root: ['.'],
                    alias: {
                      '@shared': path.resolve(__dirname, '../shared'),
                      '@packages': path.resolve(__dirname, '../packages')
                    }
                  }
                ]
              ]
            }
          },
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              configFile: path.resolve(__dirname, './tsconfig.json')
            }
          }
        ],
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: '.' },
        { from: 'icons', to: 'icons' },
        { from: 'sidebar.html', to: '.' },
        { from: 'sidebar.js', to: '.' },
        { from: 'modal/rule-modal.html', to: 'modal' },
        { from: 'modal/rule-modal.js', to: 'modal' },
        { from: 'modal/simple-rule-modal.html', to: 'modal' },
        { from: 'modal/simple-rule-modal.js', to: 'modal' }
      ],
    }),
  ],
}; 