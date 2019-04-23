
const webpack = require('webpack')
const path = require('path')

const HtmlWebpackPlugin = require('html-webpack-plugin')

const nodeEnv = process.env.NODE_ENV || 'development'

const isProduction = nodeEnv === 'production'

const jsSourcePath = path.join(__dirname, './src')
const buildPath =  path.join(__dirname, './build')

const plugins = [
  new webpack.NamedModulesPlugin(),
  new HtmlWebpackPlugin({
    template: path.join(__dirname, 'src', 'index.html'),
    path: buildPath,
    filename: 'index.html',
  }),
  new webpack.LoaderOptionsPlugin({
    options: {
      context: jsSourcePath,
    },
  }),
  new webpack.ContextReplacementPlugin(/\.\/locale$/, 'empty-module', false, /js$/),
  new webpack.HotModuleReplacementPlugin()
]

const rules = [
  {
    test: /\.(js|jsx)$/,
    exclude: /node_modules/,
    use: 'babel-loader',
  },
  {
    test: /\.css$/,
    use: [
      {
        loader: 'style-loader',
      },
      'css-loader',
    ],
  },
]

module.exports = {
  devtool: 'source-map',
  mode: 'development',
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendor: {
          chunks: 'initial',
          name: 'vendor',
          test: /node_modules/,
          enforce: true,
          filename: 'vendor-[hash].js',
        },
      },
    },
  },
  entry: {
    js: jsSourcePath + '/index.jsx',
  },
  node: {
    fs: 'empty',
  },
  output: {
    path: buildPath,
    publicPath: '/',
    filename: 'app-[hash].js',
  },
  module: {
    rules,
  },
  resolve: {
    extensions: ['.webpack-loader.js', '.web-loader.js', '.loader.js', '.js', '.jsx', '.css', '.min.css'],
    modules: [
      path.resolve(__dirname, 'node_modules'),
      jsSourcePath,
    ],
  },
  plugins,
  devServer: {
    contentBase: jsSourcePath,
    historyApiFallback: {disableDotRule: true},
    port: 3004,
    compress: isProduction,
    inline: !isProduction,
    hot: !isProduction,
    host: '0.0.0.0',
    disableHostCheck: true,
    stats: {
      assets: true,
      children: false,
      chunks: false,
      hash: false,
      modules: false,
      publicPath: false,
      timings: true,
      version: false,
      warnings: true,
      colors: {
        green: '\u001B[32m',
      },
    },
  },
}
