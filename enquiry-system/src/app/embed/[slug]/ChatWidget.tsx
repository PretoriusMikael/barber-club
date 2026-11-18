"use client";

import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import type { PublicTenant } from "@/lib/tenants/schema";
import type { ChatResponse } from "@/app/api/chat/route";

type Role = "user" | "assistant";
interface Message {
  role: Role;
  content: string;
}
interface Stored {
  conversationId: string | null;
  messages: Message[];
  leadCaptured: boolean;
}
type Mode = "intro" | "chat" | "form" | "form-sent";

const storageKey = (slug: string) => `enquiry:${slug}`;

function readStored(slug: string): Stored | null {
  try {
    const raw = sessionStorage.getItem(storageKey(slug));
    return raw ? (JSON.parse(raw) as Stored) : null;
  } catch {
    return null;
  }
}

/**
 * Rendered client-only (see ClientWidget.tsx), so the initial state can be
 * read straight from sessionStorage without a hydration mismatch.
 */
export function ChatWidget({ tenant }: { tenant: PublicTenant }) {
  // Restore an in-progress conversation (same browser tab session only).
  const [stored] = useState(() => readStored(tenant.slug));
  const [mode, setMode] = useState<Mode>(stored?.conversationId ? "chat" : "intro");
  const [conversationId, setConversationId] = useState<string | null>(stored?.conversationId ?? null);
  const [messages, setMessages] = useState<Message[]>(stored?.messages ?? []);
  const [leadCaptured, setLeadCaptured] = useState(stored?.leadCaptured ?? false);
  const [actions, setActions] = useState<ChatResponse["actions"]>({});
  const [degraded, setDegraded] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLOListElement>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!conversationId) return;
    sessionStorage.setItem(storageKey(tenant.slug), JSON.stringify({ conversationId, messages, leadCaptured } satisfies Stored));
  }, [tenant.slug, conversationId, messages, leadCaptured]);

  useEffect(() => {
    listRef.current?.lastElementChild?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages, pending]);

  function close() {
    window.parent?.postMessage({ type: "enquiry:close" }, "*");
  }

  function reset() {
    sessionStorage.removeItem(storageKey(tenant.slug));
    setConversationId(null);
    setMessages([]);
    setLeadCaptured(false);
    setActions({});
    setDegraded(false);
    setMode("intro");
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || pending) return;

    setDraft("");
    setError(null);
    setMessages((m) => [...m, { role: "user", content: text }]);
    setPending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant: tenant.slug,
          conversationId: conversationId ?? undefined,
          message: text,
          consent: conversationId ? undefined : true,
          pageUrl: new URLSearchParams(window.location.search).get("page") ?? undefined,
          website: honeypotRef.current?.value || undefined,
        }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (data?.error?.code === "conversation_not_found") {
          reset();
          return;
        }
        setError(data?.error?.message ?? "Something went wrong. Please try again.");
        if (res.status >= 500) setDegraded(true);
        return;
      }

      const reply = data as ChatResponse;
      setConversationId(reply.conversationId);
      setMessages((m) => [...m, { role: "assistant", content: reply.reply }]);
      setLeadCaptured(reply.leadCaptured);
      setActions(reply.actions);
      setDegraded(reply.degraded);
    } catch {
      setError("You appear to be offline. Please check your connection.");
    } finally {
      setPending(false);
    }
  }

  const style = { "--accent": tenant.accent } as CSSProperties;

  return (
    <div className="widget" style={style}>
      <header className="widget__header">
        <div>
          <p className="widget__title">{tenant.assistantName}</p>
          <p className="widget__subtitle">{tenant.name}</p>
        </div>
        <div className="widget__header-actions">
          {mode === "chat" && (
            <button type="button" className="widget__icon-btn" onClick={reset} aria-label="Start a new conversation">
              New
            </button>
          )}
          <button type="button" className="widget__icon-btn" onClick={close} aria-label="Close chat">
            ✕
          </button>
        </div>
      </header>

      {mode === "intro" && (
        <section className="widget__intro">
          <p>{tenant.greeting}</p>
          <p className="widget__notice">
            This assistant uses AI and can make mistakes; it only answers from information provided by {tenant.name}.
            What you share is used to respond to your enquiry, in line with the{" "}
            <a href={tenant.privacyNoticeUrl} target="_blank" rel="noopener noreferrer">
              privacy notice
            </a>
            .
          </p>
          <button type="button" className="widget__primary" onClick={() => setMode("chat")}>
            Start chat
          </button>
          <button type="button" className="widget__link" onClick={() => setMode("form")}>
            Prefer a form? Send an enquiry instead
          </button>
        </section>
      )}

      {mode === "chat" && (
        <>
          <ol className="widget__messages" ref={listRef} aria-live="polite">
            <li className="msg msg--assistant">{tenant.greeting}</li>
            {messages.map((m, i) => (
              <li key={i} className={`msg msg--${m.role}`}>
                {m.content}
              </li>
            ))}
            {pending && (
              <li className="msg msg--assistant msg--typing" aria-label="Assistant is typing">
                <span />
                <span />
                <span />
              </li>
            )}
          </ol>

          {(leadCaptured || actions.booking || actions.contact || degraded) && (
            <div className="widget__actions">
              {leadCaptured && <p className="widget__status">✓ Your details have been passed to the team.</p>}
              {actions.booking && (
                <a className="widget__chip widget__chip--accent" href={actions.booking.url} target="_blank" rel="noopener noreferrer">
                  {actions.booking.label}
                </a>
              )}
              {actions.contact?.phone && (
                <a className="widget__chip" href={`tel:${actions.contact.phone.replace(/\s/g, "")}`}>
                  Call {actions.contact.phone}
                </a>
              )}
              {actions.contact?.whatsapp && (
                <a className="widget__chip" href={`https://wa.me/${actions.contact.whatsapp}`} target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>
              )}
              {degraded && (
                <button type="button" className="widget__chip" onClick={() => setMode("form")}>
                  Send an enquiry form
                </button>
              )}
            </div>
          )}

          {error && (
            <p className="widget__error" role="alert">
              {error}
            </p>
          )}

          <form className="widget__composer" onSubmit={send}>
            <input ref={honeypotRef} className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
            <label htmlFor="enquiry-message" className="sr-only">
              Your message
            </label>
            <textarea
              id="enquiry-message"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
              maxLength={1000}
              rows={1}
              placeholder="Type your message…"
              disabled={pending}
            />
            <button type="submit" className="widget__send" disabled={pending || !draft.trim()} aria-label="Send">
              ➤
            </button>
          </form>
        </>
      )}

      {mode === "form" && <EnquiryForm tenant={tenant} onSent={() => setMode("form-sent")} onBack={() => setMode(conversationId ? "chat" : "intro")} />}

      {mode === "form-sent" && (
        <section className="widget__intro">
          <p>Thank you — your enquiry has been sent to {tenant.name}. They will be in touch.</p>
          <button type="button" className="widget__primary" onClick={close}>
            Close
          </button>
        </section>
      )}
    </div>
  );
}

