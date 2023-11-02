import typescript from "rollup-plugin-typescript2";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import {string} from "rollup-plugin-string";

export default {
  input: "src/index.ts",
  output: {
    file: "dist/bundle.js",
    format: "esm",
    sourcemap: true,
  },
  plugins: [
    typescript(),
    resolve({
      browser: true,
      preferBuiltins: false,
    }),
    commonjs(),
    json(),
    string({
      include: "**/*.wgsl",
      exclude: ["**/index.html"]
    })
  ],
};