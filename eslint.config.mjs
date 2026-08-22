// eslint-config-next 16 ships native flat configs, so there is no FlatCompat
// bridge here. Wrapping them in FlatCompat throws
// "Converting circular structure to JSON" on ESLint 9.39+.
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts"],
  },
];
