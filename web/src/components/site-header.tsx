import Link from "next/link";
import Image from "next/image";
import { signOut } from "@/app/actions/auth";
import { ensureAndGetCurrentUserRole, isAdminRole } from "@/lib/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function SiteHeader() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let hasPostedListing = false;
  let isAdmin = false;

  if (user) {
    const [listingResponse, role] = await Promise.all([
      supabase.from("listings").select("id").eq("user_id", user.id).limit(1),
      ensureAndGetCurrentUserRole(supabase, user),
    ]);
    const { data: listingRows } = listingResponse;
    hasPostedListing = Boolean(listingRows?.length);
    isAdmin = isAdminRole(role);
  }

  return (
    <header className="border-b border-stone-200 bg-white/90">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center">
          <Image src="/findmyrooom-logo.png" alt="findmyroom.be" width={190} height={37} priority />
        </Link>

        <nav className="flex items-center gap-2 text-sm sm:gap-3">
          <Link href="/annonces" className="rounded-md px-3 py-2 text-stone-700 hover:bg-[#fee9e6] hover:text-[#ba4d40]">
            Annonces
          </Link>
          <Link href="/deposer" className="rounded-md px-3 py-2 text-stone-700 hover:bg-[#fee9e6] hover:text-[#ba4d40]">
            Deposer
          </Link>

          {user ? (
            <>
              <Link
                href="/mes-annonces"
                className="rounded-md px-3 py-2 text-stone-700 hover:bg-[#fee9e6] hover:text-[#ba4d40]"
              >
                Mes annonces
              </Link>
              {isAdmin ? (
                <Link href="/clients" className="rounded-md px-3 py-2 text-stone-700 hover:bg-[#fee9e6] hover:text-[#ba4d40]">
                  Clients
                </Link>
              ) : null}
              {hasPostedListing || isAdmin ? (
                <Link
                  href="/statistiques"
                  className="rounded-md px-3 py-2 text-stone-700 hover:bg-[#fee9e6] hover:text-[#ba4d40]"
                >
                  Statistiques
                </Link>
              ) : null}
              <form action={signOut}>
                <button
                  type="submit"
                  className="cursor-pointer rounded-md border border-[#efc6c1] px-3 py-2 text-stone-700 hover:bg-[#fee9e6] hover:text-[#ba4d40]"
                >
                  Se deconnecter
                </button>
              </form>
            </>
          ) : (
            <Link href="/connexion" className="btn btn-primary">
              Connexion
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
