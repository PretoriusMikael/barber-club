import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Intelligent Enquiry System",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA">
      <body>{children}</body>
    </html>
  );
}
