/**
 * Constantes métier — alignées sur les enums réels de la base
 * Toute valeur envoyée à l'API doit provenir d'ici.
 */

export const ROLES = {
  ADMIN: "admin",
  SG: "sg",
  COMPTABILITE: "comptabilite",
  RECEPTIONNISTE: "receptionniste",
  CAISSIER: "caissier",
  CLIENT: "client",
};

export const ROLE_LABELS = {
  admin: "Administrateur",
  sg: "Secrétariat Général",
  comptabilite: "Comptabilité",
  receptionniste: "Réceptionniste",
  caissier: "Caissier",
  client: "Client",
};

/** Palier tarifaire (3 valeurs) — dérivé automatiquement côté backend depuis
 * sous_categorie_client, jamais saisi directement. Sert uniquement à
 * l'affichage et à retrouver le bon tarif dans tarif_salle/tarif_service. */
export const CATEGORIES_CLIENT = [
  { value: "org_internationale", label: "Organisation internationale" },
  { value: "admin_ong", label: "Administration / ONG" },
  { value: "association_base", label: "Association de base" },
];

export const CATEGORIE_CLIENT_LABELS = Object.fromEntries(
  CATEGORIES_CLIENT.map((c) => [c.value, c.label])
);

/** Sous-catégorie (7 valeurs de la fiche papier) — c'est CE champ que le
 * client/l'admin choisit réellement à l'inscription. categorie_client est
 * dérivé automatiquement côté backend, jamais saisi. */
export const SOUS_CATEGORIES_CLIENT = [
  { value: "association", label: "Association" },
  { value: "organisation_feminine", label: "Organisation féminine" },
  { value: "admin_tchad", label: "Administration tchadienne" },
  { value: "ong_tchad", label: "ONG tchadienne" },
  { value: "syndicat_tchad", label: "Syndicat tchadien" },
  { value: "ong_internationale", label: "ONG internationale" },
  { value: "structure_internationale", label: "Structure internationale" },
];

export const SOUS_CATEGORIE_CLIENT_LABELS = Object.fromEntries(
  SOUS_CATEGORIES_CLIENT.map((c) => [c.value, c.label])
);

/** Miroir de Utilisateur::SOUS_CATEGORIE_VERS_CATEGORIE côté backend — pour
 * affichage indicatif uniquement (le calcul qui compte est fait côté serveur). */
export const SOUS_CATEGORIE_VERS_CATEGORIE = {
  association: "association_base",
  organisation_feminine: "association_base",
  admin_tchad: "admin_ong",
  ong_tchad: "admin_ong",
  syndicat_tchad: "admin_ong",
  ong_internationale: "org_internationale",
  structure_internationale: "org_internationale",
};

/** Statuts stockés + statuts effectifs calculés à la volée côté backend. */
export const STATUT_RESERVATION_LABELS = {
  en_attente: "En attente",
  validee: "Validée",
  confirmee: "Confirmée",
  en_cours: "En cours",
  terminee: "Terminée",
  annulee: "Annulée",
};

export const STATUT_SALLE_LABELS = {
  libre: "Libre",
  reservee: "Réservée",
  occupee: "Occupée",
};

/** 5 modes de paiement. especes = caissier uniquement. cheque/virement =
 * comptabilité uniquement (jamais le caissier). moov_money/airtel_money =
 * automatique, aucune action humaine. */
export const MODES_PAIEMENT = [
  { value: "especes", label: "Espèces" },
  { value: "cheque", label: "Chèque" },
  { value: "virement", label: "Virement bancaire" },
  { value: "moov_money", label: "Moov Money" },
  { value: "airtel_money", label: "Airtel Money" },
];

export const MODE_PAIEMENT_LABELS = Object.fromEntries(
  MODES_PAIEMENT.map((m) => [m.value, m.label])
);

/** Modes gérés par le caissier (présentiel, cash uniquement). */
export const MODES_PAIEMENT_CAISSIER = ["especes"];

/** Modes gérés par la comptabilité elle-même (jamais par le caissier). */
export const MODES_PAIEMENT_COMPTABILITE = ["cheque", "virement"];

/** Modes automatiques, aucune action humaine. */
export const MODES_PAIEMENT_AUTOMATIQUES = ["moov_money", "airtel_money"];

/** Workflow à 2 étapes pour les paiements manuels : encaisse → valide.
 * Les paiements automatiques (moov/airtel) passent directement à valide. */
