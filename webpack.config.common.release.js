var webpack = require("webpack"),
    WebpackJsObfuscator = require('webpack-js-obfuscator'),
    WebpackShellPlugin = require('webpack-shell-plugin');

module.exports = {
  cache: true,
  entry: "./www/app.jsx",
  output: {
    path: __dirname + "/www/build",
    filename: "bundle.js",
    publicPath: "./build/"
  },
  devtool: "source-map",
  module: {
    loaders: [
      { test: /\.less$/, loader: "style!css!less" },
      { test: /\.jsx$/, loader: "jsx-loader" },
      { test: /\.json$/, loader: "json" },
      { test: /\.css$/, loader: "style-loader!css-loader" },
      { test: /\.(png|jpg|GIF)$/, loader: 'url-loader?limit=8192'}
    ]
  },
  plugins: [
    new WebpackJsObfuscator({
      rotateUnicodeArray: true,
      controlFlowFlattening: true,
      compact: true,
      debugProtection: true
    }, []),
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin({
        compress: { warnings: false },
        comments: false,
        sourceMap: false,
        mangle: true,
        minimize: true
    }),
    new WebpackShellPlugin({
      onBuildStart: [],
      onBuildEnd: []
    })
  ]
};

/*,
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('production')
      }
    }),
    new WebpackJsObfuscator({
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.75,
        debugProtection: false,
        debugProtectionInterval: false,
        disableConsoleOutput: true,
        rotateStringArray: true,
        selfDefending: true,
        stringArray: true,
        stringArrayEncoding: 'base64',
        stringArrayThreshold: 0.75,
        unicodeEscapeSequence: false
    }),
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin({
        compress: { warnings: false },
        comments: false,
        sourceMap: false,
        mangle: true,
        minimize: true
    })
  ]
  */