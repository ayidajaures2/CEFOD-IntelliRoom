import { useCallback, useEffect, useState } from "react";
import { fetchAllBookings, validateBooking, cancelBooking, updateBooking } from "../../api/bookingApi";
import { useNotify } from "../../contexts/NotificationContext";
import { usePolling } from "../../hooks/usePolling";
import PageHeader from "../../components/common/PageHeader";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import StatutBadge from "../../components/common/StatutBadge";
import LiveIndicator from "../../components/common/LiveIndicator";
import { formatDateTime } from "../../utils/formatDate";
import { formatMoney } from "../../utils/formatMoney";
import {
  CATEGORIE_CLIENT_LABELS,
  STATUT_RESERVATION_LABELS,
  TYPE_ACTIVITE_LABELS,
  SUJET_PRINCIPAL_LABELS,
  PUBLIC_CIBLE_LABELS,
  MEDIAS_INVITES_LABELS,
  NOMBRE_FEMMES_LABELS,
} from "../../utils/constants";
import { apiErrorMessage } from "../../utils/apiError";
import { LuEye } from "react-icons/lu";

const FILTERS = ["", "en_attente", "validee", "confirmee", "annulee"];

/**
 * Le SG valide ou refuse les demandes de réservation — action retirée de la
 * réception lors de la refonte des rôles. La réceptionniste garde une vue
 * en lecture seule (pages/receptionist/ManageBookings.jsx, sans ces boutons).
 */
