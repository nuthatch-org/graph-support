import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ask Graphy",
  description: "An astronaut hedgehog who answers questions about The Graph: subgraphs, indexers, the gateway and the rest.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
