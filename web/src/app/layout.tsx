import type { Metadata } from "next";
import { Lato } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
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
  title: "FindMyRoom",
  description: "FindMyRoom - annonces de colocation à Bruxelles.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/logo-icon.png" }],
  },
  openGraph: {
    title: "FindMyRoom",
    description: "FindMyRoom - annonces de colocation à Bruxelles.",
    images: [{ url: "/findmyrooom-logo.png", width: 1650, height: 318, alt: "FindMyRoom" }],
  },
  twitter: {
    card: "summary",
    title: "FindMyRoom",
    description: "FindMyRoom - annonces de colocation à Bruxelles.",
    images: ["/findmyrooom-logo.png"],
  },
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const readiness = await getSystemReadiness();

  return (
    <html lang={locale} className={`${lato.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <div className="flex min-h-full flex-col">
            <SiteHeader locale={locale} />
            {!readiness.ok ? (
              <div className="border-y border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
                Setup incomplet: {readiness.issues.join(" ")}
              </div>
            ) : null}
            <main className="flex-1 py-8">{children}</main>
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
