"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHydrated } from "@/hooks/useHydrated";
import {
  CONTROLS,
  DEFAULTS,
  GROUPS,
  buildCss,
  countChanged,
  scopeCss,
  fontHref,
  type ControlValue,
  type GroupId,
} from "./controls";

/**
 * A design prototyping toolbar. Development only — see the gate in layout.tsx.
 *
 * It changes the design by writing one unlayered stylesheet into the document,
 * which is the whole trick: because the deltas are real CSS rather than React
 * state threaded through components, nothing in the site has to know this
 * exists. No provider, no props, no `style` attributes, and no component had to
 * be touched to make it adjustable.
 *
 * The end of the loop is Copy CSS. Anything you land on comes out as the exact
 * rules that produced it, ready to paste into globals.css — otherwise you are
 * left eyeballing a slider position and guessing.
 *
 * NOT SERVER RENDERED. It reads localStorage, and gating on `useHydrated()`
 * means the server and the first client render agree by construction instead of
 * agreeing by luck. The same reason the curtain does it.
 */

/**
 * The toolbar's own styling.
 *
 * Deliberately NOT the site's palette or tokens, and deliberately px rather
 * than rem. Two reasons. It must never be mistaken for part of the design it is
 * measuring — a tool that looks like the product makes you misjudge the
 * product. And it must be immune to its own controls: root-size, body leading,
 * hairline colour and the brand tokens all move, and a toolbar built on any of
 * them would drift as you worked.
 */
const PANEL_CSS = `
[data-bc-dev] { --p-bg:#15171c; --p-line:#282c35; --p-text:#dfe3ea; --p-dim:#8b93a3;
  --p-accent:#6ea8fe; --p-warn:#f0b429;
  box-sizing:border-box; font-family:ui-sans-serif,system-ui,sans-serif;
  line-height:1.45; font-size:12px; letter-spacing:0; color:var(--p-text); }
[data-bc-dev] *, [data-bc-dev] *::before, [data-bc-dev] *::after { box-sizing:border-box; }

.bc-dev-fab { position:fixed; right:16px; bottom:16px; z-index:2147483000;
  display:inline-flex; align-items:center; gap:8px; padding:9px 14px;
  background:var(--p-bg); border:1px solid var(--p-line); border-radius:8px;
  color:var(--p-text); font-weight:500; cursor:pointer;
  box-shadow:0 10px 30px -10px rgba(0,0,0,.8); }
.bc-dev-fab:hover { border-color:#3a4150; }
.bc-dev-fab-mark { width:9px; height:9px; border-radius:2px; background:var(--p-accent); }
.bc-dev-badge { min-width:18px; padding:1px 5px; border-radius:9px; text-align:center;
  background:var(--p-accent); color:#0b1020; font-weight:700; font-size:11px; }

.bc-dev-panel { position:fixed; right:16px; bottom:16px; z-index:2147483000;
  width:min(330px, calc(100vw - 24px)); max-height:min(78vh,680px); display:flex; flex-direction:column;
  background:var(--p-bg); border:1px solid var(--p-line); border-radius:10px;
  box-shadow:0 24px 60px -20px rgba(0,0,0,.9); overflow:hidden; }

.bc-dev-head { display:flex; align-items:center; gap:8px; padding:10px 12px;
  border-bottom:1px solid var(--p-line); }
.bc-dev-head strong { font-size:12px; font-weight:600; letter-spacing:.06em; text-transform:uppercase; }
.bc-dev-count { margin-left:auto; color:var(--p-dim); font-size:11px; font-variant-numeric:tabular-nums; }
.bc-dev-head button { background:none; border:0; color:var(--p-dim); cursor:pointer;
  padding:2px 4px; font-size:13px; line-height:1; }
.bc-dev-head button:hover { color:var(--p-text); }

.bc-dev-tabs { display:flex; gap:2px; padding:8px 8px 0; border-bottom:1px solid var(--p-line); }
.bc-dev-tabs button { flex:1; padding:6px 4px; background:none; border:0; border-bottom:2px solid transparent;
  color:var(--p-dim); cursor:pointer; font-size:11px; font-weight:500; }
.bc-dev-tabs button[data-active="true"] { color:var(--p-text); border-bottom-color:var(--p-accent); }
.bc-dev-tabs button:hover { color:var(--p-text); }

.bc-dev-body { padding:6px 12px 12px; overflow-y:auto; overscroll-behavior:contain; }
.bc-dev-row { padding:11px 0; border-bottom:1px solid #1e222a; }
.bc-dev-row:last-child { border-bottom:0; }
.bc-dev-row label { display:flex; align-items:baseline; gap:8px; margin-bottom:7px; cursor:pointer; }
.bc-dev-row label > span:first-child { font-weight:500; }
.bc-dev-val { margin-left:auto; color:var(--p-dim); font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
  font-size:11px; font-variant-numeric:tabular-nums; }
.bc-dev-row[data-changed="true"] label > span:first-child { color:var(--p-accent); }
.bc-dev-row[data-changed="true"] .bc-dev-val { color:var(--p-accent); }
.bc-dev-hint { margin:7px 0 0; color:var(--p-dim); font-size:11px; line-height:1.4; }

.bc-dev-row input[type="range"] { width:100%; accent-color:var(--p-accent); margin:0; }
.bc-dev-row select { width:100%; padding:6px 8px; background:#11141a; color:var(--p-text);
  border:1px solid var(--p-line); border-radius:6px; font:inherit; cursor:pointer; }
.bc-dev-colour { display:flex; gap:8px; align-items:center; }
/* Chrome paints the chosen colour inside ::-webkit-color-swatch. Left alone
   with default padding it renders as a white chip that shows nothing, which on
   a dark palette makes every swatch look identical and empty. */
.bc-dev-colour input[type="color"] { width:34px; height:28px; padding:0;
  background:#11141a; border:1px solid var(--p-line); border-radius:6px; cursor:pointer;
  -webkit-appearance:none; appearance:none; }
.bc-dev-colour input[type="color"]::-webkit-color-swatch-wrapper { padding:2px; }
.bc-dev-colour input[type="color"]::-webkit-color-swatch { border:1px solid #00000055; border-radius:4px; }
.bc-dev-colour input[type="color"]::-moz-color-swatch { border:1px solid #00000055; border-radius:4px; }
.bc-dev-colour input[type="text"] { flex:1; padding:6px 8px; background:#11141a; color:var(--p-text);
  border:1px solid var(--p-line); border-radius:6px; font-family:ui-monospace,Menlo,monospace; font-size:11px; }
.bc-dev-switch { width:40px; height:22px; padding:2px; background:#11141a;
  border:1px solid var(--p-line); border-radius:11px; cursor:pointer; display:block; }
.bc-dev-switch span { display:block; width:16px; height:16px; border-radius:50%;
  background:var(--p-dim); transition:transform .15s ease, background .15s ease; }
.bc-dev-switch[aria-checked="true"] { border-color:var(--p-accent); }
.bc-dev-switch[aria-checked="true"] span { transform:translateX(18px); background:var(--p-accent); }

.bc-dev-foot { display:flex; gap:8px; padding:10px 12px; border-top:1px solid var(--p-line); }
.bc-dev-foot button { flex:1; padding:8px 10px; background:#11141a; color:var(--p-text);
  border:1px solid var(--p-line); border-radius:6px; font:inherit; font-weight:500; cursor:pointer; }
.bc-dev-foot button:hover:not(:disabled) { border-color:#3a4150; }
.bc-dev-foot button:disabled { opacity:.4; cursor:default; }
.bc-dev-primary { background:var(--p-accent) !important; border-color:var(--p-accent) !important;
  color:#0b1020 !important; font-weight:600 !important; }
[data-bc-dev] :focus-visible { outline:2px solid var(--p-accent); outline-offset:2px; }
`;

