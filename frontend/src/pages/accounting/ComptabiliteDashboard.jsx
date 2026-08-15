import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAccountingPayments } from "../../api/paymentApi";
import { usePolling } from "../../hooks/usePolling";
import { extractList } from "../../utils/extract";
import { formatMoney } from "../../utils/formatMoney";
import { fetchAccountingByMode, fetchAccountingRevenue } from "../../api/chartApi";
import { DonutChart, BarsChart, ChartCard } from "../../components/common/Charts";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import StatutBadge from "../../components/common/StatutBadge";
import { formatDateTime } from "../../utils/formatDate";
import { MODE_PAIEMENT_LABELS } from "../../utils/constants";
import { LuHourglass, LuWallet, LuFileCheck } from "react-icons/lu";

/**
 * La comptabilité valide TOUS les paiements manuels (espèces encaissées par
 * le caissier, chèque/virement qu'elle enregistre elle-même). Les paiements
 * mobile money (Moov/Airtel) n'apparaissent jamais ici : ils sont validés
 * automatiquement par l'API, sans passer par ce tableau.
 */
export default function ComptabiliteDashboard() {
  const [payments, setPayments] = useState([]);

  const load = useCallback(async () => {
    try {
      const { data } = await fetchAccountingPayments();
      setPayments(extractList(data));
    } catch { /* réessayé au prochain tick */ }
  }, []);
  usePolling(load, 20000);

  const [byMode, setByMode] = useState([]);
  const [rev, setRev] = useState([]);
  useEffect(() => {
    fetchAccountingByMode().then(({ data }) => setByMode(Array.isArray(data) ? data : data.data ?? [])).catch(() => {});
    fetchAccountingRevenue().then(({ data }) => setRev(Array.isArray(data) ? data : data.data ?? [])).catch(() => {});
  }, []);

  const pending = payments.filter((p) => p.statut === "encaisse");
  const totalPending = pending.reduce((s, p) => s + Number(p.montant ?? 0), 0);
  const totalValide = payments
    .filter((p) => p.statut === "valide")
    .reduce((s, p) => s + Number(p.montant ?? 0) + Number(p.frais ?? 0), 0);

  // Les plus anciens en premier — éviter qu'un dossier traîne.
  const oldestPending = [...pending].sort(
    (a, b) => new Date(a.date_paiement) - new Date(b.date_paiement)
  );

  return (
    <>
      <PageHeader
        eyebrow="Comptabilité"
        title="Tableau de bord"
        actions={<Link to="/comptabilite/paiements" className="btn-primary">Valider les paiements</Link>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="En attente de validation" value={pending.length} icon={LuHourglass} accent />
        <StatCard label="Montant en attente" value={formatMoney(totalPending)} icon={LuWallet} />
        <StatCard label="Total validé (cumul)" value={formatMoney(totalValide)} icon={LuFileCheck} />
      </div>

      <section className="card mt-6 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">À vérifier en priorité</h2>
          <Link to="/comptabilite/paiements" className="text-sm font-medium text-accent hover:text-accent-dark">Tout voir</Link>
        </div>
        {oldestPending.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink/45">Rien à valider pour l'instant.</p>
        ) : (
          <ul className="divide-y divide-ink/5">
            {oldestPending.slice(0, 6).map((p) => (
              <li key={p.id_paiement} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium">
                    {p.reservation?.client ? `${p.reservation.client.prenom} ${p.reservation.client.nom}` : `Réservation #${p.id_reservation}`}
                    {" — "}{formatMoney(p.montant)}
                  </p>
                  <p className="text-xs text-ink/50">
                    {MODE_PAIEMENT_LABELS[p.mode_paiement] ?? p.mode_paiement} · Réf. {p.reference} · {formatDateTime(p.date_paiement)}
                  </p>
                </div>
                <StatutBadge statut={p.statut} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ChartCard title="Paiements validés par mode">
          <DonutChart data={byMode} />
        </ChartCard>
        <ChartCard title="Revenus validés des 7 derniers jours">
          <BarsChart data={rev} dataKey="montant" xKey="jour" name="Validé (FCFA)" maxBarSize={48} barCategoryGap="35%" />
        </ChartCard>
      </div>
    </>
  );
}