/**
 * Constantes métier — alignées sur les enums réels de la base
 * (voir CLAUDE.md §2 : tables `utilisateur`, `salle`, `reservation`, `paiement`).
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

// Frais Mobile Money (Tchad) — mêmes taux que le backend.
export const OPERATOR_FEES = {
  airtel_money: 1.8, // %
  moov_money: 1.6,   // %
};

export const MODE_PAIEMENT_LABELS = Object.fromEntries(
  MODES_PAIEMENT.map((m) => [m.value, m.label])
);

export const STATUT_PAIEMENT_LABELS = {
  en_attente: "En attente",
  valide: "Validé",
  annule: "Annulé",
};

export const POLLING_INTERVAL =
  Number(import.meta.env.VITE_POLLING_INTERVAL) || 5000;
