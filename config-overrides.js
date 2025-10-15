const webpack = require('webpack');

module.exports = function override(config, env) {
  // Add fallbacks for Node.js modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "crypto": require.resolve("crypto-browserify"),
    "stream": require.resolve("stream-browserify"),
    "buffer": require.resolve("buffer"),
    "process": require.resolve("process"),
    "util": require.resolve("util"),
    "assert": require.resolve("assert"),
    "url": require.resolve("url"),
    "fs": false,
    "net": false,
    "tls": false,
    "child_process": false,
  };

  // Add plugins for global variables
  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process',
    }),
  ];

  return config;
};