function EnquiryForm({ tenant, onSent, onBack }: { tenant: PublicTenant; onSent: () => void; onBack: () => void }) {
  // One key per form render: a double-click or a retry after a timeout cannot create two leads.
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant: tenant.slug,
          name: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone"),
          enquiryType: form.get("enquiryType"),
          message: form.get("message"),
          consent: form.get("consent") === "on",
          idempotencyKey,
          website: form.get("website") || undefined,
        }),
      });
      if (res.ok) return onSent();
      const data = await res.json().catch(() => null);
      setError(data?.error?.message ?? "Could not send. Please try again.");
    } catch {
      setError("You appear to be offline. Please check your connection.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="widget__form" onSubmit={submit}>
      <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <label>
        Name
        <input name="name" required maxLength={80} autoComplete="name" />
      </label>
      <label>
        Phone
        <input name="phone" type="tel" maxLength={40} autoComplete="tel" />
      </label>
      <label>
        Email
        <input name="email" type="email" maxLength={254} autoComplete="email" />
      </label>
      <label>
        What is it about?
        <select name="enquiryType" defaultValue={tenant.enquiryTypes[0]?.key}>
          {tenant.enquiryTypes.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Message
        <textarea name="message" required minLength={5} maxLength={2000} rows={4} />
      </label>
      <label className="widget__consent">
        <input type="checkbox" name="consent" required />
        <span>
          I agree that {tenant.name} may use these details to respond to my enquiry (
          <a href={tenant.privacyNoticeUrl} target="_blank" rel="noopener noreferrer">
            privacy notice
          </a>
          ).
        </span>
      </label>
      {error && (
        <p className="widget__error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="widget__primary" disabled={pending}>
        {pending ? "Sending…" : "Send enquiry"}
      </button>
      <button type="button" className="widget__link" onClick={onBack}>
        Back
      </button>
    </form>
  );
}
