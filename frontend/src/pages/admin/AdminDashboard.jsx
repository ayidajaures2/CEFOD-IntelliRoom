import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchStats } from "../../api/reportApi";
import { fetchAllBookings } from "../../api/bookingApi";
import PageHeader from "../../components/common/PageHeader";
import Loader from "../../components/common/Loader";
import StatutBadge from "../../components/common/StatutBadge";
import { formatDateTime } from "../../utils/formatDate";
import { formatMoney } from "../../utils/formatMoney";
import { fetchAdminChart, fetchAdminOccupancy, fetchAdminRevenue } from "../../api/chartApi";
import { BarsChart, DonutChart, ChartCard } from "../../components/common/Charts";
import StatCard from "../../components/common/StatCard";
import { LuCalendarDays, LuHourglass, LuChartBar, LuBanknote } from "react-icons/lu";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  const [chart, setChart] = useState([]);
  const [occ, setOcc] = useState([]);
  const [rev, setRev] = useState([]);
  useEffect(() => {
    fetchAdminChart().then(({ data }) => setChart(Array.isArray(data) ? data : data.data ?? [])).catch(() => {});
    fetchAdminOccupancy().then(({ data }) => setOcc(Array.isArray(data) ? data : data.data ?? [])).catch(() => {});
    fetchAdminRevenue().then(({ data }) => setRev(Array.isArray(data) ? data : data.data ?? [])).catch(() => {});
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
    { label: "En attente", value: stats?.reservations_en_attente ?? recent.filter((b) => b.statut === "en_attente").length, icon: LuHourglass, accent: true },
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

          <div className="mb-6 grid gap-6 xl:grid-cols-2">
            <ChartCard title="Réservations par mois">
              <BarsChart data={chart} dataKey="reservations" xKey="mois" name="Réservations" />
            </ChartCard>
            <ChartCard title="Occupation des salles">
              <DonutChart data={occ} />
            </ChartCard>
            <div className="xl:col-span-2">
              <ChartCard title="Revenus par salle">
                <BarsChart data={rev} dataKey="revenus" xKey="salle" name="Revenus (FCFA)" color="#0d0d0d" />
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