const STORAGE_KEY = "bc:proto";
const PANEL_ID = "bc-dev-toolbar";

/**
 * Read saved settings during the first render rather than in an effect.
 *
 * An effect that calls setState is a second render pass for a value that is
 * known before the first one, and the repo's lint rejects it. The window guard
 * would normally be a hydration hazard — a server/client branch during render —
 * but nothing is rendered until `useHydrated()` flips, so both passes output
 * null and there is no markup to disagree about.
 */
function readStored(): Record<string, ControlValue> {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    // Corrupt or unavailable storage is not worth a broken toolbar.
    return DEFAULTS;
  }
}

export function DevToolbar() {
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, ControlValue>>(readStored);
  const [group, setGroup] = useState<GroupId>("shape");
  const [copied, setCopied] = useState(false);
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const fontRef = useRef<HTMLLinkElement | null>(null);

  /* --- Apply -------------------------------------------------------------
   * Appended to <head> so it lands after Next's stylesheet, and left unlayered
   * so it outranks every Tailwind utility without `!important` — which keeps
   * the generated CSS paste-able. */
  useEffect(() => {
    if (!hydrated) return;
    if (!styleRef.current) {
      const el = document.createElement("style");
      el.id = "bc-proto-overrides";
      document.head.appendChild(el);
      styleRef.current = el;
    }
    // Scoped on the way in; `buildCss` output is what Copy CSS hands you.
    styleRef.current.textContent = scopeCss(buildCss(values));

    const href = fontHref(values);
    if (href) {
      if (!fontRef.current) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        document.head.appendChild(link);
        fontRef.current = link;
      }
      if (fontRef.current.href !== href) fontRef.current.href = href;
    } else if (fontRef.current) {
      fontRef.current.remove();
      fontRef.current = null;
    }

    try {
      const diff = Object.fromEntries(
        Object.entries(values).filter(([k, v]) => v !== DEFAULTS[k])
      );
      if (Object.keys(diff).length) localStorage.setItem(STORAGE_KEY, JSON.stringify(diff));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, [values, hydrated]);

  /* --- Toggle with a key, so the panel can get out of the way ------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      if (e.key.toLowerCase() === "d" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const set = useCallback((id: string, v: ControlValue) => {
    setValues((prev) => ({ ...prev, [id]: v }));
  }, []);

  const reset = useCallback(() => setValues(DEFAULTS), []);

  const copy = useCallback(async () => {
    const css = buildCss(values);
    try {
      await navigator.clipboard.writeText(css || "/* nothing changed yet */");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be blocked; fall back to a selectable prompt.
      window.prompt("Copy the CSS:", css);
    }
  }, [values]);

  const changed = useMemo(() => countChanged(values), [values]);
  const shown = useMemo(() => CONTROLS.filter((c) => c.group === group), [group]);

  if (!hydrated) return null;

  if (!open) {
    return (
      <>
        <style>{PANEL_CSS}</style>
        <button
        type="button"
        onClick={() => setOpen(true)}
        className="bc-dev-fab"
        data-bc-dev=""
        title="Design toolbar (D)"
      >
        <span className="bc-dev-fab-mark" aria-hidden />
        Design
          {changed > 0 ? <span className="bc-dev-badge">{changed}</span> : null}
        </button>
      </>
    );
  }

  return (
    <>
      <style>{PANEL_CSS}</style>
      <aside
      id={PANEL_ID}
      data-bc-dev=""
      className="bc-dev-panel"
      aria-label="Design prototyping toolbar"
    >
      <header className="bc-dev-head">
        <strong>Design</strong>
        <span className="bc-dev-count">
          {changed === 0 ? "unchanged" : `${changed} changed`}
        </span>
        <button type="button" onClick={() => setOpen(false)} title="Hide (D)">
          ✕
        </button>
      </header>

      <nav className="bc-dev-tabs">
        {GROUPS.map((g) => (
          <button
            key={g.id}
            type="button"
            data-active={g.id === group}
            onClick={() => setGroup(g.id)}
          >
            {g.label}
          </button>
        ))}
      </nav>

      <div className="bc-dev-body">
        {shown.map((c) => {
          const v = values[c.id] ?? c.def;
          const isChanged = v !== c.def;
          return (
            <div key={c.id} className="bc-dev-row" data-changed={isChanged}>
              <label htmlFor={`bc-${c.id}`}>
                <span>{c.label}</span>
                <span className="bc-dev-val">
                  {c.kind === "range"
                    ? `${Number(v)}${c.unit ?? ""}`
                    : c.kind === "toggle"
                      ? v
                        ? "on"
                        : "off"
                      : c.kind === "color"
                        ? String(v)
                        : ""}
                </span>
              </label>

              {c.kind === "range" ? (
                <input
                  id={`bc-${c.id}`}
                  type="range"
                  min={c.min}
                  max={c.max}
                  step={c.step}
                  value={Number(v)}
                  onChange={(e) => set(c.id, Number(e.target.value))}
                />
              ) : c.kind === "color" ? (
                <span className="bc-dev-colour">
                  <input
                    id={`bc-${c.id}`}
                    type="color"
                    value={String(v)}
                    onChange={(e) => set(c.id, e.target.value)}
                  />
                  <input
                    type="text"
                    aria-label={`${c.label} hex`}
                    value={String(v)}
                    onChange={(e) => set(c.id, e.target.value)}
                    spellCheck={false}
                  />
                </span>
              ) : c.kind === "select" ? (
                <select
                  id={`bc-${c.id}`}
                  value={String(v)}
                  onChange={(e) => set(c.id, e.target.value)}
                >
                  {c.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <button
                  id={`bc-${c.id}`}
                  type="button"
                  className="bc-dev-switch"
                  role="switch"
                  aria-checked={Boolean(v)}
                  onClick={() => set(c.id, !v)}
                >
                  <span />
                </button>
              )}

              {c.hint ? <p className="bc-dev-hint">{c.hint}</p> : null}
            </div>
          );
        })}
      </div>

      <footer className="bc-dev-foot">
        <button type="button" onClick={reset} disabled={changed === 0}>
          Reset
        </button>
        <button type="button" onClick={copy} className="bc-dev-primary">
          {copied ? "Copied" : "Copy CSS"}
        </button>
      </footer>
      </aside>
    </>
  );
}
