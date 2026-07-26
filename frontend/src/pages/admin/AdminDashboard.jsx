import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchStats } from "../../api/reportApi";
import { fetchAllBookings } from "../../api/bookingApi";
import PageHeader from "../../components/common/PageHeader";
import Loader from "../../components/common/Loader";
import StatutBadge from "../../components/common/StatutBadge";
import { formatDateTime } from "../../utils/formatDate";
import { formatMoney } from "../../utils/formatMoney";
import {
  fetchAdminChart, fetchAdminOccupancy, fetchAdminRevenue, fetchAdminRevenueMonthly,
} from "../../api/chartApi";
import { BarsChart, DonutChart, AreaTrend, ChartCard } from "../../components/common/Charts";
import StatCard from "../../components/common/StatCard";
import { LuCalendarDays, LuHourglass, LuChartBar, LuBanknote } from "react-icons/lu";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  const [chart, setChart] = useState([]);
  const [occ, setOcc] = useState([]);
  const [rev, setRev] = useState([]);
  const [revMonthly, setRevMonthly] = useState([]);

  useEffect(() => {
    const grab = (setter) => ({ data }) => setter(Array.isArray(data) ? data : data.data ?? []);
    fetchAdminChart().then(grab(setChart)).catch(() => {});
    fetchAdminOccupancy().then(grab(setOcc)).catch(() => {});
    fetchAdminRevenue().then(grab(setRev)).catch(() => {});
    fetchAdminRevenueMonthly().then(grab(setRevMonthly)).catch(() => {});
  }, []);

  useEffect(() => {
    Promise.allSettled([fetchStats(), fetchAllBookings()])
      .then(([s, b]) => {
        if (s.status === "fulfilled") setStats(s.value.data.data ?? s.value.data);
        if (b.status === "fulfilled") {
          const list = Array.isArray(b.value.data) ? b.value.data : b.value.data.data ?? [];
          setRecent(list.slice(0, 8));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: "Réservations totales", value: stats?.total_reservations ?? recent.length, icon: LuCalendarDays },
    { label: "En attente", value: stats?.reservations_en_attente ?? recent.filter((b) => b.statut === "en_attente").length, icon: LuHourglass},
    { label: "Taux d'occupation", value: stats?.taux_occupation != null ? `${stats.taux_occupation}%` : "—", icon: LuChartBar },
    { label: "Revenus encaissés", value: stats?.revenus != null ? formatMoney(stats.revenus) : "—", icon: LuBanknote },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Vue d'ensemble"
        actions={<Link to="/admin/rapports" className="btn-outline">Voir les rapports</Link>}
      />

      {loading ? <Loader /> : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((c) => (
              <StatCard key={c.label} label={c.label} value={c.value} icon={c.icon} accent={c.accent} />
            ))}
          </div>

          <div className="mb-6 grid gap-6">
            <ChartCard title="Évolution des réservations (6 derniers mois)">
              <AreaTrend data={chart} dataKey="reservations" xKey="mois" name="Réservations" color="#f97316" />
            </ChartCard>
            <ChartCard title="Évolution des revenus encaissés (6 derniers mois)">
              <AreaTrend data={revMonthly} dataKey="revenus" xKey="mois" name="Revenus (FCFA)" color="#c2410c" />
            </ChartCard>
          </div>

          <div className="mb-6 grid gap-6 xl:grid-cols-2">
            <ChartCard title="Réservations par mois">
              <BarsChart data={chart} dataKey="reservations" xKey="mois" name="Réservations" />
            </ChartCard>
            <ChartCard title="Occupation des salles">
              <DonutChart data={occ} />
            </ChartCard>
            {/* ✅ CORRIGÉ : Revenus par salle en courbe aire (style D) */}
            <div className="xl:col-span-2">
              <ChartCard title="Revenus par salle">
                <AreaTrend data={rev} dataKey="revenus" xKey="salle" name="Revenus (FCFA)" color="#f97316" fillOpacity={0.08} />
              </ChartCard>
            </div>
          </div>

          <section className="card p-5">
            <h2 className="mb-3 font-display text-lg font-bold">Dernières réservations</h2>
            {recent.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink/45">Aucune réservation enregistrée.</p>
            ) : (
              <ul className="divide-y divide-ink/5">
                {recent.map((b) => (
                  <li key={b.id_reservation} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div>
                      <p className="font-medium">
                        {b.client ? `${b.client.prenom} ${b.client.nom}` : `Client #${b.id_client}`} — {b.salle?.nom_salle ?? `salle #${b.id_salle}`}
                      </p>
                      <p className="text-xs text-ink/50">{formatDateTime(b.date_debut)} → {formatDateTime(b.date_fin)}</p>
                    </div>
                    <StatutBadge statut={b.statut_effectif ?? b.statut} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </>
  );
}