import { useCallback, useEffect, useState } from "react";
import { fetchAllBookings, cancelBooking } from "../../api/bookingApi";
import { useNotify } from "../../contexts/NotificationContext";
import PageHeader from "../../components/common/PageHeader";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import StatutBadge from "../../components/common/StatutBadge";
import { formatDateTime } from "../../utils/formatDate";
import { formatMoney } from "../../utils/formatMoney";
import { CATEGORIE_CLIENT_LABELS, STATUT_RESERVATION_LABELS } from "../../utils/constants";
import { apiErrorMessage } from "../../utils/apiError";
import { LuRefreshCw, LuChevronLeft, LuChevronRight } from "react-icons/lu";

const FILTERS = ["", "en_attente", "validee", "confirmee", "terminee", "annulee"];

/**
 * Historique complet des réservations (toutes, tous statuts) — manquait
 * jusqu'ici : le dashboard admin n'affichait que les 8 dernières
 * (AdminDashboard.jsx, `recent.slice(0, 8)`), sans recherche ni filtre ni
 * accès aux plus anciennes. Cette page couvre l'intégralité, avec
 * pagination côté serveur (BookingController::adminIndex(), déjà prêt
 * à l'emploi : recherche + filtre statut + pagination Laravel natifs).
 */
export default function AdminBookings() {
  const { success, error: toastError } = useNotify();
  const [page, setPage] = useState(null); // réponse paginate() complète
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const params = { page: currentPage };
      if (filter) params.statut = filter;
      if (search.trim()) params.search = search.trim();
      const { data } = await fetchAllBookings(params);
      setPage(data);
    } catch {
      toastError("Impossible de charger l'historique des réservations.");
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  }, [filter, search, currentPage, toastError]);

  useEffect(() => { load(); }, [load]);

  // Revenir à la première page à chaque changement de filtre/recherche.
  useEffect(() => { setCurrentPage(1); }, [filter, search]);

  const forceCancel = async (b) => {
    if (!window.confirm(`Annuler la réservation de ${b.client ? `${b.client.prenom} ${b.client.nom}` : `#${b.id_client}`} ? Le client sera notifié.`)) return;
    try {
      await cancelBooking(b.id_reservation);
      success("Réservation annulée.");
      load({ silent: true });
    } catch (e) {
      toastError(apiErrorMessage(e, "Annulation impossible."));
    }
  };

  const rows = page?.data ?? [];
  const lastPage = page?.last_page ?? 1;
  const total = page?.total ?? 0;

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Historique des réservations"
        subtitle={`${total} réservation(s) au total, tous statuts confondus.`}
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

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          className="field max-w-xs"
          placeholder="Rechercher un client (nom, prénom)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Rechercher une réservation par client"
        />
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f || "tous"}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                filter === f ? "bg-ink text-paper" : "border border-ink/15 hover:border-accent hover:text-accent"
              }`}
            >
              {f ? STATUT_RESERVATION_LABELS[f] : "Tous"}
            </button>
          ))}
        </div>
      </div>

      {loading && <Loader />}
      {!loading && rows.length === 0 && (
        <EmptyState title="Aucune réservation" hint="Rien à afficher pour cette recherche/ce filtre." />
      )}

      {!loading && rows.length > 0 && (
        <>
          <div className="card overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Client</th><th>Catégorie</th><th>Salle</th><th>Validé par</th>
                  <th>Période</th><th>Montant</th><th>Statut</th><th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b, i) => (
                  <tr key={b.id_reservation} className="stagger-in" style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}>
                    <td className="font-medium">{b.client ? `${b.client.prenom} ${b.client.nom}` : `#${b.id_client}`}</td>
                    <td className="text-ink/60">{CATEGORIE_CLIENT_LABELS[b.client?.categorie_client] ?? "—"}</td>
                    <td>{b.salle?.nom_salle ?? `#${b.id_salle}`}</td>
                    <td className="text-ink/60">{b.sg ? `${b.sg.prenom} ${b.sg.nom}` : "—"}</td>
                    <td className="text-xs text-ink/55">{formatDateTime(b.date_debut)}<br />→ {formatDateTime(b.date_fin)}</td>
                    <td>{b.paiement?.montant ? formatMoney(b.paiement.montant) : "—"}</td>
                    <td><StatutBadge statut={b.statut_effectif ?? b.statut} /></td>
                    <td className="text-right">
                      {!["annulee", "confirmee", "terminee"].includes(b.statut) && (
                        <button className="btn-ghost px-3 py-1.5 text-xs text-accent-dark" onClick={() => forceCancel(b)}>
                          Annuler
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {lastPage > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                className="btn-outline flex items-center gap-1 px-3 py-1.5 text-sm disabled:opacity-40"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
              >
                <LuChevronLeft size={14} /> Précédent
              </button>
              <span className="text-sm text-ink/55">Page {currentPage} / {lastPage}</span>
              <button
                className="btn-outline flex items-center gap-1 px-3 py-1.5 text-sm disabled:opacity-40"
                onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
                disabled={currentPage >= lastPage}
              >
                Suivant <LuChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}