import typescript from "rollup-plugin-typescript2";
import pkg from "./package.json";

export default [
  {
    input: "src/index.ts",
    plugins: [
      typescript({
        typescript: require("typescript")
      })
    ],
    output: [
      { name: "spuds", file: pkg.browser, format: "umd" },
      { file: pkg.module, format: "es" }
    ]
  }
];
