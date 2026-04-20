import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { signInWithGoogle, signInWithPassword, signUpWithEmailPassword } from "@/app/actions/auth";
import type { AppLocale } from "@/lib/i18n/locales";
import { withLocalePath } from "@/lib/i18n/pathname";

type ConnexionPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function humanizeAuthError(errorCode: string | null) {
  const t = await getTranslations("auth.errors");
  if (!errorCode) return null;

  switch (errorCode) {
    case "invalid_next":
      return t("invalid_next");
    case "google_oauth_failed":
      return t("google_oauth_failed");
    case "invalid_email":
      return t("invalid_email");
    case "missing_password":
      return t("missing_password");
    case "password_too_short":
      return t("password_too_short");
    case "email_not_confirmed":
      return t("email_not_confirmed");
    case "invalid_credentials":
      return t("invalid_credentials");
    case "auth_rate_limited":
      return t("auth_rate_limited");
    default:
      return errorCode;
  }
}

function getAuthMode(mode: string | string[] | undefined, checkEmail: boolean) {
  if (checkEmail) return "signup";
  if (typeof mode === "string" && mode === "signup") return "signup";
  return "signin";
}

export default async function ConnexionPage({ searchParams }: ConnexionPageProps) {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("auth");
  const query = await searchParams;
  const next = typeof query.next === "string" ? query.next : withLocalePath("/annonces", locale);
  const error = typeof query.error === "string" ? query.error : null;
  const checkEmail = query.check_email === "1";
  const confirmed = query.confirmed === "1";
  const accountDeleted = query.account_deleted === "1";
  const authError = await humanizeAuthError(error);
  const mode = getAuthMode(query.mode, checkEmail);
  const isSignup = mode === "signup";
  const toggleModeHref = `${withLocalePath("/connexion", locale)}?mode=${isSignup ? "signin" : "signup"}&next=${encodeURIComponent(next)}`;
  const listingsHref = withLocalePath("/annonces", locale);

  return (
    <div className="container-page max-w-xl">
      <section className="panel space-y-5 p-8">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">{isSignup ? t("signupTag") : t("signinTag")}</p>
          <h1 className="font-serif text-3xl text-stone-900">{isSignup ? t("signupTitle") : t("signinTitle")}</h1>
          <p className="text-sm text-stone-700">
            {isSignup
              ? t("signupSubtitle")
              : t("signinSubtitle")}
          </p>
        </div>

        {authError ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {t("errorPrefix")}: {authError}
          </p>
        ) : null}
        {checkEmail ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {t("messages.checkEmail")}
          </p>
        ) : null}
        {confirmed ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {t("messages.confirmed")}
          </p>
        ) : null}
        {accountDeleted ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {t("messages.accountDeleted")}
          </p>
        ) : null}

        {isSignup ? (
          <form action={signUpWithEmailPassword} className="space-y-3">
            <input type="hidden" name="next" value={next} />
            <div>
              <label className="label" htmlFor="signup-email">
                {t("email")}
              </label>
              <input id="signup-email" name="email" type="email" required className="input" autoComplete="email" />
            </div>
            <div>
              <label className="label" htmlFor="signup-password">
                {t("password")}
              </label>
              <input
                id="signup-password"
                name="password"
                type="password"
                minLength={8}
                required
                className="input"
                autoComplete="new-password"
              />
            </div>
            <button type="submit" className="btn btn-primary w-full">
              {t("signupButton")}
            </button>
          </form>
        ) : (
          <>
            <form action={signInWithPassword} className="space-y-3">
              <input type="hidden" name="next" value={next} />
              <div>
                <label className="label" htmlFor="signin-email">
                  {t("email")}
                </label>
                <input id="signin-email" name="email" type="email" required className="input" autoComplete="email" />
              </div>
              <div>
                <label className="label" htmlFor="signin-password">
                  {t("password")}
                </label>
                <input
                  id="signin-password"
                  name="password"
                  type="password"
                  required
                  className="input"
                  autoComplete="current-password"
                />
              </div>
              <button type="submit" className="btn btn-primary w-full">
                {t("signinButton")}
              </button>
            </form>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-stone-500">{t("or")}</p>
              <form action={signInWithGoogle}>
                <input type="hidden" name="next" value={next} />
                <button type="submit" className="btn btn-ghost w-full">
                  {t("googleButton")}
                </button>
              </form>
            </div>
          </>
        )}

        <p className="text-sm text-stone-600">
          {isSignup ? t("alreadyHasAccount") : t("noAccountYet")}{" "}
          <Link href={toggleModeHref} className="font-medium link-brand">
            {isSignup ? t("switchToSignin") : t("switchToSignup")}
          </Link>
        </p>

        <p className="text-sm text-stone-600">
          {t("backToSearch")}:{" "}
          <Link href={listingsHref} className="font-medium link-brand">
            {t("seeListings")}
          </Link>
        </p>
      </section>
    </div>
  );
}
