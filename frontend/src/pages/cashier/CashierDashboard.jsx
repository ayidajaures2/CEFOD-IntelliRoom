import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { fetchPendingPayments } from "../../api/paymentApi";
import { usePolling } from "../../hooks/usePolling";
import { extractList } from "../../utils/extract";
import PageHeader from "../../components/common/PageHeader";
import { formatMoney } from "../../utils/formatMoney";

export default function CashierDashboard() {
  const [payments, setPayments] = useState([]);

  const load = useCallback(async () => {
    try {
      const { data } = await fetchPendingPayments();
      setPayments(extractList(data));
    } catch { /* réessayé au prochain tick */ }
  }, []);
  usePolling(load, 10000);

  const pending = payments.filter((p) => p.statut === "en_attente");
  const totalPending = pending.reduce((s, p) => s + Number(p.montant ?? 0), 0);

  return (
    <>
      <PageHeader
        eyebrow="Caisse"
        title="Tableau de bord"
        actions={<Link to="/caisse/paiements" className="btn-primary">Gérer les paiements</Link>}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card border-accent/40 bg-accent-soft p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-dark">Paiements à valider</p>
          <p className="mt-1 font-display text-3xl font-black text-accent-dark">{pending.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">Montant en attente</p>
          <p className="mt-1 font-display text-3xl font-black">{formatMoney(totalPending)}</p>
        </div>
      </div>
      <p className="mt-6 text-sm text-ink/55">
        Rappel du parcours : un client dont la réservation est <strong>validée</strong> paie soit en ligne (Moov/Airtel — validation automatique),
        soit ici en espèces. La validation d'un paiement confirme la réservation et déclenche la facture.
      </p>
    </>
  );
}