export const STATUT_PAIEMENT_LABELS = {
  en_attente: "En attente",
  encaisse: "Encaissé — en attente de validation",
  valide: "Validé",
  annule: "Annulé",
};

export const MODE_GENERATION_FACTURE_LABELS = {
  automatique: "Automatique",
  manuelle: "Manuelle",
};

/** Frais opérateur Mobile Money (Tchad) — même barème que PaymentController::calculateFrais. */
export const OPERATOR_FEES = {
  airtel_money: 1.8, // 1,8 %
  moov_money: 1.6,   // 1,6 %
};

export const POLLING_INTERVAL =
  Number(import.meta.env.VITE_POLLING_INTERVAL) || 5000;

/**
 * Plages ouvertes indexées par jour ISO (1 = lundi … 7 = dimanche).
 * Un jour absent = fermé. Dimanche ouvert depuis la refonte v19 — mêmes
 * horaires que les autres jours (décision explicite pour l'app, le CEFOD
 * physique reste fermé le dimanche selon le règlement papier).
 */
export const BUSINESS_HOURS = {
  1: ["08:00", "18:00"], // lundi
  2: ["08:00", "18:00"], // mardi
  3: ["08:00", "18:00"], // mercredi
  4: ["08:00", "18:00"], // jeudi
  5: ["08:00", "18:00"], // vendredi
  6: ["08:00", "18:00"], // samedi
  7: ["08:00", "18:00"], // dimanche
};

/** Libellé humain des horaires. */
export const BUSINESS_HOURS_LABEL = "Tous les jours (Lundi–Dimanche) : 08 h – 18 h";

// ============================================================
// Champs de la fiche papier de demande de réservation
// ============================================================

export const TYPES_ACTIVITE = [
  { value: "reunion", label: "Réunion" },
  { value: "congres", label: "Congrès" },
  { value: "atelier", label: "Atelier" },
  { value: "formation", label: "Formation" },
  { value: "seminaire_colloque_symposium", label: "Séminaire / colloque / symposium" },
  { value: "ceremonie_cloture_formation", label: "Cérémonie / clôture de formation" },
  { value: "conference_presse_debat_ag", label: "Conférence de presse / débat / assemblée générale" },
  { value: "film", label: "Film" },
  { value: "recrutement", label: "Recrutement" },
  { value: "autre", label: "Autre" },
];

export const TYPE_ACTIVITE_LABELS = Object.fromEntries(
  TYPES_ACTIVITE.map((t) => [t.value, t.label])
);

export const SUJETS_PRINCIPAUX = [
  { value: "droit_homme", label: "Droit de l'homme" },
  { value: "aspect_genre", label: "Aspect genre" },
  { value: "secours_humanitaire_securite_alimentaire", label: "Secours humanitaire et sécurité alimentaire" },
  { value: "refugies_pdi", label: "Réfugiés et PDI" },
  { value: "agriculture_elevage_pisciculture", label: "Agriculture, élevage et pisciculture" },
  { value: "environnement_climat", label: "Environnement et changement climatique" },
  { value: "ressources_sol_sous_sol", label: "Ressources sol et sous-sol" },
  { value: "droit_foncier_lotissement", label: "Droit foncier, lotissement" },
  { value: "entrepreneuriat", label: "Entrepreneuriat" },
  { value: "pauvrete_cherte_vie", label: "Pauvreté, cherté de vie" },
  { value: "services_base", label: "Services de base" },
  { value: "politique_developpement", label: "Politique de développement" },
  { value: "education_formation_logiciel", label: "Éducation-formation en logiciel ou technique d'administration" },
  { value: "sante", label: "Santé" },
  { value: "decentralisation_recensement", label: "Décentralisation, recensement" },
  { value: "gouvernance_corruption", label: "Gouvernance, corruption" },
  { value: "securite_interieure", label: "Sécurité intérieure" },
  { value: "situation_internationale_militaire", label: "Situation internationale, militaire" },
  { value: "internet_telephone", label: "Internet, téléphone" },
  { value: "sport_culture_loisirs", label: "Sport et culture, loisirs et tourisme" },
  { value: "autre", label: "Autre" },
];

export const SUJET_PRINCIPAL_LABELS = Object.fromEntries(
  SUJETS_PRINCIPAUX.map((s) => [s.value, s.label])
);

export const PUBLICS_CIBLES = [
  { value: "interne", label: "Interne à l'organisation/projet/programme" },
  { value: "invitation", label: "Ouverte par invitation seulement" },
  { value: "public", label: "Ouverte au public sans invitation" },
];

