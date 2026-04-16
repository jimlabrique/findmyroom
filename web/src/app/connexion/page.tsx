import Link from "next/link";
import { signInWithGoogle, signInWithPassword, signUpWithEmailPassword } from "@/app/actions/auth";

type ConnexionPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function humanizeAuthError(errorCode: string | null) {
  if (!errorCode) return null;

  switch (errorCode) {
    case "invalid_next":
      return "Redirection invalide.";
    case "google_oauth_failed":
      return "Connexion Google indisponible pour le moment.";
    case "invalid_email":
      return "Adresse email invalide.";
    case "missing_password":
      return "Mot de passe requis.";
    case "password_too_short":
      return "Le mot de passe doit contenir au moins 8 caractères.";
    case "email_not_confirmed":
      return "Confirme ton email avant de te connecter.";
    case "invalid_credentials":
      return "Email ou mot de passe incorrect.";
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
  const query = await searchParams;
  const next = typeof query.next === "string" ? query.next : "/";
  const error = typeof query.error === "string" ? query.error : null;
  const checkEmail = query.check_email === "1";
  const confirmed = query.confirmed === "1";
  const accountDeleted = query.account_deleted === "1";
  const authError = humanizeAuthError(error);
  const mode = getAuthMode(query.mode, checkEmail);
  const isSignup = mode === "signup";
  const toggleModeHref = `/connexion?mode=${isSignup ? "signin" : "signup"}&next=${encodeURIComponent(next)}`;

  return (
    <div className="container-page max-w-xl">
      <section className="panel space-y-5 p-8">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">{isSignup ? "Inscription" : "Connexion"}</p>
          <h1 className="font-serif text-3xl text-stone-900">{isSignup ? "Créer un compte" : "Accède à ton espace annonceur"}</h1>
          <p className="text-sm text-stone-700">
            {isSignup
              ? "Un email de confirmation sera envoyé avant la première connexion."
              : "Connecte-toi avec Google ou email + mot de passe."}
          </p>
        </div>

        {authError ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Erreur: {authError}</p>
        ) : null}
        {checkEmail ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Inscription enregistrée. Vérifie ta boîte mail et clique sur le lien de confirmation.
          </p>
        ) : null}
        {confirmed ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Email confirmé. Tu peux maintenant te connecter.
          </p>
        ) : null}
        {accountDeleted ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Ton compte a été supprimé.
          </p>
        ) : null}

        {isSignup ? (
          <form action={signUpWithEmailPassword} className="space-y-3">
            <input type="hidden" name="next" value={next} />
            <div>
              <label className="label" htmlFor="signup-email">
                Email
              </label>
              <input id="signup-email" name="email" type="email" required className="input" autoComplete="email" />
            </div>
            <div>
              <label className="label" htmlFor="signup-password">
                Mot de passe
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
              Créer mon compte
            </button>
          </form>
        ) : (
          <>
            <form action={signInWithPassword} className="space-y-3">
              <input type="hidden" name="next" value={next} />
              <div>
                <label className="label" htmlFor="signin-email">
                  Email
                </label>
                <input id="signin-email" name="email" type="email" required className="input" autoComplete="email" />
              </div>
              <div>
                <label className="label" htmlFor="signin-password">
                  Mot de passe
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
                Se connecter
              </button>
            </form>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-stone-500">Ou</p>
              <form action={signInWithGoogle}>
                <input type="hidden" name="next" value={next} />
                <button type="submit" className="btn btn-ghost w-full">
                  Continuer avec Google
                </button>
              </form>
            </div>
          </>
        )}

        <p className="text-sm text-stone-600">
          {isSignup ? "Déjà un compte ?" : "Pas encore de compte ?"}{" "}
          <Link href={toggleModeHref} className="font-medium link-brand">
            {isSignup ? "Se connecter" : "Créer un compte"}
          </Link>
        </p>

        <p className="text-sm text-stone-600">
          Retour à la recherche:{" "}
          <Link href="/annonces" className="font-medium link-brand">
            voir les annonces
          </Link>
        </p>
      </section>
    </div>
  );
}
