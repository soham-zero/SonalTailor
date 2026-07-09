import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sonal Tailor",
  description: "Built for Tailors of Sonal Boutique",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-boutique-cream">
        {children}
      </body>
    </html>
  );
}
