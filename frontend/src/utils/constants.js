/**
 * Constantes métier — alignées sur les enums réels de la base
 * Toute valeur envoyée à l'API doit provenir d'ici.
 */

export const ROLES = {
  ADMIN: "admin",
  RECEPTIONNISTE: "receptionniste",
  CAISSIER: "caissier",
  CLIENT: "client",
};

export const ROLE_LABELS = {
  admin: "Administrateur",
  receptionniste: "Réceptionniste",
  caissier: "Caissier",
  client: "Client",
};

export const CATEGORIES_CLIENT = [
  { value: "org_internationale", label: "Organisation internationale" },
  { value: "admin_ong", label: "Administration / ONG" },
  { value: "association_base", label: "Association de base" },
];

export const CATEGORIE_CLIENT_LABELS = Object.fromEntries(
  CATEGORIES_CLIENT.map((c) => [c.value, c.label])
);

/** Statuts stockés + statuts effectifs calculés à la volée côté backend. */
export const STATUT_RESERVATION_LABELS = {
  en_attente: "En attente",
  validee: "Validée",
  confirmee: "Confirmée",
  annulee: "Annulée",
  en_cours: "En cours",
  terminee: "Terminée",
};

export const STATUT_SALLE_LABELS = {
  libre: "Libre",
  reservee: "Réservée",
  occupee: "Occupée",
};

export const MODES_PAIEMENT = [
  { value: "especes", label: "Espèces" },
  { value: "moov_money", label: "Moov Money" },
  { value: "airtel_money", label: "Airtel Money" },
];

export const MODE_PAIEMENT_LABELS = Object.fromEntries(
  MODES_PAIEMENT.map((m) => [m.value, m.label])
);

export const STATUT_PAIEMENT_LABELS = {
  en_attente: "En attente",
  valide: "Validé",
  annule: "Annulé",
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
 * Un jour absent = fermé.
 */
export const BUSINESS_HOURS = {
  1: ["08:00", "18:00"], // lundi
  2: ["08:00", "18:00"], // mardi
  3: ["08:00", "18:00"], // mercredi
  4: ["08:00", "18:00"], // jeudi
  5: ["08:00", "18:00"], // vendredi
  6: ["08:00", "18:00"], // samedi
  // 7 (dimanche) absent → fermé
};

/** Libellé humain des horaires. */
export const BUSINESS_HOURS_LABEL = "Lundi–Samedi : 08 h – 18 h · Dimanche : fermé";

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