import CopyWebpackPlugin from "copy-webpack-plugin";
import { basename, dirname, resolve } from "path";
import { sync as readPkg } from "read-pkg";
import { Configuration } from "webpack";

const { main } = readPkg();

// TODO - make it copy the python files

const outputPath = resolve(__dirname, dirname(main));
const pythonFiles = resolve("../core-files/src/**/*.py");

const config: Configuration = {
  mode: "production",
  target: "node",
  entry: "./src/bin.ts",
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
    new CopyWebpackPlugin([
      {
        from: pythonFiles,
        to: outputPath,
        flatten: true
      }
    ])
  ],
  externals: ["fsevents"]
};

export default config;
