import type { LegalDocument } from "@/lib/legal-documents";

type LegalDocumentProps = {
  document: LegalDocument;
};

export function LegalDocument({ document }: LegalDocumentProps) {
  return (
    <div className="container-page max-w-4xl">
      <article className="panel space-y-8 p-6 sm:p-8">
        <header className="space-y-2 border-b border-stone-200 pb-5">
          <h1 className="font-serif text-3xl text-stone-900 sm:text-4xl">{document.title}</h1>
          {document.lastUpdated ? <p className="text-sm text-stone-500">{document.lastUpdated}</p> : null}
        </header>

        <div className="space-y-7 text-sm leading-7 text-stone-800 sm:text-base">
          {document.sections.map((section) => (
            <section key={section.heading} className="space-y-2">
              <h2 className="text-base font-semibold text-stone-900 sm:text-lg">{section.heading}</h2>

              {section.paragraphs?.map((paragraph) => (
                <p key={`${section.heading}-${paragraph}`}>{paragraph}</p>
              ))}

              {section.bullets?.length ? (
                <ul className="list-disc space-y-1 pl-5">
                  {section.bullets.map((bullet) => (
                    <li key={`${section.heading}-${bullet}`}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}
