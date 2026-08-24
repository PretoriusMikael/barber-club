"use client";

import dynamic from "next/dynamic";

/**
 * Keeps the prototyping toolbar out of the production bundle.
 *
 * The obvious version — `{process.env.NODE_ENV === "development" && <DevToolbar />}`
 * in the root layout — does NOT work, and the failure is silent. Importing a
 * client component into a server component registers it in the client manifest
 * whether or not the branch that renders it can ever be true, so the entire
 * toolbar shipped to production: verified by grepping the built chunks for its
 * markers and finding them in `.next/static/chunks`.
 *
 * The fix is to make the IMPORT unreachable rather than the JSX. Next replaces
 * `process.env.NODE_ENV` with a string literal at build time, so in production
 * the ternary below folds to `null` and the `import()` inside it is dead code
 * the bundler can drop, taking the toolbar, its controls table and its panel
 * stylesheet with it.
 *
 * `ssr: false` because the toolbar reads localStorage and renders nothing until
 * hydration anyway — there is no markup for the server to produce.
 *
 * There is a test for this. See the production-strip check in the PR notes: if
 * a future refactor puts the import back on the static path, the marker scan
 * catches it.
 */
const Toolbar =
  process.env.NODE_ENV === "development"
    ? dynamic(() => import("./DevToolbar").then((m) => ({ default: m.DevToolbar })), {
        ssr: false,
      })
    : null;

export function DevToolbarGate() {
  if (!Toolbar) return null;
  return <Toolbar />;
}
