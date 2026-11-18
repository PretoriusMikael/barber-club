import Link from "next/link";

export default function Home() {
  return (
    <main className="page">
      <h1>Intelligent Enquiry System</h1>
      <p>Multi-tenant AI enquiry assistant. This app serves the widget, the API and (later) the client dashboard.</p>
      <ul>
        <li>
          <Link href="/demo/fynbos-plumbing-demo">Demo host page</Link> — a fake client website with the widget embedded
        </li>
        <li>
          <Link href="/embed/fynbos-plumbing-demo">Widget page</Link> — what loads inside the iframe
        </li>
      </ul>
    </main>
  );
}
