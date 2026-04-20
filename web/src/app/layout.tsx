import type { Metadata } from "next";
import { Lato } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";
import { getSystemReadiness } from "@/lib/system-readiness";
import type { AppLocale } from "@/lib/i18n/locales";
import "./globals.css";

const lato = Lato({
  variable: "--font-lato",
  weight: ["400", "700", "900"],
  subsets: ["latin"],
});

const METADATA_DESCRIPTION: Record<AppLocale, string> = {
  fr: "FindMyRoom - annonces de colocation à Bruxelles.",
  en: "FindMyRoom - shared housing listings in Brussels.",
  nl: "FindMyRoom - cohousing advertenties in Brussel.",
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const description = METADATA_DESCRIPTION[locale] ?? METADATA_DESCRIPTION.fr;

  return {
    metadataBase: new URL("https://www.findmyroom.be"),
    title: "FindMyRoom",
    description,
    icons: {
      icon: [{ url: "/favicon.svg?v=20260420", type: "image/svg+xml" }],
      shortcut: [{ url: "/favicon.svg?v=20260420", type: "image/svg+xml" }],
      apple: [{ url: "/logo-icon.png?v=20260420" }],
    },
    openGraph: {
      title: "FindMyRoom",
      description,
      images: [{ url: "/findmyrooom-logo.png?v=20260420", width: 1650, height: 318, alt: "FindMyRoom" }],
    },
    twitter: {
      card: "summary",
      title: "FindMyRoom",
      description,
      images: ["/findmyrooom-logo.png?v=20260420"],
    },
  };
}

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const tLayout = await getTranslations("layout");
  const readiness = await getSystemReadiness();

  return (
    <html lang={locale} className={`${lato.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <div className="flex min-h-full flex-col">
            <SiteHeader locale={locale} />
            {!readiness.ok ? (
              <div className="border-y border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
                {tLayout("setupIncomplete", { issues: readiness.issues.join(" ") })}
              </div>
            ) : null}
            <main className="flex-1 py-8">{children}</main>
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
