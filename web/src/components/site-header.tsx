import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function SiteHeader() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let hasPostedListing = false;

  if (user) {
    const { data: listingRows } = await supabase
      .from("listings")
      .select("id")
      .eq("user_id", user.id)
      .limit(1);
    hasPostedListing = Boolean(listingRows?.length);
  }

  return (
    <header className="border-b border-stone-200 bg-white/90">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-xl font-semibold tracking-tight text-stone-900">
          Findmyroom
        </Link>

        <nav className="flex items-center gap-2 text-sm sm:gap-3">
          <Link href="/annonces" className="rounded-md px-3 py-2 text-stone-700 hover:bg-stone-100">
            Annonces
          </Link>
          <Link href="/deposer" className="rounded-md px-3 py-2 text-stone-700 hover:bg-stone-100">
            Deposer
          </Link>

          {user ? (
            <>
              <Link href="/mes-annonces" className="rounded-md px-3 py-2 text-stone-700 hover:bg-stone-100">
                Mes annonces
              </Link>
              {hasPostedListing ? (
                <Link href="/statistiques" className="rounded-md px-3 py-2 text-stone-700 hover:bg-stone-100">
                  Statistiques
                </Link>
              ) : null}
              <form action={signOut}>
                <button
                  type="submit"
                  className="cursor-pointer rounded-md border border-stone-300 px-3 py-2 text-stone-700 hover:bg-stone-100"
                >
                  Se deconnecter
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/connexion"
              className="rounded-md bg-orange-600 px-3 py-2 font-medium text-white hover:bg-orange-700"
            >
              Connexion
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
