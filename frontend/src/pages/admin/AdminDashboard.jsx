import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchStats } from "../../api/reportApi";
import { fetchAllBookings } from "../../api/bookingApi";
import PageHeader from "../../components/common/PageHeader";
import Loader from "../../components/common/Loader";
import StatutBadge from "../../components/common/StatutBadge";
import { formatDateTime } from "../../utils/formatDate";
import { formatMoney } from "../../utils/formatMoney";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

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
    ["Réservations totales", stats?.total_reservations ?? recent.length, null],
    ["En attente", stats?.reservations_en_attente ?? recent.filter((b) => b.statut === "en_attente").length, "/reception/reservations"],
    ["Taux d'occupation", stats?.taux_occupation != null ? `${stats.taux_occupation}%` : "—", "/admin/rapports"],
    ["Revenus encaissés", stats?.revenus != null ? formatMoney(stats.revenus) : "—", "/admin/rapports"],
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
            {cards.map(([label, value]) => (
              <div key={label} className="card p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">{label}</p>
                <p className="mt-1 font-display text-2xl font-black text-accent-dark">{value}</p>
              </div>
            ))}
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
