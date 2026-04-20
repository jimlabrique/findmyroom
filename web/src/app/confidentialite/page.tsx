import { getLocale } from "next-intl/server";
import { LegalDocument } from "@/components/legal-document";
import { getLegalDocument } from "@/lib/legal-documents";
import type { AppLocale } from "@/lib/i18n/locales";

export const dynamic = "force-dynamic";

export default async function ConfidentialitePage() {
  const locale = (await getLocale()) as AppLocale;
  const document = getLegalDocument("confidentialite", locale);

  return <LegalDocument document={document} />;
}
