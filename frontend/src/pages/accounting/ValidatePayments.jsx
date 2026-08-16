import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchAccountingPayments,
  recordManualPayment,
  validatePayment,
  cancelAccountingPayment,
} from "../../api/paymentApi";
import { fetchAllBookings } from "../../api/bookingApi";
import { useNotify } from "../../contexts/NotificationContext";
import PageHeader from "../../components/common/PageHeader";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import StatutBadge from "../../components/common/StatutBadge";
import Modal from "../../components/common/Modal";
import InvoicePreviewModal from "../../components/common/InvoicePreviewModal";
import { formatMoney } from "../../utils/formatMoney";
import { formatDateTime } from "../../utils/formatDate";
import { MODE_PAIEMENT_LABELS } from "../../utils/constants";
import { apiErrorMessage } from "../../utils/apiError";
import { extractList } from "../../utils/extract";
import { LuRefreshCw, LuArrowUpDown, LuFileText } from "react-icons/lu";

const MODES_COMPTABILITE = [
  { value: "cheque", label: "Chèque" },
  { value: "virement", label: "Virement bancaire" },
];

const COLUMNS = [
  { key: "client", label: "Client" },
  { key: "montant", label: "Montant" },
  { key: "mode_paiement", label: "Mode" },
  { key: "reference", label: "Référence" },
  { key: "date_paiement", label: "Date" },
  { key: "statut", label: "Statut" },
];

/**
 * La comptabilité valide les paiements manuels (encaisse → valide), quel
 * que soit qui les a enregistrés (caissier pour les espèces, elle-même
 * pour chèque/virement). La table du bas montre TOUS les paiements, tous
 * modes confondus (y compris Moov/Airtel, automatiques) — c'est une vue
 * d'ensemble/historique, pas seulement une file d'actions à traiter.
 */
