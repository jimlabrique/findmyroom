import type { AppLocale } from "@/lib/i18n/locales";

export type LegalDocumentSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type LegalDocument = {
  title: string;
  lastUpdated?: string;
  sections: LegalDocumentSection[];
};

export type LegalDocumentKey = "cgu" | "confidentialite";

const LEGAL_DOCUMENTS: Record<LegalDocumentKey, Record<AppLocale, LegalDocument>> = {
  cgu: {
    fr: {
      title: "Conditions Générales d’Utilisation (CGU)",
      sections: [
        {
          heading: "1. Éditeur du site",
          paragraphs: [
            "Le site FindMyRoom est édité par :",
            "Labrique Publishing",
            "28 rue Augustin Delporte, 1050 Bruxelles, Belgique",
            "Email : jim@la-brique.be",
          ],
        },
        {
          heading: "2. Objet",
          paragraphs: [
            "FindMyRoom est une plateforme en ligne permettant aux utilisateurs de publier des annonces de colocation et d'entrer en contact entre eux.",
          ],
        },
        {
          heading: "3. Accès au service",
          paragraphs: [
            "Le site est accessible gratuitement à tout utilisateur disposant d’un accès à Internet.",
            "Certaines fonctionnalités nécessitent la création d’un compte.",
          ],
        },
        {
          heading: "4. Compte utilisateur",
          paragraphs: ["L’utilisateur s’engage à :"],
          bullets: [
            "fournir des informations exactes",
            "ne pas usurper l’identité d’un tiers",
            "maintenir la confidentialité de ses identifiants",
          ],
        },
        {
          heading: "5. Publication d'annonces",
          paragraphs: ["L’utilisateur peut publier des annonces de colocation.", "Il s’engage à :"],
          bullets: [
            "publier des informations exactes et à jour",
            "ne pas publier de contenu illégal, trompeur ou frauduleux",
            "ne pas publier de contenu discriminatoire ou offensant",
          ],
        },
        {
          heading: "6. Mise en relation",
          paragraphs: [
            "FindMyRoom agit uniquement comme plateforme de mise en relation.",
            "FindMyRoom n’est pas partie aux accords entre utilisateurs et ne garantit pas la fiabilité des annonces ou des utilisateurs.",
            "Les utilisateurs sont seuls responsables des échanges et accords conclus.",
          ],
        },
        {
          heading: "7. Responsabilité",
          paragraphs: ["FindMyRoom ne peut être tenu responsable :"],
          bullets: [
            "des informations publiées par les utilisateurs",
            "des interactions entre utilisateurs",
            "des éventuels litiges ou dommages résultant de l’utilisation du service",
          ],
        },
        {
          heading: "8. Suppression de compte",
          paragraphs: ["FindMyRoom se réserve le droit de :"],
          bullets: ["suspendre ou supprimer un compte", "supprimer du contenu", "en cas de non-respect des présentes CGU"],
        },
        {
          heading: "9. Propriété intellectuelle",
          paragraphs: [
            "Le contenu du site (design, logo, code, etc.) est protégé.",
            "Toute reproduction sans autorisation est interdite.",
          ],
        },
        {
          heading: "10. Droit applicable",
          paragraphs: ["Les présentes CGU sont régies par le droit belge."],
        },
      ],
    },
    en: {
      title: "Terms of Use",
      sections: [
        {
          heading: "1. Website publisher",
          paragraphs: [
            "The FindMyRoom website is published by:",
            "Labrique Publishing",
            "28 rue Augustin Delporte, 1050 Brussels, Belgium",
            "Email: jim@la-brique.be",
          ],
        },
        {
          heading: "2. Purpose",
          paragraphs: [
            "FindMyRoom is an online platform that allows users to post flatshare listings and contact each other.",
          ],
        },
        {
          heading: "3. Access to the service",
          paragraphs: [
            "The website is freely accessible to any user with Internet access.",
            "Some features require creating an account.",
          ],
        },
        {
          heading: "4. User account",
          paragraphs: ["The user agrees to:"],
          bullets: [
            "provide accurate information",
            "not impersonate a third party",
            "keep login credentials confidential",
          ],
        },
        {
          heading: "5. Posting listings",
          paragraphs: ["Users may post flatshare listings.", "They agree to:"],
          bullets: [
            "publish accurate and up-to-date information",
            "not publish illegal, misleading, or fraudulent content",
            "not publish discriminatory or offensive content",
          ],
        },
        {
          heading: "6. Matching users",
          paragraphs: [
            "FindMyRoom acts only as a matching platform.",
            "FindMyRoom is not a party to agreements between users and does not guarantee the reliability of listings or users.",
            "Users are solely responsible for their exchanges and agreements.",
          ],
        },
        {
          heading: "7. Liability",
          paragraphs: ["FindMyRoom cannot be held liable for:"],
          bullets: [
            "information published by users",
            "interactions between users",
            "any disputes or damages resulting from use of the service",
          ],
        },
        {
          heading: "8. Account removal",
          paragraphs: ["FindMyRoom reserves the right to:"],
          bullets: [
            "suspend or delete an account",
            "remove content",
            "in case of non-compliance with these Terms",
          ],
        },
        {
          heading: "9. Intellectual property",
          paragraphs: [
            "Website content (design, logo, code, etc.) is protected.",
            "Any reproduction without authorization is prohibited.",
          ],
        },
        {
          heading: "10. Governing law",
          paragraphs: ["These Terms are governed by Belgian law."],
        },
      ],
    },
    nl: {
      title: "Algemene Gebruiksvoorwaarden",
      sections: [
        {
          heading: "1. Uitgever van de website",
          paragraphs: [
            "De website FindMyRoom wordt uitgegeven door:",
            "Labrique Publishing",
            "Augustin Delportestraat 28, 1050 Brussel, Belgie",
            "E-mail: jim@la-brique.be",
          ],
        },
        {
          heading: "2. Doel",
          paragraphs: [
            "FindMyRoom is een online platform waarmee gebruikers cohousing-advertenties kunnen publiceren en met elkaar in contact kunnen komen.",
          ],
        },
        {
          heading: "3. Toegang tot de dienst",
          paragraphs: [
            "De website is gratis toegankelijk voor elke gebruiker met internettoegang.",
            "Sommige functies vereisen het aanmaken van een account.",
          ],
        },
        {
          heading: "4. Gebruikersaccount",
          paragraphs: ["De gebruiker verbindt zich ertoe om:"],
          bullets: [
            "correcte informatie te verstrekken",
            "geen identiteit van derden aan te nemen",
            "de vertrouwelijkheid van inloggegevens te bewaren",
          ],
        },
        {
          heading: "5. Publicatie van advertenties",
          paragraphs: ["De gebruiker kan cohousing-advertenties publiceren.", "De gebruiker verbindt zich ertoe om:"],
          bullets: [
            "correcte en actuele informatie te publiceren",
            "geen illegale, misleidende of frauduleuze inhoud te publiceren",
            "geen discriminerende of beledigende inhoud te publiceren",
          ],
        },
        {
          heading: "6. Contact tussen gebruikers",
          paragraphs: [
            "FindMyRoom fungeert uitsluitend als contactplatform.",
            "FindMyRoom is geen partij bij overeenkomsten tussen gebruikers en garandeert de betrouwbaarheid van advertenties of gebruikers niet.",
            "Gebruikers zijn als enige verantwoordelijk voor hun uitwisselingen en afspraken.",
          ],
        },
        {
          heading: "7. Aansprakelijkheid",
          paragraphs: ["FindMyRoom kan niet aansprakelijk worden gesteld voor:"],
          bullets: [
            "informatie gepubliceerd door gebruikers",
            "interacties tussen gebruikers",
            "eventuele geschillen of schade als gevolg van het gebruik van de dienst",
          ],
        },
        {
          heading: "8. Verwijdering van account",
          paragraphs: ["FindMyRoom behoudt zich het recht voor om:"],
          bullets: [
            "een account op te schorten of te verwijderen",
            "inhoud te verwijderen",
            "bij niet-naleving van deze voorwaarden",
          ],
        },
        {
          heading: "9. Intellectuele eigendom",
          paragraphs: [
            "De inhoud van de website (design, logo, code, enz.) is beschermd.",
            "Elke reproductie zonder toestemming is verboden.",
          ],
        },
        {
          heading: "10. Toepasselijk recht",
          paragraphs: ["Deze voorwaarden worden beheerst door het Belgisch recht."],
        },
      ],
    },
  },
  confidentialite: {
    fr: {
      title: "Politique de confidentialité",
      sections: [
        {
          heading: "1. Données collectées",
          paragraphs: ["FindMyRoom collecte :"],
          bullets: ["adresse email", "informations de profil", "contenu des annonces", "données de navigation (cookies)"],
        },
        {
          heading: "2. Finalité",
          paragraphs: ["Les données sont utilisées pour :"],
          bullets: [
            "permettre la création de compte",
            "publier et gérer des annonces",
            "faciliter la mise en relation entre utilisateurs",
            "améliorer le service",
          ],
        },
        {
          heading: "3. Base légale",
          paragraphs: ["Le traitement repose sur :"],
          bullets: ["l’exécution du service", "le consentement de l’utilisateur"],
        },
        {
          heading: "4. Conservation des données",
          paragraphs: ["Les données sont conservées :"],
          bullets: ["pendant la durée d’utilisation du compte", "ou jusqu’à demande de suppression"],
        },
        {
          heading: "5. Partage des données",
          paragraphs: ["Les données ne sont pas vendues.", "Certaines données peuvent être visibles publiquement (annonces)."],
        },
        {
          heading: "6. Droits des utilisateurs",
          paragraphs: ["Conformément au RGPD, l’utilisateur peut :"],
          bullets: ["accéder à ses données", "les corriger", "demander leur suppression", "Contact : jim@la-brique.be"],
        },
        {
          heading: "7. Cookies",
          paragraphs: ["Le site peut utiliser des cookies pour :"],
          bullets: ["améliorer l’expérience utilisateur", "analyser l’usage du site"],
        },
        {
          heading: "8. Sécurité",
          paragraphs: ["FindMyRoom met en œuvre des mesures raisonnables pour protéger les données."],
        },
      ],
    },
    en: {
      title: "Privacy Policy",
      sections: [
        {
          heading: "1. Data collected",
          paragraphs: ["FindMyRoom collects:"],
          bullets: ["email address", "profile information", "listing content", "browsing data (cookies)"],
        },
        {
          heading: "2. Purpose",
          paragraphs: ["Data is used to:"],
          bullets: [
            "allow account creation",
            "publish and manage listings",
            "facilitate contact between users",
            "improve the service",
          ],
        },
        {
          heading: "3. Legal basis",
          paragraphs: ["Processing is based on:"],
          bullets: ["performance of the service", "user consent"],
        },
        {
          heading: "4. Data retention",
          paragraphs: ["Data is retained:"],
          bullets: ["for the duration of account usage", "or until deletion is requested"],
        },
        {
          heading: "5. Data sharing",
          paragraphs: ["Data is not sold.", "Some data may be publicly visible (listings)."],
        },
        {
          heading: "6. User rights",
          paragraphs: ["In accordance with GDPR, users can:"],
          bullets: ["access their data", "correct their data", "request deletion", "Contact: jim@la-brique.be"],
        },
        {
          heading: "7. Cookies",
          paragraphs: ["The website may use cookies to:"],
          bullets: ["improve user experience", "analyze website usage"],
        },
        {
          heading: "8. Security",
          paragraphs: ["FindMyRoom implements reasonable measures to protect data."],
        },
      ],
    },
    nl: {
      title: "Privacybeleid",
      sections: [
        {
          heading: "1. Verzamelde gegevens",
          paragraphs: ["FindMyRoom verzamelt:"],
          bullets: ["e-mailadres", "profielinformatie", "inhoud van advertenties", "navigatiegegevens (cookies)"],
        },
        {
          heading: "2. Doel",
          paragraphs: ["Gegevens worden gebruikt om:"],
          bullets: [
            "accountaanmaak mogelijk te maken",
            "advertenties te publiceren en beheren",
            "contact tussen gebruikers te vergemakkelijken",
            "de dienst te verbeteren",
          ],
        },
        {
          heading: "3. Rechtsgrond",
          paragraphs: ["De verwerking is gebaseerd op:"],
          bullets: ["de uitvoering van de dienst", "toestemming van de gebruiker"],
        },
        {
          heading: "4. Bewaring van gegevens",
          paragraphs: ["Gegevens worden bewaard:"],
          bullets: ["tijdens de gebruiksduur van het account", "of tot een verwijderingsverzoek"],
        },
        {
          heading: "5. Delen van gegevens",
          paragraphs: ["Gegevens worden niet verkocht.", "Sommige gegevens kunnen publiek zichtbaar zijn (advertenties)."],
        },
        {
          heading: "6. Rechten van gebruikers",
          paragraphs: ["In overeenstemming met de AVG kan de gebruiker:"],
          bullets: ["toegang vragen tot zijn gegevens", "ze corrigeren", "verwijdering vragen", "Contact: jim@la-brique.be"],
        },
        {
          heading: "7. Cookies",
          paragraphs: ["De website kan cookies gebruiken om:"],
          bullets: ["de gebruikerservaring te verbeteren", "het gebruik van de website te analyseren"],
        },
        {
          heading: "8. Beveiliging",
          paragraphs: ["FindMyRoom neemt redelijke maatregelen om gegevens te beschermen."],
        },
      ],
    },
  },
};

export function getLegalDocument(key: LegalDocumentKey, locale: AppLocale): LegalDocument {
  return LEGAL_DOCUMENTS[key][locale] ?? LEGAL_DOCUMENTS[key].fr;
}