export const PUBLIC_CIBLE_LABELS = Object.fromEntries(
  PUBLICS_CIBLES.map((p) => [p.value, p.label])
);

export const MEDIAS_INVITES_OPTIONS = [
  { value: "aucun", label: "Aucun média" },
  { value: "presse_ecrite", label: "Presse écrite" },
  { value: "radio_television", label: "Radio / Télévision" },
  { value: "tous", label: "Tous les organes" },
];

export const MEDIAS_INVITES_LABELS = Object.fromEntries(
  MEDIAS_INVITES_OPTIONS.map((m) => [m.value, m.label])
);

export const NOMBRE_FEMMES_OPTIONS = [
  { value: "tres_peu", label: "(Très) peu (0-10%)" },
  { value: "minorite", label: "Minorité (10-35%)" },
  { value: "moitie_moitie", label: "Moitié-moitié (35-65%)" },
  { value: "majorite", label: "Majorité (65-90%)" },
  { value: "presque_tous", label: "(Presque) tous (90-100%)" },
];

export const NOMBRE_FEMMES_LABELS = Object.fromEntries(
  NOMBRE_FEMMES_OPTIONS.map((n) => [n.value, n.label])
);

/** Coût de la retransmission radio (FCFA/h) — pour affichage indicatif côté
 * formulaire uniquement. Le vrai montant est calculé et figé côté backend
 * via le catalogue `service`/`tarif_service` (voir BookingController::store()). */
export const RETRANSMISSION_RADIO_TARIF_HORAIRE = 50000;

// ============================================================
// Horaires ouvrés — miroir JS de App\Support\BusinessHours (PHP)
// ============================================================

/**
 * Jour ISO d'une Date JS.
 * JS : getDay() → 0=dim, 1=lun … 6=sam
 * ISO : 1=lun … 7=dim
 */
function isoDay(date) {
  const d = date.getDay();
  return d === 0 ? 7 : d;
}

/**
 * Le CEFOD est-il ouvert à cet instant ?
 */
export function isOpen(date) {
  const day = isoDay(date);
  const slot = BUSINESS_HOURS[day];
  if (!slot) return false;

  const hhmm =
    String(date.getHours()).padStart(2, "0") +
    ":" +
    String(date.getMinutes()).padStart(2, "0");

  return hhmm >= slot[0] && hhmm < slot[1];
}

/**
 * Nombre de minutes ouvrées entre start et end (objets Date).
 * Miroir exact de BusinessHours::computeOpenMinutes() côté PHP.
 */
export function computeOpenMinutes(start, end) {
  if (end <= start) return 0;

  let minutes = 0;
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);

  const lastDay = new Date(end);
  lastDay.setHours(0, 0, 0, 0);

  while (cursor <= lastDay) {
    const dow = isoDay(cursor);
    const slot = BUSINESS_HOURS[dow];

    if (slot) {
      const [oh, om] = slot[0].split(":").map(Number);
      const [ch, cm] = slot[1].split(":").map(Number);

      const dayOpen = new Date(cursor);
      dayOpen.setHours(oh, om, 0, 0);

      const dayClose = new Date(cursor);
      dayClose.setHours(ch, cm, 0, 0);

      const effStart = start > dayOpen ? start : dayOpen;
      const effEnd = end < dayClose ? end : dayClose;

      if (effEnd > effStart) {
        minutes += Math.round((effEnd - effStart) / 60000);
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return minutes;
}

/**
 * Valide un créneau. Retourne null si OK, ou un objet { date_debut, date_fin, duree } d'erreurs.
 */
export function validateSlot(start, end) {
  const errors = {};

  if (!isOpen(start)) {
    errors.date_debut = "Le début tombe hors des horaires d'ouverture.";
  }

  if (!isOpen(end)) {
    // Tolérer pile 18:00:00 (heure de fermeture)
    const dow = isoDay(end);
    const slot = BUSINESS_HOURS[dow];
    const hhmm =
      String(end.getHours()).padStart(2, "0") +
      ":" +
      String(end.getMinutes()).padStart(2, "0");
    const atClose = slot && hhmm === slot[1] && end.getSeconds() === 0;

    if (!atClose) {
      errors.date_fin = "La fin tombe hors des horaires d'ouverture.";
    }
  }

  const openMin = computeOpenMinutes(start, end);
  if (openMin < 60) {
    errors.duree = `La réservation doit couvrir au moins 1 h ouvrée (actuellement ${openMin} min).`;
  }

  return Object.keys(errors).length > 0 ? errors : null;
}