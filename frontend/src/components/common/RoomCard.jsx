import { Link } from "react-router-dom";
import StatutBadge from "./StatutBadge";
import { formatMoney } from "../../utils/formatMoney";

/**
 * Carte du catalogue. `room.tarif_client` est le tarif de la catégorie
 * du client connecté (indicatif) renvoyé par l'API si disponible.
 */
export default function RoomCard({ room }) {
  const statut = room.statut_effectif ?? room.statut;
  const equipements = String(room.equipements ?? "")
    .split(/[,;]/).map((e) => e.trim()).filter(Boolean).slice(0, 3);

  return (
    <Link
      to={`/salles/${room.id_salle}`}
      className="card group flex flex-col overflow-hidden transition-shadow hover:shadow-lg focus-visible:shadow-lg"
    >
      <div className="flex items-center justify-between border-b border-ink/5 bg-ink px-5 py-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-paper/50">{room.type_salle}</p>
          <h3 className="font-display text-lg font-bold text-paper group-hover:text-accent">{room.nom_salle}</h3>
        </div>
        <StatutBadge statut={statut} />
      </div>
      <div className="flex flex-1 flex-col gap-3 px-5 py-4">
        <p className="line-clamp-2 text-sm text-ink/60">{room.description || "Aucune description."}</p>
        {equipements.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {equipements.map((e) => (
              <li key={e} className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent-dark">{e}</li>
            ))}
          </ul>
        )}
        <div className="mt-auto flex items-end justify-between pt-2">
          <span className="text-sm text-ink/70"><strong className="font-display text-lg text-ink">{room.capacite}</strong> places</span>
          {(() => {
            const list = room.tarifs ?? room.tarif_salles ?? [];
            const cheapest = list.length
              ? [...list].sort((a, b) => Number(a.prix) - Number(b.prix))[0]
              : room.tarif_client;
            if (cheapest == null) return null;
            return (
              <span className="text-right text-sm font-semibold text-accent-dark">
                <span className="block text-[11px] font-normal text-ink/50">à partir de</span>
                {formatMoney(cheapest.prix ?? cheapest)}
                <span className="text-xs font-normal text-ink/50"> / {cheapest.unite ?? "jour"}</span>
              </span>
            );
          })()}
        </div>
      </div>
    </Link>
  );
}
