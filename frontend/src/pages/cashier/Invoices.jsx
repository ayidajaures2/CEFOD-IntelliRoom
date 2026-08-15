import { useCallback, useEffect, useState } from "react";
import { fetchPendingPayments, recordPayment } from "../../api/paymentApi";
import { fetchAllBookings } from "../../api/bookingApi";
import { useNotify } from "../../contexts/NotificationContext";
import PageHeader from "../../components/common/PageHeader";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import StatutBadge from "../../components/common/StatutBadge";
import Modal from "../../components/common/Modal";
import { formatMoney } from "../../utils/formatMoney";
import { formatDateTime } from "../../utils/formatDate";
import { apiErrorMessage } from "../../utils/apiError";
import { extractList } from "../../utils/extract";
import { LuRefreshCw } from "react-icons/lu";

/**
 * Le caissier n'encaisse QUE les espèces (chèque/virement sont enregistrés
 * directement par la comptabilité, voir pages/accounting/). Il ne valide
 * plus rien lui-même — l'encaissement passe au statut "encaisse" et attend
 * la validation de la comptabilité (pages/accounting/ValidatePayments.jsx).
 */
export default function CashierPayments() {
  const { success, error: toastError } = useNotify();
  const [payments, setPayments] = useState([]);
  const [toCollect, setToCollect] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [collecting, setCollecting] = useState(null);
  const [form, setForm] = useState({ montant: "", reference: "" });
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
    setForm({ montant: b.montant_du ?? "", reference: "" });
  };

  const submitCollect = async () => {
    setBusy(true);
    try {
      await recordPayment({
        id_reservation: collecting.id_reservation,
        montant: Number(form.montant),
        reference: form.reference.trim(),
      });
      success("Paiement encaissé. En attente de validation par la comptabilité.");
      setCollecting(null);
      load({ silent: true });
    } catch (e) {
      toastError(apiErrorMessage(e, "Enregistrement impossible."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Caisse"
        title="Paiements — espèces"
        subtitle="Encaissement présentiel uniquement. La comptabilité valide ensuite chaque encaissement avant confirmation de la réservation."
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
      {loading && <Loader />}

      {!loading && (
        <div className="flex flex-col gap-8">
          <section>
            <h2 className="mb-3 font-display text-lg font-bold">Réservations validées — à encaisser</h2>
            {toCollect.length === 0 ? (
              <EmptyState title="Rien à encaisser" hint="Les réservations validées en attente de paiement s'affichent ici." />
            ) : (
              <div className="card overflow-x-auto">
                <table className="table-base">
                  <thead>
                    <tr><th>Client</th><th>Salle</th><th>Période</th><th className="text-right">Action</th></tr>
                  </thead>
                  <tbody>
                    {toCollect.map((b) => (
                      <tr key={b.id_reservation}>
                        <td className="font-medium">
                          {b.client ? `${b.client.prenom} ${b.client.nom}` : `Client #${b.id_client}`}
                        </td>
                        <td>{b.salle?.nom_salle ?? `salle #${b.id_salle}`}</td>
                        <td className="text-xs text-ink/50">
                          {formatDateTime(b.date_debut)} → {formatDateTime(b.date_fin)}
                        </td>
                        <td className="text-right">
                          <button className="btn-primary px-3 py-1.5 text-xs" onClick={() => openCollect(b)}>Encaisser (espèces)</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-bold">Encaissements récents</h2>
            {payments.length === 0 ? (
              <EmptyState title="Aucun encaissement" />
            ) : (
              <div className="card overflow-x-auto">
                <table className="table-base">
                  <thead>
                    <tr><th>Montant</th><th>Référence</th><th>Statut</th></tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id_paiement}>
                        <td className="font-medium">{formatMoney(p.montant)}</td>
                        <td className="font-mono text-xs">{p.reference}</td>
                        <td><StatutBadge statut={p.statut} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      <Modal open={Boolean(collecting)} title="Encaisser un paiement en espèces" onClose={() => setCollecting(null)}>
        {collecting && (
          <div className="space-y-4">
            <p className="text-sm text-ink/60">
              {collecting.client ? `${collecting.client.prenom} ${collecting.client.nom}` : "Client"} —{" "}
              {collecting.salle?.nom_salle ?? `salle #${collecting.id_salle}`}
            </p>
            <div>
              <label className="field-label" htmlFor="montant">Montant reçu (FCFA)</label>
              <input id="montant" type="number" min="0" className="field" value={form.montant}
                onChange={(e) => setForm((f) => ({ ...f, montant: e.target.value }))} />
            </div>
            <div>
              <label className="field-label" htmlFor="reference">Référence du reçu <span className="text-red-500">*</span></label>
              <input id="reference" className="field" value={form.reference}
                onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
                placeholder="Numéro inscrit sur le reçu remis au client" required />
              <p className="mt-1 text-xs text-ink/45">
                Obligatoire et unique — c'est ce numéro que la comptabilité vérifiera avant de valider.
              </p>
            </div>
            <button className="btn-primary w-full" onClick={submitCollect} disabled={busy || !form.montant || !form.reference.trim()}>
              {busy ? "Enregistrement…" : "Enregistrer l'encaissement"}
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}