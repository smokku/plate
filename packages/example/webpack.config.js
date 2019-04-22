
const webpack = require('webpack')
const path = require('path')

const HtmlWebpackPlugin = require('html-webpack-plugin')
const autoprefixer = require('autoprefixer')

const nodeEnv = process.env.NODE_ENV || 'development'

const isProduction = nodeEnv === 'production'

const jsSourcePath = path.join(__dirname, './example')
const buildPath =  path.join(__dirname, './build')

const plugins = [
  new webpack.NamedModulesPlugin(),
  new HtmlWebpackPlugin({
    template: path.join(__dirname, './example/index.html'),
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


const scssRule = [
  'style-loader',
  {
    loader: 'css-loader',
    options: {
      sourceMap: !isProduction,
    },
  },
  {
    loader: 'postcss-loader',
    options: {
      plugins: [
        autoprefixer({
          browsers: [
            'last 3 version',
            'ie >= 11',
          ],
        }),
      ],
    },
  },
  {
    loader: 'sass-loader',
    options: {
      sourceMap: true,
    },
  },
]

const rules = [
  {
    test: /\.(js|jsx)$/,
    exclude: /node_modules/,
    use: 'babel-loader',
  },
  {
    test: /\.s?css$/,
    exclude: /node_modules/,
    oneOf: [
      {
        include: path.resolve(__dirname, 'src/example'),
        use: scssRule.map(item => item.loader !== 'css-loader' ? item : {
          ...item,
          options: {
            ...item.options,
            modules: true,
            camelCase: 'only',
            localIdentName: '[path][name]__[local]--[hash:base64:5]',
          },
        }),
      },
      {
        use: scssRule,
      },
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
    extensions: ['.webpack-loader.js', '.web-loader.js', '.loader.js', '.js', '.jsx', '.scss'],
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