export default function ManageBookings() {
  const { success, error: toastError } = useNotify();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const [noteModal, setNoteModal] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const [detailModal, setDetailModal] = useState(null);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await fetchAllBookings(filter ? { statut: filter } : undefined);
      let list = Array.isArray(data) ? data : data.data ?? [];
      if (filter) list = list.filter((b) => b.statut === filter);
      setBookings(list);
    } catch {
      toastError("Impossible de charger les réservations.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [filter, toastError]);

  useEffect(() => {
    load();
  }, [load]);

  // Rafraîchissement automatique en arrière-plan (silencieux, pas de
  // spinner plein écran) — le bouton "Actualiser" reste disponible pour
  // forcer une mise à jour immédiate.
  usePolling(() => load({ silent: true }), 20000);

  const act = async (fn, b, message) => {
    try {
      await fn(b.id_reservation);
      success(message);
      load({ silent: true });
    } catch (e) {
      toastError(apiErrorMessage(e, "Action impossible."));
    }
  };

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
        eyebrow="Secrétariat Général"
        title="Demandes de réservation"
        subtitle="Vérifiez la disponibilité et la catégorie du client avant de valider. Le client paie après validation."
        actions={<LiveIndicator />}
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
                <th>Client</th><th>Catégorie déclarée</th><th>Salle</th><th>Type d'activité</th><th>Période</th><th>Statut</th><th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b, i) => (
                <tr key={b.id_reservation} className="stagger-in" style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}>
                  <td className="font-medium">{b.client ? `${b.client.prenom} ${b.client.nom}` : `#${b.id_client}`}</td>
                  <td className="text-ink/60">{CATEGORIE_CLIENT_LABELS[b.client?.categorie_client] ?? "—"}</td>
                  <td>{b.salle?.nom_salle ?? `#${b.id_salle}`}</td>
                  <td className="text-ink/60">{TYPE_ACTIVITE_LABELS[b.type_activite] ?? b.motif ?? "—"}</td>
                  <td className="text-ink/60">{formatDateTime(b.date_debut)}<br />→ {formatDateTime(b.date_fin)}</td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <StatutBadge statut={b.statut_effectif ?? b.statut} />
                      {b.demandes_concurrentes > 0 && (
                        <span
                          className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent-dark"
                          title="Autres demandes en attente sur ce même créneau"
                        >
                          +{b.demandes_concurrentes}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        className="btn-outline px-2.5 py-1.5 text-xs"
                        onClick={() => setDetailModal(b)}
                        title="Voir le détail complet de la demande"
                      >
                        <LuEye size={14} />
                      </button>
                      {b.statut === "en_attente" && (
                        <>
                          <button className="btn-primary px-3 py-1.5 text-xs" onClick={() => act(validateBooking, b, "Réservation validée.")}>Valider</button>
                          <button className="btn-outline px-3 py-1.5 text-xs" onClick={() => window.confirm("Refuser/annuler cette demande ?") && act(cancelBooking, b, "Demande refusée.")}>Refuser</button>
                        </>
                      )}
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

      {/* ---------- Modale : note interne ---------- */}
      {noteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={closeNote}>
          <div className="card w-full max-w-md bg-surface p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-1 font-display text-lg font-bold">Note interne</h2>
            <p className="mb-3 text-sm text-ink/50">
              {noteModal.client ? `${noteModal.client.prenom} ${noteModal.client.nom}` : `#${noteModal.id_client}`}
              {" — "}
              {noteModal.salle?.nom_salle ?? `#${noteModal.id_salle}`}
            </p>
            <textarea
              className="field min-h-32 w-full resize-y focus:!border-ink/15 focus:!ring-0 focus:!outline-none"
              placeholder="Ex : client déjà venu, prévoir chaises supplémentaires, doute sur la catégorie déclarée..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              maxLength={1000}
              autoFocus
            />
            <p className="mt-1 text-right text-xs text-ink/40">{noteText.length}/1000</p>
            <p className="mb-4 text-xs text-ink/40">Visible par la réception, le SG et l'administration.</p>
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

      {/* ---------- Modale : détail complet de la demande ---------- */}
      {detailModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          onClick={() => setDetailModal(null)}
        >
          <div
            className="card max-h-[85vh] w-full max-w-xl overflow-y-auto bg-surface p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold">
                  {detailModal.client ? `${detailModal.client.prenom} ${detailModal.client.nom}` : `Client #${detailModal.id_client}`}
                </h2>
                <p className="text-sm text-ink/55">
                  {detailModal.salle?.nom_salle ?? `Salle #${detailModal.id_salle}`}
                  {" · "}{CATEGORIE_CLIENT_LABELS[detailModal.client?.categorie_client] ?? "—"}
                </p>
              </div>
              <StatutBadge statut={detailModal.statut_effectif ?? detailModal.statut} />
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <DetailItem label="Créneau" full>
                {formatDateTime(detailModal.date_debut)} → {formatDateTime(detailModal.date_fin)}
              </DetailItem>

              <DetailItem label="Objet" full>{detailModal.motif || "—"}</DetailItem>

              <DetailItem label="Type d'activité">
                {TYPE_ACTIVITE_LABELS[detailModal.type_activite] ?? "—"}
                {detailModal.type_activite === "autre" && detailModal.type_activite_autre ? ` (${detailModal.type_activite_autre})` : ""}
              </DetailItem>
              <DetailItem label="Sujet principal">
                {SUJET_PRINCIPAL_LABELS[detailModal.sujet_principal] ?? "—"}
                {detailModal.sujet_principal === "autre" && detailModal.sujet_principal_autre ? ` (${detailModal.sujet_principal_autre})` : ""}
              </DetailItem>

              <DetailItem label="Public visé">{PUBLIC_CIBLE_LABELS[detailModal.public_cible] ?? "—"}</DetailItem>
              <DetailItem label="Médias invités">{MEDIAS_INVITES_LABELS[detailModal.medias_invites] ?? "—"}</DetailItem>

              <DetailItem label="Retransmission radio">
                {detailModal.retransmission_radio
                  ? `Oui — ${detailModal.duree_retransmission_heures ?? "?"} h`
                  : "Non"}
              </DetailItem>
              <DetailItem label="Participants">
                {detailModal.nombre_participants ?? "—"}
                {detailModal.nombre_femmes ? ` · Femmes : ${NOMBRE_FEMMES_LABELS[detailModal.nombre_femmes]}` : ""}
              </DetailItem>

              {(detailModal.titre_groupe_utilisateur || detailModal.adresse_groupe_utilisateur) && (
                <DetailItem label="Groupe" full>
                  {detailModal.titre_groupe_utilisateur}
                  {detailModal.adresse_groupe_utilisateur ? ` — ${detailModal.adresse_groupe_utilisateur}` : ""}
                </DetailItem>
              )}

              {(detailModal.nom_responsable_reunion || detailModal.adresse_responsable_reunion) && (
                <DetailItem label="Responsable de la réunion" full>
                  {detailModal.nom_responsable_reunion}
                  {detailModal.adresse_responsable_reunion ? ` — ${detailModal.adresse_responsable_reunion}` : ""}
                </DetailItem>
              )}
            </dl>

            {detailModal.services?.length > 0 && (
              <div className="mt-4 border-t border-ink/10 pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/45">Services annexes</p>
                <ul className="space-y-1 text-sm">
                  {detailModal.services.map((rs) => (
                    <li key={rs.id_reservation_service} className="flex justify-between">
                      <span>{rs.service?.nom ?? "Service"} × {rs.quantite}</span>
                      <span className="font-medium">{formatMoney(rs.montant)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {detailModal.note_interne && (
              <div className="mt-4 rounded-lg bg-accent-soft p-3 text-sm text-ink/75">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent-dark">Note interne</p>
                {detailModal.note_interne}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              {detailModal.statut === "en_attente" && (
                <>
                  <button
                    className="btn-outline px-3 py-1.5 text-sm"
                    onClick={() => { setDetailModal(null); window.confirm("Refuser/annuler cette demande ?") && act(cancelBooking, detailModal, "Demande refusée."); }}
                  >
                    Refuser
                  </button>
                  <button
                    className="btn-primary px-3 py-1.5 text-sm"
                    onClick={() => { setDetailModal(null); act(validateBooking, detailModal, "Réservation validée."); }}
                  >
                    Valider
                  </button>
                </>
              )}
              <button className="btn-outline px-3 py-1.5 text-sm" onClick={() => setDetailModal(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DetailItem({ label, children, full = false }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink/40">{label}</dt>
      <dd className="mt-0.5 text-ink/80">{children}</dd>
    </div>
  );
}