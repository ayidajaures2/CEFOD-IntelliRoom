import { useCallback, useEffect, useState } from "react";
import { fetchAllBookings, validateBooking, rejectBooking, updateBooking } from "../../api/bookingApi";
import { useNotify } from "../../contexts/NotificationContext";
import PageHeader from "../../components/common/PageHeader";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import StatutBadge from "../../components/common/StatutBadge";
import { formatDateTime } from "../../utils/formatDate";
import { CATEGORIE_CLIENT_LABELS, STATUT_RESERVATION_LABELS } from "../../utils/constants";
import { apiErrorMessage } from "../../utils/apiError";
import { LuRefreshCw } from "react-icons/lu";

const FILTERS = ["", "en_attente", "validee", "confirmee", "annulee"];

/**
 * Examen des demandes par la réceptionniste. En cas de doute sur la
 * catégorie déclarée, elle ne valide pas et contacte l'admin (CLAUDE.md §3).
 */
export default function ManageBookings() {
  const { success, error: toastError } = useNotify();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  // AJOUT : distingue le chargement plein écran du refresh manuel (bouton)
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState(""); // Toutes par défaut

  // AJOUT : modale de note interne
  const [noteModal, setNoteModal] = useState(null); // booking en cours d'édition ou null
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

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


  // Bouton "Actualiser" ci-dessous.
  useEffect(() => {
    load();
  }, [load]);

  const act = async (fn, b, message) => {
    try {
      await fn(b.id_reservation);
      success(message);
      load({ silent: true });
    } catch (e) {
      toastError(apiErrorMessage(e, "Action impossible."));
    }
  };

  // AJOUT : ouverture / fermeture de la modale de note
  const openNote = (b) => {
    setNoteModal(b);
    setNoteText(b.note_interne ?? "");
  };

  const closeNote = () => {
    if (savingNote) return;
    setNoteModal(null);
    setNoteText("");
  };

  const saveNote = async () => {
    if (!noteModal) return;
    setSavingNote(true);
    try {
      await updateBooking(noteModal.id_reservation, { note_interne: noteText.trim() || null });
      success("Note enregistrée.");
      setNoteModal(null);
      setNoteText("");
      load({ silent: true });
    } catch (e) {
      toastError(apiErrorMessage(e, "Impossible d'enregistrer la note."));
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Réception"
        title="Demandes de réservation"
        subtitle="Vérifiez la disponibilité et la catégorie du client avant de valider. Le client paie après validation."
        actions={
          // AJOUT : bouton de rafraîchissement manuel
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
                    <div className="flex justify-end gap-2">
                      {b.statut === "en_attente" && (
                        <>
                          <button className="btn-primary px-3 py-1.5 text-xs" onClick={() => act(validateBooking, b, "Réservation validée.")}>Valider</button>
                          <button className="btn-outline px-3 py-1.5 text-xs" onClick={() => window.confirm("Refuser cette demande ?") && act(rejectBooking, b, "Demande refusée.")}>Refuser</button>
                        </>
                      )}
                      {/* AJOUT : bouton note interne, disponible quel que soit le statut */}
                      <button
                        className="btn-outline relative px-3 py-1.5 text-xs"
                        onClick={() => openNote(b)}
                        title={b.note_interne ? "Modifier la note interne" : "Ajouter une note interne"}
                      >
                        Note
                        {b.note_interne && (
                          <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-accent" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* AJOUT : modale de saisie de la note interne */}
      {noteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          onClick={closeNote}
        >
          <div
            className="card w-full max-w-md bg-surface p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-1 font-display text-lg font-bold">Note interne</h2>
            <p className="mb-3 text-sm text-ink/50">
              {noteModal.client ? `${noteModal.client.prenom} ${noteModal.client.nom}` : `#${noteModal.id_client}`}
              {" — "}
              {noteModal.salle?.nom_salle ?? `#${noteModal.id_salle}`}
            </p>
            <textarea
              className="field min-h-32 w-full resize-y"
              placeholder="Ex : client déjà venu, prévoir chaises supplémentaires, doute sur la catégorie déclarée..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              maxLength={1000}
              autoFocus
            />
            <p className="mt-1 text-right text-xs text-ink/40">{noteText.length}/1000</p>
            <p className="mb-4 text-xs text-ink/40">Visible par la réception et l'administration uniquement.</p>
            <div className="flex justify-end gap-2">
              <button className="btn-outline px-3 py-1.5 text-sm" onClick={closeNote} disabled={savingNote}>
                Annuler
              </button>
              <button className="btn-primary px-3 py-1.5 text-sm" onClick={saveNote} disabled={savingNote}>
                {savingNote ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}