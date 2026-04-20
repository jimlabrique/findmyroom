import type { AppLocale } from "@/lib/i18n/locales";

const ERROR_MESSAGES: Record<AppLocale, Record<string, string>> = {
  fr: {
    listing_type_required: "Choisis un type d'annonce: Colocation ou Studio.",
    commune_required: "Choisis une commune de Bruxelles dans la liste.",
    neighborhood_required: "Choisis un quartier dans la liste de la commune sélectionnée.",
    neighborhood_custom_required: "Tu as choisi Autre quartier: précise le nom du quartier.",
    room_sizes_count_mismatch: "Indique une taille pour chaque chambre disponible.",
    room_sizes_invalid: "Les tailles de chambre doivent être des nombres positifs.",
    room_details_invalid: "Chaque chambre doit avoir taille, prix, meublé, SDB, extérieur et vue.",
    total_rooms_invalid: "Le total de chambres doit être supérieur ou égal aux chambres disponibles.",
    schema_missing_listing_fields: "La base doit être migrée pour les nouveaux champs annonce (room_details, animaux, total_rooms, listing_type...).",
    vibe_required: "Choisis au moins une option d'ambiance ou complète le champ Autre.",
    contact_method_required: "Choisis au moins un moyen de contact: email et/ou téléphone.",
    contact_phone_required: "Tu as choisi téléphone, mais aucun numéro valide n'a été fourni.",
    contact_email_required: "Tu as choisi email, mais aucune adresse email n'a été fournie.",
    account_email_required: "Ton compte n'a pas d'adresse email utilisable pour le contact annonce.",
    contact_missing: "Aucun moyen de contact configuré pour cette annonce.",
    contact_method_invalid: "Le moyen de contact demandé n'est pas disponible pour cette annonce.",
    untrusted_origin: "Requête bloquée pour sécurité (origine non approuvée).",
    email_form_invalid_method: "Le formulaire email doit être envoyé depuis le bouton.",
    email_service_unavailable: "Envoi email non configuré côté serveur. Ajoute les variables SMTP.",
    email_auth_failed: "Connexion SMTP refusée. Vérifie SMTP_USER/SMTP_PASS (mot de passe d'application).",
    email_rate_limited: "Attends 30 secondes avant de renvoyer un email.",
    email_send_failed: "Impossible d'envoyer l'email pour le moment.",
    contact_required: "Ajoute un moyen de contact: email et/ou téléphone.",
    schema_missing_photo_captions:
      "La base n'a pas encore le champ des légendes photo. Lance la requête SQL de migration `photo_captions`.",
    bucket_not_found: "Le stockage photo n'est pas configuré (bucket introuvable). Exécute le schéma SQL dans Supabase.",
    listing_not_found: "Annonce introuvable pour ton compte.",
    photo_required: "Ajoute au moins une photo.",
    photo_caption_required: "Chaque photo doit avoir une légende.",
  },
  en: {
    listing_type_required: "Choose a listing type: Shared flat or Studio.",
    commune_required: "Choose a Brussels commune from the list.",
    neighborhood_required: "Choose a district from the selected commune list.",
    neighborhood_custom_required: "You selected Other district: specify the district name.",
    room_sizes_count_mismatch: "Provide a size for each available room.",
    room_sizes_invalid: "Room sizes must be positive numbers.",
    room_details_invalid: "Each room must include size, price, furnishing, bathroom, outdoor and view.",
    total_rooms_invalid: "Total rooms must be greater than or equal to available rooms.",
    schema_missing_listing_fields:
      "Database migration required for new listing fields (room_details, animals, total_rooms, listing_type...).",
    vibe_required: "Select at least one vibe option or complete the Other field.",
    contact_method_required: "Choose at least one contact method: email and/or phone.",
    contact_phone_required: "You selected phone, but no valid number was provided.",
    contact_email_required: "You selected email, but no valid address was provided.",
    account_email_required: "Your account has no usable email for listing contact.",
    contact_missing: "No contact method configured for this listing.",
    contact_method_invalid: "Requested contact method is not available for this listing.",
    untrusted_origin: "Request blocked for security reasons (untrusted origin).",
    email_form_invalid_method: "Email form must be submitted from the button.",
    email_service_unavailable: "Email sending is not configured server-side. Add SMTP variables.",
    email_auth_failed: "SMTP login failed. Check SMTP_USER/SMTP_PASS (app password).",
    email_rate_limited: "Wait 30 seconds before sending another email.",
    email_send_failed: "Unable to send email right now.",
    contact_required: "Add a contact method: email and/or phone.",
    schema_missing_photo_captions: "Database is missing photo captions field. Run the `photo_captions` SQL migration.",
    bucket_not_found: "Photo storage is not configured (bucket not found). Run the SQL setup in Supabase.",
    listing_not_found: "Listing not found for your account.",
    photo_required: "Add at least one photo.",
    photo_caption_required: "Each photo needs a caption.",
  },
  nl: {
    listing_type_required: "Kies een advertentietype: Cohousing of Studio.",
    commune_required: "Kies een Brusselse gemeente uit de lijst.",
    neighborhood_required: "Kies een wijk uit de lijst van de geselecteerde gemeente.",
    neighborhood_custom_required: "Je koos Andere wijk: vul de wijknaam in.",
    room_sizes_count_mismatch: "Vul een grootte in voor elke beschikbare kamer.",
    room_sizes_invalid: "Kamergroottes moeten positieve getallen zijn.",
    room_details_invalid: "Elke kamer moet grootte, prijs, meubilering, badkamer, buitenruimte en uitzicht hebben.",
    total_rooms_invalid: "Totaal aantal kamers moet groter of gelijk zijn aan beschikbare kamers.",
    schema_missing_listing_fields:
      "Database-migratie vereist voor nieuwe advertentievelden (room_details, animals, total_rooms, listing_type...).",
    vibe_required: "Kies minstens één sfeeroptie of vul het veld Andere in.",
    contact_method_required: "Kies minstens één contactmethode: e-mail en/of telefoon.",
    contact_phone_required: "Je koos telefoon, maar er is geen geldig nummer ingevuld.",
    contact_email_required: "Je koos e-mail, maar er is geen geldig e-mailadres ingevuld.",
    account_email_required: "Je account heeft geen bruikbaar e-mailadres voor advertentiecontact.",
    contact_missing: "Geen contactmethode ingesteld voor deze advertentie.",
    contact_method_invalid: "De gevraagde contactmethode is niet beschikbaar voor deze advertentie.",
    untrusted_origin: "Verzoek geblokkeerd om veiligheidsredenen (niet-vertrouwde herkomst).",
    email_form_invalid_method: "E-mailformulier moet via de knop worden verzonden.",
    email_service_unavailable: "E-mailverzending is niet server-side geconfigureerd. Voeg SMTP-variabelen toe.",
    email_auth_failed: "SMTP-login mislukt. Controleer SMTP_USER/SMTP_PASS (app-wachtwoord).",
    email_rate_limited: "Wacht 30 seconden voor je opnieuw een e-mail verzendt.",
    email_send_failed: "E-mail kan nu niet worden verzonden.",
    contact_required: "Voeg een contactmethode toe: e-mail en/of telefoon.",
    schema_missing_photo_captions: "Database mist veld voor fotobijschriften. Voer de `photo_captions` SQL-migratie uit.",
    bucket_not_found: "Foto-opslag is niet geconfigureerd (bucket niet gevonden). Voer de SQL-setup uit in Supabase.",
    listing_not_found: "Advertentie niet gevonden voor je account.",
    photo_required: "Voeg minstens één foto toe.",
    photo_caption_required: "Elke foto moet een bijschrift hebben.",
  },
};

export function humanizeAppError(errorCode: string | null, locale: AppLocale = "fr") {
  if (!errorCode) return null;

  if (/bucket/i.test(errorCode) && /not found/i.test(errorCode)) {
    if (locale === "en") {
      return "Photo storage is not configured. Create the public `listing-photos` bucket in Supabase Storage.";
    }
    if (locale === "nl") {
      return "Foto-opslag is niet geconfigureerd. Maak de publieke `listing-photos` bucket aan in Supabase Storage.";
    }
    return "Le stockage photo n'est pas configuré. Crée le bucket public `listing-photos` dans Supabase Storage.";
  }

  return ERROR_MESSAGES[locale][errorCode] ?? errorCode;
}
