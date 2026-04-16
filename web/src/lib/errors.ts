export function humanizeAppError(errorCode: string | null) {
  if (!errorCode) return null;

  if (/bucket/i.test(errorCode) && /not found/i.test(errorCode)) {
    return "Le stockage photo n'est pas configuré. Crée le bucket public `listing-photos` dans Supabase Storage.";
  }

  switch (errorCode) {
    case "listing_type_required":
      return "Choisis un type d'annonce: Colocation ou Studio.";
    case "commune_required":
      return "Choisis une commune de Bruxelles dans la liste.";
    case "neighborhood_required":
      return "Choisis un quartier dans la liste de la commune sélectionnée.";
    case "neighborhood_custom_required":
      return "Tu as choisi Autre quartier: précise le nom du quartier.";
    case "room_sizes_count_mismatch":
      return "Indique une taille pour chaque chambre disponible.";
    case "room_sizes_invalid":
      return "Les tailles de chambre doivent être des nombres positifs.";
    case "room_details_invalid":
      return "Chaque chambre doit avoir taille, prix, meublé, SDB, extérieur et vue.";
    case "total_rooms_invalid":
      return "Le total de chambres doit être supérieur ou égal aux chambres disponibles.";
    case "schema_missing_listing_fields":
      return "La base doit être migrée pour les nouveaux champs annonce (room_details, animaux, total_rooms, listing_type...).";
    case "vibe_required":
      return "Choisis au moins une option d'ambiance ou complete le champ Autre.";
    case "contact_method_required":
      return "Choisis au moins un moyen de contact: email et/ou telephone.";
    case "contact_phone_required":
      return "Tu as choisi telephone, mais aucun numero valide n'a ete fourni.";
    case "contact_email_required":
      return "Tu as choisi email, mais aucune adresse email n'a ete fournie.";
    case "account_email_required":
      return "Ton compte n'a pas d'adresse email utilisable pour le contact annonce.";
    case "contact_missing":
      return "Aucun moyen de contact configuré pour cette annonce.";
    case "contact_method_invalid":
      return "Le moyen de contact demande n'est pas disponible pour cette annonce.";
    case "email_form_invalid_method":
      return "Le formulaire email doit être envoyé depuis le bouton.";
    case "email_service_unavailable":
      return "Envoi email non configuré côté serveur. Ajoute les variables SMTP.";
    case "email_auth_failed":
      return "Connexion SMTP refusée. Vérifie SMTP_USER/SMTP_PASS (mot de passe d'application).";
    case "email_rate_limited":
      return "Attends 30 secondes avant de renvoyer un email.";
    case "email_send_failed":
      return "Impossible d'envoyer l'email pour le moment.";
    case "contact_required":
      return "Ajoute un moyen de contact: email et/ou telephone.";
    case "schema_missing_photo_captions":
      return "La base n'a pas encore le champ des légendes photo. Lance la requête SQL de migration `photo_captions`.";
    case "bucket_not_found":
      return "Le stockage photo n'est pas configuré (bucket introuvable). Exécute le schéma SQL dans Supabase.";
    case "listing_not_found":
      return "Annonce introuvable pour ton compte.";
    case "photo_required":
      return "Ajoute au moins une photo.";
    case "photo_caption_required":
      return "Chaque photo doit avoir une legende.";
    default:
      return errorCode;
  }
}
