import { useEffect, useMemo, useState } from "react";
import { fetchStats } from "../../api/reportApi";
import { fetchAllBookings } from "../../api/bookingApi";
import PageHeader from "../../components/common/PageHeader";
import Loader from "../../components/common/Loader";
import { DonutChart, BarsChart, ChartCard } from "../../components/common/Charts";
import { STATUT_RESERVATION_LABELS } from "../../utils/constants";

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
        <ChartCard title="Réservations par statut">
          <DonutChart data={byStatus} />
        </ChartCard>

        <ChartCard title="Réservations par salle">
          <BarsChart data={byRoom} dataKey="reservations" xKey="name" name="Réservations" maxBarSize={48} barCategoryGap="35%" />
        </ChartCard>
      </div>
    </>
  );
}