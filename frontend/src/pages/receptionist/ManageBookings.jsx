import { useCallback, useEffect, useState } from "react";
import { fetchAllBookings } from "../../api/bookingApi";
import { useNotify } from "../../contexts/NotificationContext";
import PageHeader from "../../components/common/PageHeader";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import StatutBadge from "../../components/common/StatutBadge";
import { formatDateTime } from "../../utils/formatDate";
import { CATEGORIE_CLIENT_LABELS, STATUT_RESERVATION_LABELS } from "../../utils/constants";
import { LuRefreshCw } from "react-icons/lu";

const FILTERS = ["", "en_attente", "validee", "confirmee", "annulee"];

/**
 * Lecture seule — la réceptionniste ne valide plus les demandes (c'est le
 * rôle du SG depuis la refonte, voir pages/sg/ManageBookings.jsx). Cette
 * page sert uniquement à consulter l'état des réservations pour orienter
 * les clients et répondre à leurs questions.
 *
 * Bouton manuel plutôt que polling : page de consultation, sans enjeu de
 * fraîcheur seconde-par-seconde — contrairement au SG/comptabilité/caisse,
 * où deux personnes peuvent agir en même temps sur la même donnée.
 */
export default function ManageBookings() {
  const { error: toastError } = useNotify();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("");

  const load = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const { data } = await fetchAllBookings(filter ? { statut: filter } : undefined);
      let list = Array.isArray(data) ? data : data.data ?? [];
      if (filter) list = list.filter((b) => b.statut === filter);
      setBookings(list);
    } catch {
      toastError("Impossible de charger les réservations.");
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  }, [filter, toastError]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <PageHeader
        eyebrow="Réception"
        title="Réservations"
        subtitle="Consultation seule. La validation des demandes est faite par le Secrétariat Général."
        actions={
          <button
            className="btn-outline flex items-center gap-1.5"
            onClick={() => load({ silent: true })}
            disabled={refreshing}
          >
            <LuRefreshCw className={refreshing ? "animate-spin" : ""} size={16} />
            Actualiser
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f || "tous"}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filter === f ? "bg-ink text-paper" : "border border-ink/15 hover:border-accent hover:text-accent"
            }`}
          >
            {f ? STATUT_RESERVATION_LABELS[f] : "Toutes"}
          </button>
        ))}
      </div>

      {loading && <Loader />}
      {!loading && bookings.length === 0 && (
        <EmptyState title="Aucune réservation" hint="Rien à afficher pour ce filtre." />
      )}

      {!loading && bookings.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Client</th><th>Catégorie déclarée</th><th>Salle</th><th>Période</th><th>Motif</th><th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b, i) => (
                <tr key={b.id_reservation} className="stagger-in" style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}>
                  <td className="font-medium">{b.client ? `${b.client.prenom} ${b.client.nom}` : `#${b.id_client}`}</td>
                  <td className="text-ink/60">{CATEGORIE_CLIENT_LABELS[b.client?.categorie_client] ?? "—"}</td>
                  <td>{b.salle?.nom_salle ?? `#${b.id_salle}`}</td>
                  <td className="text-ink/60">{formatDateTime(b.date_debut)}<br />→ {formatDateTime(b.date_fin)}</td>
                  <td className="max-w-44 truncate text-ink/60">{b.motif}</td>
                  <td><StatutBadge statut={b.statut_effectif ?? b.statut} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}