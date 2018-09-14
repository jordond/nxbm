import commonjs from "rollup-plugin-commonjs";
import json from "rollup-plugin-json";
import builtins from "rollup-plugin-node-builtins";
import nodeGlobals from "rollup-plugin-node-globals";
import resolve from "rollup-plugin-node-resolve";
import sourceMaps from "rollup-plugin-sourcemaps";
import typescript from "rollup-plugin-typescript2";

// TODO
/*
Try using webpack to bundle this instead...
*/

// tslint:disable-next-line:no-var-requires
const pkg = require("./package.json");

const browserPlugins = [
  resolve({ browser: true }),
  commonjs(),
  json(),
  nodeGlobals(),
  builtins(),
  typescript({
    useTsconfigDeclarationDir: true,
    exclude: ["src/__mocks__/*.ts"]
  }),
  sourceMaps()
];

const nodePlugins = [
  json(),
  typescript({ useTsconfigDeclarationDir: true }),
  commonjs(),
  resolve(),
  sourceMaps()
];

const commonConfig = {
  input: `src/index.ts`,
  external: [],
  watch: {
    include: "src/**"
  }
};

const browserConfig = {
  ...commonConfig,
  output: {
    file: pkg.browser,
    name: "nxbm-api-client",
    format: "umd",
    sourcemap: true
  },
  plugins: [...browserPlugins, sourceMaps()]
};

const nodeConfig = {
  ...commonConfig,
  output: [{ file: pkg.main, format: "cjs", sourcemap: true }],
  plugins: nodePlugins,
  external: [
    "os",
    "http",
    "https",
    "url",
    "assert",
    "stream",
    "tty",
    "util",
    "zlib"
  ]
};

export default [browserConfig, nodeConfig];
