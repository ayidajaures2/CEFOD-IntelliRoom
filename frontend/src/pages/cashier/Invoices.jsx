import { useCallback, useEffect, useState } from "react";
import { fetchPendingPayments, recordPayment, validatePayment } from "../../api/paymentApi";
import { fetchAllBookings } from "../../api/bookingApi";
import { useNotify } from "../../contexts/NotificationContext";
import PageHeader from "../../components/common/PageHeader";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import StatutBadge from "../../components/common/StatutBadge";
import Modal from "../../components/common/Modal";
import { formatMoney } from "../../utils/formatMoney";
import { formatDateTime } from "../../utils/formatDate";
import { MODES_PAIEMENT, MODE_PAIEMENT_LABELS } from "../../utils/constants";
import { apiErrorMessage } from "../../utils/apiError";
import { extractList } from "../../utils/extract";
import { LuRefreshCw } from "react-icons/lu";

/**
 * Caisse : encaisser un paiement présentiel pour une réservation validée,
 * et valider les paiements en attente (le caissier clique « Valider » —
 * CLAUDE.md §4, cycle Paiement).
 */
export default function CashierPayments() {
  const { success, error: toastError } = useNotify();
  const [payments, setPayments] = useState([]);
  const [toCollect, setToCollect] = useState([]); // réservations validées sans paiement
  const [loading, setLoading] = useState(true);
  // AJOUT : distingue le chargement plein écran du refresh manuel (bouton)
  const [refreshing, setRefreshing] = useState(false);
  const [collecting, setCollecting] = useState(null);
  const [form, setForm] = useState({ montant: "", mode_paiement: "especes", reference: "" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const [p, b] = await Promise.all([fetchPendingPayments(), fetchAllBookings()]);
      setPayments(extractList(p.data));
      const bookings = extractList(b.data);
      setToCollect(bookings.filter((x) => x.statut === "validee"));
    } catch {
      toastError("Impossible de charger les données de caisse.");
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  }, [toastError]);
  useEffect(() => { load(); }, [load]);

  const openCollect = (b) => {
    setCollecting(b);
    setForm({ montant: b.montant_du ?? "", mode_paiement: "especes", reference: "" });
  };

  const submitCollect = async () => {
    setBusy(true);
    try {
      await recordPayment({
        id_reservation: collecting.id_reservation,
        montant: Number(form.montant),
        mode_paiement: form.mode_paiement,
        reference: form.reference || undefined,
      });
      success("Paiement enregistré.");
      setCollecting(null);
      load({ silent: true });
    } catch (e) {
      toastError(apiErrorMessage(e, "Enregistrement impossible."));
    } finally {
      setBusy(false);
    }
  };

  const validate = async (p) => {
    try {
      await validatePayment(p.id_paiement);
      success("Paiement validé — réservation confirmée, facture émise.");
      load({ silent: true });
    } catch (e) {
      toastError(apiErrorMessage(e, "Validation impossible."));
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Caisse"
        title="Paiements"
        actions={
          // AJOUT : bouton de rafraîchissement manuel (pas de polling sur cette page)
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
      {loading && <Loader />}

      {!loading && (
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Encaissements à faire */}
          <section>
            <h2 className="mb-3 font-display text-lg font-bold">Réservations validées — à encaisser</h2>
            {toCollect.length === 0 ? (
              <EmptyState title="Rien à encaisser" hint="Les réservations validées en attente de paiement s'affichent ici." />
            ) : (
              <ul className="grid gap-3">
                {toCollect.map((b) => (
                  <li key={b.id_reservation} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-medium">
                        {b.client ? `${b.client.prenom} ${b.client.nom}` : `Client #${b.id_client}`} — {b.salle?.nom_salle ?? `salle #${b.id_salle}`}
                      </p>
                      <p className="text-xs text-ink/50">{formatDateTime(b.date_debut)} → {formatDateTime(b.date_fin)}</p>
                    </div>
                    <button className="btn-primary px-3 py-2 text-sm" onClick={() => openCollect(b)}>Encaisser</button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Paiements enregistrés */}
          <section>
            <h2 className="mb-3 font-display text-lg font-bold">Paiements enregistrés</h2>
            {payments.length === 0 ? (
              <EmptyState title="Aucun paiement" />
            ) : (
              <div className="card overflow-x-auto">
                <table className="table-base">
                  <thead>
                    <tr><th>Montant</th><th>Mode</th><th>Référence</th><th>Statut</th><th className="text-right">Action</th></tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id_paiement}>
                        <td className="font-medium">{formatMoney(p.montant)}</td>
                        <td>{MODE_PAIEMENT_LABELS[p.mode_paiement] ?? p.mode_paiement}</td>
                        <td className="font-mono text-xs">{p.reference ?? "—"}</td>
                        <td><StatutBadge statut={p.statut} /></td>
                        <td className="text-right">
                          {p.statut === "en_attente" && (
                            <button className="btn-dark px-3 py-1.5 text-xs" onClick={() => validate(p)}>Valider</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      <Modal open={Boolean(collecting)} title="Encaisser un paiement" onClose={() => setCollecting(null)}>
        {collecting && (
          <div className="space-y-4">
            <p className="text-sm text-ink/60">
              {collecting.client ? `${collecting.client.prenom} ${collecting.client.nom}` : "Client"} —{" "}
              {collecting.salle?.nom_salle ?? `salle #${collecting.id_salle}`}
            </p>
            <div>
              <label className="field-label" htmlFor="montant">Montant (FCFA)</label>
              <input id="montant" type="number" min="0" className="field" value={form.montant}
                onChange={(e) => setForm((f) => ({ ...f, montant: e.target.value }))} />
            </div>
            <div>
              <span className="field-label">Mode de paiement</span>
              <div className="grid grid-cols-3 gap-2">
                {MODES_PAIEMENT.map((m) => (
                  <button key={m.value}
                    onClick={() => setForm((f) => ({ ...f, mode_paiement: m.value }))}
                    className={`rounded-lg border px-2 py-2 text-xs font-semibold ${
                      form.mode_paiement === m.value ? "border-accent bg-accent text-paper" : "border-ink/15 hover:border-accent"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="field-label" htmlFor="reference">Référence (optionnel)</label>
              <input id="reference" className="field" value={form.reference}
                onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
                placeholder="N° de transaction Mobile Money…" />
            </div>
            <button className="btn-primary w-full" onClick={submitCollect} disabled={busy || !form.montant}>
              {busy ? "Enregistrement…" : "Enregistrer le paiement"}
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}