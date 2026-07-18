import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { cancelBooking, fetchMyBookings, fetchBooking } from "../../api/bookingApi";
import { initiateOnlinePayment } from "../../api/paymentApi";
import { useNotify } from "../../contexts/NotificationContext";
import { useAuth } from "../../hooks/useAuth";
import { usePolling } from "../../hooks/usePolling";
import PageHeader from "../../components/common/PageHeader";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import StatutBadge from "../../components/common/StatutBadge";
import Modal from "../../components/common/Modal";
import { formatDateTime } from "../../utils/formatDate";
import { formatMoney } from "../../utils/formatMoney";
import { MODES_PAIEMENT } from "../../utils/constants";
import { apiErrorMessage } from "../../utils/apiError";

/**
 * Mes réservations + paiement en ligne : quand la réservation est `validee`,
 * le client voit le prix final recalculé AVANT de payer (CLAUDE.md §3, étape 6).
 */
const STATUS_HINTS = {
  en_attente: "La réception examine votre demande — rien à payer pour l'instant.",
  validee: "Validée ! Payez en ligne ici, ou en espèces à la caisse du CEFOD.",
  confirmee: "Payée et confirmée — votre facture est disponible.",
  en_cours: "Votre créneau est en cours.",
  terminee: "Créneau terminé — merci !",
  annulee: "Réservation annulée.",
};

export default function MyBookings() {
  const { success, error: toastError } = useNotify();
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null); // réservation en cours de paiement
  const [price, setPrice] = useState(null);
  const [mode, setMode] = useState("moov_money");
  const [busy, setBusy] = useState(false);
  const [telephone, setTelephone] = useState("");

  const load = useCallback(async () => {
    try {
      const { data } = await fetchMyBookings();
      setBookings(Array.isArray(data) ? data : data.data ?? []);
    } catch {
      toastError("Impossible de charger vos réservations.");
    } finally {
      setLoading(false);
    }
  }, [toastError]);
  usePolling(load, 10000); // statuts mis à jour automatiquement (validation, paiement…)

  const handleCancel = async (b) => {
    if (!window.confirm(`Annuler la réservation de « ${b.salle?.nom_salle ?? "cette salle"} » ?`)) return;
    try {
      await cancelBooking(b.id_reservation);
      success("Réservation annulée.");
      load();
    } catch (e) {
      toastError(apiErrorMessage(e, "Annulation impossible."));
    }
  };

  /** Même barème que PaymentController::calculatePrice côté serveur. */
  const computePrice = (bk) => {
    if (bk.paiement?.montant != null) return Number(bk.paiement.montant);
    const tarifs = bk.salle?.tarifs ?? [];
    const tarif =
      tarifs.find((t) => t.categorie_client === user?.categorie_client) ?? tarifs[0];
    if (!tarif) return null;
    const debut = new Date(bk.date_debut);
    const fin = new Date(bk.date_fin);
    const heures = Math.max(1, Math.ceil((fin - debut) / 3_600_000));
    const unites = tarif.unite === "heure" ? heures : Math.max(1, Math.ceil(heures / 24));
    return Number(tarif.prix) * unites;
  };

  const openPayment = async (b) => {
    setPaying(b);
    setPrice(null);
    setTelephone(user?.telephone ?? "");
    try {
      const { data } = await fetchBooking(b.id_reservation);
      const bk = data.data ?? data;
      setPrice(computePrice(bk));
    } catch {
      setPrice(computePrice(b)); // repli sur les données déjà chargées
    }
  };

  const confirmPayment = async () => {
    setBusy(true);
    try {
      await initiateOnlinePayment({
        id_reservation: paying.id_reservation,
        mode_paiement: mode,
        telephone,
      });
      success("Paiement initié. Suivez les instructions sur votre téléphone.");
      setPaying(null);
      load();
    } catch (e) {
      toastError(apiErrorMessage(e, "Le paiement n'a pas pu être initié."));
    } finally {
      setBusy(false);
    }
  };

  const onlineModes = MODES_PAIEMENT.filter((m) => m.value !== "especes");

  return (
    <>
      <PageHeader
        eyebrow="Suivi"
        title="Mes réservations"
        actions={<Link to="/client/reserver" className="btn-primary">Nouvelle réservation</Link>}
      />

      <div className="mb-5 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-ink/80">
        <strong className="text-accent-dark">Comment ça marche ?</strong>{" "}
        ① Vous envoyez la demande → ② la réception la <strong>valide</strong> → ③ vous <strong>payez</strong>
        (en ligne ci-dessous via Moov/Airtel, ou en espèces à la caisse du CEFOD) → ④ la réservation est
        <strong> confirmée</strong> et votre facture est générée.
      </div>

      {loading && <Loader />}
      {!loading && bookings.length === 0 && (
        <EmptyState
          title="Aucune réservation"
          hint="Réservez votre première salle : la demande est gratuite et sans engagement."
          action={<Link to="/client/reserver" className="btn-primary">Réserver une salle</Link>}
        />
      )}

      {bookings.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Salle</th><th>Début</th><th>Fin</th><th>Motif</th><th>Statut</th><th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const statut = b.statut_effectif ?? b.statut;
                return (
                  <tr key={b.id_reservation}>
                    <td className="font-medium">{b.salle?.nom_salle ?? `Salle #${b.id_salle}`}</td>
                    <td>{formatDateTime(b.date_debut)}</td>
                    <td>{formatDateTime(b.date_fin)}</td>
                    <td className="max-w-48 truncate text-ink/60">{b.motif}</td>
                    <td>
                      <StatutBadge statut={statut} />
                      <p className="mt-1 max-w-[220px] text-[11px] leading-snug text-ink/50">{STATUS_HINTS[statut] ?? ""}</p>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        {b.statut === "validee" && (
                          <button className="btn-primary px-3 py-1.5 text-xs" onClick={() => openPayment(b)}>Payer en ligne</button>
                        )}
                        {["en_attente", "validee"].includes(b.statut) && (
                          <button className="btn-outline px-3 py-1.5 text-xs" onClick={() => handleCancel(b)}>Annuler</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={Boolean(paying)} title="Paiement en ligne" onClose={() => setPaying(null)}>
        {paying && (
          <div className="space-y-4">
            <p className="text-sm text-ink/60">
              Réservation de <strong className="text-ink">{paying.salle?.nom_salle ?? `salle #${paying.id_salle}`}</strong>,
              du {formatDateTime(paying.date_debut)} au {formatDateTime(paying.date_fin)}.
            </p>
            <div className="rounded-xl bg-accent-soft p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent-dark">Montant à payer</p>
              <p className="font-display text-2xl font-black text-ink">
                {price != null ? formatMoney(price) : "Calcul en cours…"}
              </p>
            </div>
            <div>
              <span className="field-label">Moyen de paiement</span>
              <div className="grid grid-cols-2 gap-2">
                {onlineModes.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setMode(m.value)}
                    className={`rounded-lg border px-3 py-2.5 text-sm font-semibold ${
                      mode === m.value ? "border-accent bg-accent text-paper" : "border-ink/15 hover:border-accent"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="field-label" htmlFor="pay-tel">Numéro Mobile Money</label>
              <input
                id="pay-tel" className="field" value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="66 00 00 00" inputMode="tel"
              />
              <p className="mt-1 text-xs text-ink/45">La demande de confirmation sera envoyée sur ce numéro.</p>
            </div>
            <button className="btn-dark w-full" onClick={confirmPayment} disabled={busy || !telephone.trim()}>
              {busy ? "Initialisation…" : "Confirmer le paiement"}
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}
