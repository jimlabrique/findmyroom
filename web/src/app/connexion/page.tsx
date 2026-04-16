import Link from "next/link";
import { signInWithGoogle } from "@/app/actions/auth";

type ConnexionPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ConnexionPage({ searchParams }: ConnexionPageProps) {
  const query = await searchParams;
  const next = typeof query.next === "string" ? query.next : "/";
  const error = typeof query.error === "string" ? query.error : null;

  return (
    <div className="container-page max-w-xl">
      <div className="panel space-y-5 p-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">Connexion</p>
        <h1 className="font-serif text-3xl text-stone-900">Accède à ton espace annonceur</h1>
        <p className="text-sm text-stone-700">
          Connexion Google uniquement en V1. Pas de mot de passe à gérer, onboarding plus rapide.
        </p>

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Erreur de connexion: {error}
          </p>
        ) : null}

        <form action={signInWithGoogle}>
          <input type="hidden" name="next" value={next} />
          <button type="submit" className="btn btn-primary w-full">
            Continuer avec Google
          </button>
        </form>

        <p className="text-sm text-stone-600">
          Retour à la recherche:{" "}
          <Link href="/annonces" className="font-medium link-brand">
            voir les annonces
          </Link>
        </p>
      </div>
    </div>
  );
}