export default function ValidatePayments() {
  const { success, error: toastError } = useNotify();
  const [payments, setPayments] = useState([]);
  const [toRecord, setToRecord] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [recording, setRecording] = useState(null);
  const [form, setForm] = useState({ montant: "", mode_paiement: "cheque", reference: "" });
  const [busy, setBusy] = useState(false);

  const [sortKey, setSortKey] = useState("date_paiement");
  const [sortDir, setSortDir] = useState("desc");
  const [previewId, setPreviewId] = useState(null);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const [p, b] = await Promise.all([fetchAccountingPayments(), fetchAllBookings()]);
      setPayments(extractList(p.data));
      const bookings = extractList(b.data);
      // Réservations validées, sans paiement en cours — candidates à un
      // enregistrement chèque/virement direct par la comptabilité.
      setToRecord(
        bookings.filter(
          (x) => x.statut === "validee" && (!x.paiement || x.paiement.statut === "annule")
        )
      );
    } catch {
      toastError("Impossible de charger les données comptables.");
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  }, [toastError]);
  useEffect(() => { load(); }, [load]);

  const openRecord = (b) => {
    setRecording(b);
    setForm({ montant: "", mode_paiement: "cheque", reference: "" });
  };

  const submitRecord = async () => {
    setBusy(true);
    try {
      await recordManualPayment({
        id_reservation: recording.id_reservation,
        montant: Number(form.montant),
        mode_paiement: form.mode_paiement,
        reference: form.reference.trim(),
      });
      success("Paiement enregistré. Vérifiez sa conformité avant de le valider.");
      setRecording(null);
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

  const cancel = async (p) => {
    if (!window.confirm("Annuler ce paiement ? La réservation repassera à validée.")) return;
    try {
      await cancelAccountingPayment(p.id_paiement);
      success("Paiement annulé.");
      load({ silent: true });
    } catch (e) {
      toastError(apiErrorMessage(e, "Annulation impossible."));
    }
  };

  const toggleSort = (key) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedPayments = useMemo(() => {
    const withClientName = payments.map((p) => ({
      ...p,
      _client: p.reservation?.client ? `${p.reservation.client.prenom} ${p.reservation.client.nom}` : "",
    }));

    const dir = sortDir === "asc" ? 1 : -1;
    return withClientName.sort((a, b) => {
      let va, vb;
      switch (sortKey) {
        case "client": va = a._client; vb = b._client; break;
        case "montant": va = Number(a.montant); vb = Number(b.montant); break;
        case "date_paiement": va = new Date(a.date_paiement); vb = new Date(b.date_paiement); break;
        default: va = a[sortKey] ?? ""; vb = b[sortKey] ?? "";
      }
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
  }, [payments, sortKey, sortDir]);

  return (
    <>
      <PageHeader
        eyebrow="Comptabilité"
        title="Paiements"
        subtitle="Enregistrez chèque/virement, puis validez après vérification de conformité — quel que soit le mode."
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
            <h2 className="mb-3 font-display text-lg font-bold">Réservations validées — chèque / virement à enregistrer</h2>
            {toRecord.length === 0 ? (
              <EmptyState title="Rien à enregistrer" hint="Le cash est encaissé par la caisse ; seuls chèque et virement se font ici." />
            ) : (
              <div className="card overflow-x-auto">
                <table className="table-base">
                  <thead>
                    <tr><th>Client</th><th>Salle</th><th>Période</th><th className="text-right">Action</th></tr>
                  </thead>
                  <tbody>
                    {toRecord.map((b) => (
                      <tr key={b.id_reservation}>
                        <td className="font-medium">
                          {b.client ? `${b.client.prenom} ${b.client.nom}` : `Client #${b.id_client}`}
                        </td>
                        <td>{b.salle?.nom_salle ?? `salle #${b.id_salle}`}</td>
                        <td className="text-xs text-ink/50">
                          {formatDateTime(b.date_debut)} → {formatDateTime(b.date_fin)}
                        </td>
                        <td className="text-right">
                          <button className="btn-primary px-3 py-1.5 text-xs" onClick={() => openRecord(b)}>Enregistrer</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-1 font-display text-lg font-bold">Tous les paiements</h2>
            <p className="mb-3 text-xs text-ink/45">
              Tous les modes confondus — espèces, chèque, virement, Moov Money, Airtel Money. Cliquez sur une colonne pour trier.
            </p>
            {payments.length === 0 ? (
              <EmptyState title="Aucun paiement" />
            ) : (
              <div className="card overflow-x-auto">
                <table className="table-base">
                  <thead>
                    <tr>
                      {COLUMNS.map((c) => (
                        <th key={c.key}>
                          <button
                            onClick={() => toggleSort(c.key)}
                            className="flex items-center gap-1 font-semibold hover:text-accent"
                          >
                            {c.label}
                            <LuArrowUpDown size={12} className={sortKey === c.key ? "text-accent" : "text-ink/30"} />
                          </button>
                        </th>
                      ))}
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPayments.map((p) => (
                      <tr key={p.id_paiement}>
                        <td className="font-medium">
                          {p.reservation?.client ? `${p.reservation.client.prenom} ${p.reservation.client.nom}` : `Réservation #${p.id_reservation}`}
                        </td>
                        <td>{formatMoney(p.montant)}</td>
                        <td>{MODE_PAIEMENT_LABELS[p.mode_paiement] ?? p.mode_paiement}</td>
                        <td className="font-mono text-xs">{p.reference}</td>
                        <td className="text-xs text-ink/55">{formatDateTime(p.date_paiement)}</td>
                        <td><StatutBadge statut={p.statut} /></td>
                        <td className="text-right">
                          <div className="flex justify-end gap-2">
                            {p.facture && (
                              <button
                                className="btn-outline flex items-center gap-1 px-2.5 py-1.5 text-xs"
                                onClick={() => setPreviewId(p.facture.id_facture)}
                                title="Aperçu de la facture"
                              >
                                <LuFileText size={13} />
                              </button>
                            )}
                            {p.statut === "encaisse" && (
                              <>
                                <button className="btn-dark px-3 py-1.5 text-xs" onClick={() => validate(p)}>Valider</button>
                                <button className="btn-outline px-3 py-1.5 text-xs" onClick={() => cancel(p)}>Annuler</button>
                              </>
                            )}
                          </div>
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

      <Modal open={Boolean(recording)} title="Enregistrer un paiement chèque / virement" onClose={() => setRecording(null)}>
        {recording && (
          <div className="space-y-4">
            <p className="text-sm text-ink/60">
              {recording.client ? `${recording.client.prenom} ${recording.client.nom}` : "Client"} —{" "}
              {recording.salle?.nom_salle ?? `salle #${recording.id_salle}`}
            </p>
            <div>
              <span className="field-label">Mode de paiement</span>
              <div className="grid grid-cols-2 gap-2">
                {MODES_COMPTABILITE.map((m) => (
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
              <label className="field-label" htmlFor="montant">Montant (FCFA)</label>
              <input id="montant" type="number" min="0" className="field" value={form.montant}
                onChange={(e) => setForm((f) => ({ ...f, montant: e.target.value }))} />
            </div>
            <div>
              <label className="field-label" htmlFor="reference">
                {form.mode_paiement === "cheque" ? "Numéro du chèque" : "Référence du virement"} <span className="text-red-500">*</span>
              </label>
              <input id="reference" className="field" value={form.reference}
                onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
                placeholder={form.mode_paiement === "cheque" ? "N° inscrit sur le chèque" : "N° de bordereau / référence bancaire"}
                required />
              <p className="mt-1 text-xs text-ink/45">Obligatoire et unique — à vérifier avant validation.</p>
            </div>
            <button
              className="btn-primary w-full"
              onClick={submitRecord}
              disabled={busy || !form.montant || !form.reference.trim()}
            >
              {busy ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        )}
      </Modal>

      <InvoicePreviewModal invoiceId={previewId} onClose={() => setPreviewId(null)} />
    </>
  );
}