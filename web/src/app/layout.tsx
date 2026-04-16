import type { Metadata } from "next";
import { Lato } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { getSystemReadiness } from "@/lib/system-readiness";
import "./globals.css";

const lato = Lato({
  variable: "--font-lato",
  weight: ["400", "700", "900"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.findmyroom.be"),
  title: "findmyroom.be",
  description: "findmyroom.be - annonces de colocation a Bruxelles.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/logo-icon.png" }],
  },
  openGraph: {
    title: "findmyroom.be",
    description: "findmyroom.be - annonces de colocation a Bruxelles.",
    images: [{ url: "/findmyrooom-logo.png", width: 1650, height: 318, alt: "findmyroom.be" }],
  },
  twitter: {
    card: "summary",
    title: "findmyroom.be",
    description: "findmyroom.be - annonces de colocation a Bruxelles.",
    images: ["/findmyrooom-logo.png"],
  },
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const readiness = await getSystemReadiness();

  return (
    <html lang="fr" className={`${lato.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <div className="flex min-h-full flex-col">
          <SiteHeader />
          {!readiness.ok ? (
            <div className="border-y border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
              Setup incomplet: {readiness.issues.join(" ")}
            </div>
          ) : null}
          <main className="flex-1 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
