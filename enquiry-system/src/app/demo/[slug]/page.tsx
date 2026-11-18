import Script from "next/script";

/**
 * A stand-in for a client's website, for local testing and sales demos.
 * Embeds the widget exactly the way a client site would: one script tag.
 */
export default async function DemoHostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <main className="page demo-host">
      <p className="demo-host__badge">Demo website</p>
      <h1>A client&apos;s website</h1>
      <p>
        This page stands in for a client site. The assistant in the corner is loaded with a single script tag, the
        same snippet the client pastes into WordPress, Wix or a Next.js layout:
      </p>
      <pre>{`<script src="https://YOUR-APP/widget.js" data-tenant="${slug}" async></script>`}</pre>
      <Script src="/widget.js" data-tenant={slug} strategy="afterInteractive" />
    </main>
  );
}
