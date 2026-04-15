export function humanizeAppError(errorCode: string | null) {
  if (!errorCode) return null;

  if (/bucket/i.test(errorCode) && /not found/i.test(errorCode)) {
    return "Le stockage photo n'est pas configure. Cree le bucket public `listing-photos` dans Supabase Storage.";
  }

  switch (errorCode) {
    case "commune_required":
      return "Choisis une commune de Bruxelles dans la liste.";
    case "room_sizes_count_mismatch":
      return "Indique une taille pour chaque chambre disponible.";
    case "room_sizes_invalid":
      return "Les tailles de chambre doivent etre des nombres positifs.";
    case "room_details_invalid":
      return "Chaque chambre doit avoir taille, prix, meublee, SDB, exterieur et vue.";
    case "total_rooms_invalid":
      return "Le total de chambres doit etre superieur ou egal aux chambres disponibles.";
    case "schema_missing_listing_fields":
      return "La base doit etre migree pour les nouveaux champs annonce (room_details, animaux, total_rooms...).";
    case "vibe_required":
      return "Choisis au moins une option d'ambiance ou complete le champ Autre.";
    case "contact_method_required":
      return "Choisis au moins un moyen de contact: email et/ou telephone.";
    case "contact_phone_required":
      return "Tu as choisi telephone, mais aucun numero valide n'a ete fourni.";
    case "contact_email_required":
      return "Tu as choisi email, mais aucune adresse email n'a ete fournie.";
    case "contact_missing":
      return "Aucun moyen de contact configure pour cette annonce.";
    case "contact_method_invalid":
      return "Le moyen de contact demande n'est pas disponible pour cette annonce.";
    case "email_form_invalid_method":
      return "Le formulaire email doit etre envoye depuis le bouton.";
    case "email_service_unavailable":
      return "Envoi email non configure cote serveur. Ajoute les variables SMTP.";
    case "email_auth_failed":
      return "Connexion SMTP refusee. Verifie SMTP_USER/SMTP_PASS (mot de passe d'application).";
    case "email_rate_limited":
      return "Attends 30 secondes avant de renvoyer un email.";
    case "email_send_failed":
      return "Impossible d'envoyer l'email pour le moment.";
    case "contact_required":
      return "Ajoute un moyen de contact: email et/ou telephone.";
    case "schema_missing_photo_captions":
      return "La base n'a pas encore le champ des legendes photo. Lance la requete SQL de migration `photo_captions`.";
    case "bucket_not_found":
      return "Le stockage photo n'est pas configure (bucket introuvable). Execute le schema SQL dans Supabase.";
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
