const webpack = require("webpack");

const plugins = [];

if (process.env.NODE_ENV !== "production") {
  // plugins.push(new webpack.WatchIgnorePlugin([/\.js$/, /\.d\.ts$/]));
}

module.exports = {
  chainWebpack: config => {
    config.module
      .rule("ts")
      .use("ts-loader")
      .loader("ts-loader")
      .tap(options => {
        // options.projectReferences = true;
        return options;
      });
  },
  configureWebpack: {
    devServer: {
      proxy: {
        "/api": {
          target: "http://localhost:9999",
          ws: true,
          changeOrigin: true
        }
      }
    },
    plugins
  },
  outputDir: "../../build/dist/web"
};
