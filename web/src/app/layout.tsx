import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { getSystemReadiness } from "@/lib/system-readiness";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Findmyroom",
  description: "Findmyroom - annonces de colocation a Bruxelles.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const readiness = await getSystemReadiness();

  return (
    <html lang="fr" className={`${manrope.variable} ${fraunces.variable} h-full antialiased`}>
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
