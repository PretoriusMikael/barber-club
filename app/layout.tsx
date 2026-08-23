import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import "../globals.css";
import { site } from "@/content/site";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { StickyCta } from "@/components/layout/StickyCta";
import { JsonLd, organizationSchema } from "@/lib/schema";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Barber Club | Barber Shops Across the Cape Winelands",
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  keywords: [
    "barber Paarl",
    "barber Stellenbosch",
    "barber Wellington",
    "barber Malmesbury",
    "barber Durbanville",
    "barber Franschhoek",
    "blade fade",
    "hot towel shave",
    "beard trim",
    "groomsmen packages",
  ],
  openGraph: {
    type: "website",
    locale: "en_ZA",
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    url: site.url,
    // TODO: add /public/og.jpg (1200×630). Barber links get shared in WhatsApp
    // groups constantly, so the OG image matters more here than on most sites.
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0c",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning is scoped to <html> and earns its place: the
    // inline script below deliberately strips `no-js` from this element BEFORE
    // React hydrates, so the server markup and the live DOM are always meant to
    // differ here by exactly one class. React 19 reports that as an attribute
    // mismatch on every single page load, which buries real hydration bugs in
    // noise. It suppresses the warning for this element's attributes only —
    // children are still checked normally.
    <html
      lang="en-ZA"
      className={`no-js ${bebas.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Drops `.no-js` before first paint so scroll-reveal can take over.
            With JS disabled the class stays and globals.css keeps every
            `.reveal` block visible — content is never hidden behind a script
            on a conversion path. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.remove('no-js')`,
          }}
        />
        {/* One Organization for the brand; each branch page emits its own
            HairSalon linked back to this @id. */}
        <JsonLd data={organizationSchema()} />
      </head>
      <body className="antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:bg-brass focus:px-4 focus:py-2 focus:text-ink"
        >
          Skip to content
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <StickyCta />
      </body>
    </html>
  );
}
