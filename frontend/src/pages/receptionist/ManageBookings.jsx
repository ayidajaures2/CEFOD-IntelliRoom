import { useCallback, useState } from "react";
import { fetchAllBookings, validateBooking, rejectBooking } from "../../api/bookingApi";
import { usePolling } from "../../hooks/usePolling";
import { useNotify } from "../../contexts/NotificationContext";
import PageHeader from "../../components/common/PageHeader";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import StatutBadge from "../../components/common/StatutBadge";
import { formatDateTime } from "../../utils/formatDate";
import { CATEGORIE_CLIENT_LABELS, STATUT_RESERVATION_LABELS } from "../../utils/constants";
import { apiErrorMessage } from "../../utils/apiError";

const FILTERS = ["", "en_attente", "validee", "confirmee", "annulee"];

/**
 * Examen des demandes par la réceptionniste. En cas de doute sur la
 * catégorie déclarée, elle ne valide pas et contacte l'admin (CLAUDE.md §3).
 */
export default function ManageBookings() {
  const { success, error: toastError } = useNotify();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("en_attente");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await fetchAllBookings(filter ? { statut: filter } : undefined);
      let list = Array.isArray(data) ? data : data.data ?? [];
      // Filtre aussi côté client au cas où l'API renverrait tout.
      if (filter) list = list.filter((b) => b.statut === filter);
      setBookings(list);
    } catch {
      toastError("Impossible de charger les réservations.");
    } finally {
      setLoading(false);
    }
  }, [filter, toastError]);
  usePolling(load, 10000); // nouvelles demandes visibles sans recharger

  const act = async (fn, b, message) => {
    try {
      await fn(b.id_reservation);
      success(message);
      load();
    } catch (e) {
      toastError(apiErrorMessage(e, "Action impossible."));
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Réception"
        title="Demandes de réservation"
        subtitle="Vérifiez la disponibilité et la catégorie du client avant de valider. Le client paie après validation."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f || "tous"}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${
              filter === f ? "bg-ink text-paper" : "border border-ink/15 hover:border-accent hover:text-accent"
            }`}
          >
            {f ? STATUT_RESERVATION_LABELS[f] : "Toutes"}
          </button>
        ))}
      </div>

      {loading && <Loader />}
      {!loading && bookings.length === 0 && (
        <EmptyState title="Aucune réservation" hint="Rien à traiter pour ce filtre." />
      )}

      {!loading && bookings.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Client</th><th>Catégorie déclarée</th><th>Salle</th><th>Période</th><th>Motif</th><th>Statut</th><th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id_reservation}>
                  <td className="font-medium">{b.client ? `${b.client.prenom} ${b.client.nom}` : `#${b.id_client}`}</td>
                  <td className="text-ink/60">{CATEGORIE_CLIENT_LABELS[b.client?.categorie_client] ?? "—"}</td>
                  <td>{b.salle?.nom_salle ?? `#${b.id_salle}`}</td>
                  <td className="text-ink/60">{formatDateTime(b.date_debut)}<br />→ {formatDateTime(b.date_fin)}</td>
                  <td className="max-w-44 truncate text-ink/60">{b.motif}</td>
                  <td><StatutBadge statut={b.statut_effectif ?? b.statut} /></td>
                  <td className="text-right">
                    {b.statut === "en_attente" && (
                      <div className="flex justify-end gap-2">
                        <button className="btn-primary px-3 py-1.5 text-xs" onClick={() => act(validateBooking, b, "Réservation validée.")}>Valider</button>
                        <button className="btn-outline px-3 py-1.5 text-xs" onClick={() => window.confirm("Refuser cette demande ?") && act(rejectBooking, b, "Demande refusée.")}>Refuser</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
