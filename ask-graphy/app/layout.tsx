import type { Metadata } from "next";
import "./globals.css";

const description = "An astronaut hedgehog who answers questions about The Graph: subgraphs, indexers, the gateway, TAP and rewards.";

export const metadata: Metadata = {
  metadataBase: new URL("https://ask-graphy.vercel.app"),
  title: "Ask Graphy",
  description,
  openGraph: { title: "Ask Graphy", description, url: "/", siteName: "Ask Graphy", type: "website" },
  twitter: { card: "summary_large_image", title: "Ask Graphy", description },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
