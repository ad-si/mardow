import eslintConfigJavascript from "eslint-config-javascript"

export default [
  ...eslintConfigJavascript,
  {
    files: ["**/*.d.ts"],
    rules: {
      "no-unused-vars": "off",
    },
  },
]
