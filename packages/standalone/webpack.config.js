const webpack = require("webpack");
const nodeExternals = require("webpack-node-externals");
const NodemonPlugin = require("nodemon-webpack-plugin");
const { basename, dirname, resolve } = require("path");
const { sync: readPkg } = require("read-pkg");
const { argv } = require("yargs");

const { main } = readPkg();

const outputPath = resolve(__dirname, "../../build/bin/", dirname(main));

const isDev = argv.dev;
const minimize = argv.m || argv.mini;

const config = {
  mode: isDev ? "development" : "production",
  target: "node",
  entry: "./src/index.ts",
  output: {
    path: outputPath,
    filename: basename(main)
  },
  node: {
    console: true,
    __dirname: false,
    __filename: true
  },
  optimization: { minimize },
  resolve: {
    extensions: [".ts", ".js", ".mjs"]
  },
  module: {
    rules: [
      {
        test: /\.ts/,
        loader: "ts-loader",
        exclude: /node_modules/,
        options: {
          projectReferences: true
        }
      },
      {
        test: /\.mjs$/,
        use: [],
        type: "javascript/auto"
      }
    ]
  },
  plugins: [],
  externals: ["fsevents"],
  watchOptions: {
    aggregateTimeout: 5000
  }
};

if (isDev) {
  config.externals.push(nodeExternals());
  config.plugins = [
    // new webpack.WatchIgnorePlugin([/*/\.js$/,*/ /\.d\.ts$/]),
    new NodemonPlugin({
      args: ["--root=../../tmp", "--level=debug", "--env=development"]
    })
  ];
}

module.exports = config;
