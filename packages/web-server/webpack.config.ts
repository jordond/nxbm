import CopyWebpackPlugin from "copy-webpack-plugin";
import { basename, dirname, resolve } from "path";
import { sync as readPkg } from "read-pkg";
import { Configuration } from "webpack";

const { main } = readPkg();

const outputPath = resolve(__dirname, dirname(main));

const config: Configuration = {
  mode: "production",
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
  optimization: {
    minimize: false
  },
  resolve: {
    extensions: [".ts", ".js", ".mjs"]
  },
  module: {
    rules: [
      {
        test: /\.ts/,
        loader: "ts-loader",
        exclude: /node_modules/
      },
      {
        test: /\.mjs$/,
        use: [],
        type: "javascript/auto"
      }
    ]
  },
  plugins: [
    // new CopyWebpackPlugin(["WEB FILES"])
  ],
  externals: ["fsevents"]
};

export default config;
