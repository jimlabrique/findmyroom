import { getRequestConfig } from "next-intl/server";
import { getRequestLocale } from "@/lib/i18n/request-locale";

export default getRequestConfig(async () => {
  const locale = await getRequestLocale();
  const messages = (await import(`../../messages/${locale}.json`)).default;

  return {
    locale,
    messages,
    timeZone: "Europe/Brussels",
  };
});
