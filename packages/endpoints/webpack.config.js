const { resolve } = require("path");
const package = require("./package.json");

module.exports = {
  entry: "./src/index.ts",
  devtool: "source-map",
  output: {
    path: resolve("./"),
    filename: package.main,
    libraryTarget: "commonjs"
  },
  resolve: {
    extensions: [".ts", "js"]
  },
  module: {
    rules: [{ test: /\.ts/, loader: "ts-loader" }]
  }
};
