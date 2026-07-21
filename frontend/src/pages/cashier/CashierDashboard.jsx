import { useCallback, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchPendingPayments } from "../../api/paymentApi";
import { usePolling } from "../../hooks/usePolling";
import { extractList } from "../../utils/extract";
import PageHeader from "../../components/common/PageHeader";
import { formatMoney } from "../../utils/formatMoney";
import { fetchCashierByMode, fetchCashierRevenue } from "../../api/chartApi";
import { DonutChart, BarsChart, ChartCard } from "../../components/common/Charts";
import StatCard from "../../components/common/StatCard";
import { LuHourglass, LuWallet } from "react-icons/lu";

export default function CashierDashboard() {
  const [payments, setPayments] = useState([]);

  const load = useCallback(async () => {
    try {
      const { data } = await fetchPendingPayments();
      setPayments(extractList(data));
    } catch { /* réessayé au prochain tick */ }
  }, []);
  usePolling(load, 10000);

  const [byMode, setByMode] = useState([]);
  const [rev, setRev] = useState([]);
  useEffect(() => {
    fetchCashierByMode().then(({ data }) => setByMode(Array.isArray(data) ? data : data.data ?? [])).catch(() => {});
    fetchCashierRevenue().then(({ data }) => setRev(Array.isArray(data) ? data : data.data ?? [])).catch(() => {});
  }, []);

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
        <StatCard label="Paiements à valider" value={pending.length} icon={LuHourglass} accent />
        <StatCard label="Montant en attente" value={formatMoney(totalPending)} icon={LuWallet} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ChartCard title="Paiements par mode">
          <DonutChart data={byMode} />
        </ChartCard>
        <ChartCard title="Encaissements des 7 derniers jours">
          <BarsChart data={rev} dataKey="montant" xKey="jour" name="Encaissé (FCFA)" />
        </ChartCard>
      </div>

      <p className="mt-6 text-sm text-ink/55">
        Rappel du parcours : un client dont la réservation est <strong>validée</strong> paie soit en ligne (Moov/Airtel — validation automatique),
        soit ici en espèces. La validation d'un paiement confirme la réservation et déclenche la facture.
      </p>
    </>
  );
}
