import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { fetchStats } from "../../api/reportApi";
import { fetchAllBookings } from "../../api/bookingApi";
import PageHeader from "../../components/common/PageHeader";
import Loader from "../../components/common/Loader";
import { STATUT_RESERVATION_LABELS } from "../../utils/constants";

/* Palette imposée : dégradés de l'encre et de l'orange uniquement. */
const COLORS = ["#f97316", "#0d0d0d", "#c2410c", "#fdba74", "#525252"];

export default function Reports() {
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([fetchStats(), fetchAllBookings()])
      .then(([s, b]) => {
        if (s.status === "fulfilled") setStats(s.value.data.data ?? s.value.data);
        if (b.status === "fulfilled") {
          setBookings(Array.isArray(b.value.data) ? b.value.data : b.value.data.data ?? []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  /* Répartition par statut : fournie par l'API, sinon calculée localement. */
  const byStatus = useMemo(() => {
    if (stats?.par_statut) {
      return Object.entries(stats.par_statut).map(([k, v]) => ({
        name: STATUT_RESERVATION_LABELS[k] ?? k, value: Number(v),
      }));
    }
    const counts = bookings.reduce((acc, b) => {
      acc[b.statut] = (acc[b.statut] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([k, v]) => ({ name: STATUT_RESERVATION_LABELS[k] ?? k, value: v }));
  }, [stats, bookings]);

  /* Réservations par salle. */
  const byRoom = useMemo(() => {
    if (stats?.par_salle) {
      return stats.par_salle.map((s) => ({ name: s.nom_salle, reservations: Number(s.total) }));
    }
    const counts = bookings.reduce((acc, b) => {
      const name = b.salle?.nom_salle ?? `Salle #${b.id_salle}`;
      acc[name] = (acc[name] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, reservations]) => ({ name, reservations }));
  }, [stats, bookings]);

  if (loading) return <Loader full />;

  return (
    <>
      <PageHeader eyebrow="Administration" title="Rapports & statistiques" subtitle="Répartition des réservations par statut et par salle." />

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-4 font-display text-lg font-bold">Réservations par statut</h2>
          {byStatus.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink/45">Pas encore de données.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                  {byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </section>

        <section className="card p-5">
          <h2 className="mb-4 font-display text-lg font-bold">Réservations par salle</h2>
          {byRoom.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink/45">Pas encore de données.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byRoom}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0d0d0d15" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="reservations" name="Réservations" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>
      </div>
    </>
  );
}
