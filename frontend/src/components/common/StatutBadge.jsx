import {
  STATUT_RESERVATION_LABELS,
  STATUT_SALLE_LABELS,
  STATUT_PAIEMENT_LABELS,
} from "../../utils/constants";

const LABELS = {
  ...STATUT_RESERVATION_LABELS,
  ...STATUT_SALLE_LABELS,
  ...STATUT_PAIEMENT_LABELS,
};

/* Palette imposée noir / blanc / orange : les statuts se distinguent
   par le poids de l'orange et de l'encre, pas par d'autres teintes. */
const STYLES = {
  libre: "bg-surface text-ink border border-ink/20",
  reservee: "bg-accent-soft text-accent-dark border border-accent/40",
  occupee: "bg-accent text-paper",
  en_attente: "bg-surface text-ink/70 border border-dashed border-ink/30",
  validee: "bg-accent-soft text-accent-dark border border-accent/40",
  confirmee: "bg-ink text-paper",
  en_cours: "bg-accent text-paper",
  terminee: "bg-ink/5 text-ink/50",
  annulee: "bg-surface text-ink/40 border border-ink/15 line-through",
  valide: "bg-ink text-paper",
  annule: "bg-surface text-ink/40 border border-ink/15",
};

export default function StatutBadge({ statut }) {
  if (!statut) return null;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STYLES[statut] ?? "bg-ink/5 text-ink/60"}`}>
      {LABELS[statut] ?? statut}
    </span>
  );
}
