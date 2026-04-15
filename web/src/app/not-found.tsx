import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page">
      <div className="panel space-y-4 p-8 text-center">
        <h1 className="font-serif text-4xl text-stone-900">Annonce introuvable</h1>
        <p className="text-stone-700">Le lien est invalide ou l&apos;annonce n&apos;est plus disponible.</p>
        <div className="flex justify-center gap-3">
          <Link href="/annonces" className="btn btn-primary">
            Retour aux annonces
          </Link>
          <Link href="/" className="btn btn-ghost">
            Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
