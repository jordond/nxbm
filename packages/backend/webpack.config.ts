import CopyWebpackPlugin from "copy-webpack-plugin";
import { basename, dirname, resolve } from "path";
import { sync as readPkg } from "read-pkg";
import { Configuration } from "webpack";
import { argv } from "yargs";

const { main } = readPkg();
const { minify = false } = argv;

// TODO - make it copy the python files

const config: Configuration = {
  mode: "production",
  target: "node",
  entry: "./src/bin.ts",
  output: {
    path: resolve(__dirname, dirname(main)),
    filename: basename(main)
  },
  node: {
    console: true,
    __dirname: false,
    __filename: true
  },
  optimization: {
    minimize: minify
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
  plugins: [new CopyWebpackPlugin(["**/parser/py/*.py"])],
  externals: ["fsevents"]
};

export default config;
