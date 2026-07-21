import { useCallback, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchAllBookings } from "../../api/bookingApi";
import { fetchOccupation } from "../../api/roomApi";
import { usePolling } from "../../hooks/usePolling";
import PageHeader from "../../components/common/PageHeader";
import StatutBadge from "../../components/common/StatutBadge";
import { formatDateTime } from "../../utils/formatDate";
import { fetchReceptionChart, fetchReceptionOccupancy } from "../../api/chartApi";
import { StackedBars, DonutChart, ChartCard } from "../../components/common/Charts";
import StatCard from "../../components/common/StatCard";
import { LuHourglass, LuCircleCheck, LuBuilding2 } from "react-icons/lu";

export default function ReceptionistDashboard() {
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);

  const load = useCallback(async () => {
    try {
      const [b, r] = await Promise.all([fetchAllBookings(), fetchOccupation()]);
      setBookings(Array.isArray(b.data) ? b.data : b.data.data ?? []);
      setRooms(Array.isArray(r.data) ? r.data : r.data.data ?? []);
    } catch { /* réessayé au prochain tick */ }
  }, []);
  usePolling(load, 10000);

  const [chart, setChart] = useState([]);
  const [occ, setOcc] = useState([]);
  useEffect(() => {
    fetchReceptionChart().then(({ data }) => setChart(Array.isArray(data) ? data : data.data ?? [])).catch(() => {});
    fetchReceptionOccupancy().then(({ data }) => setOcc(Array.isArray(data) ? data : data.data ?? [])).catch(() => {});
  }, []);

  const pending = bookings.filter((b) => b.statut === "en_attente");
  const occupied = rooms.filter((r) => (r.statut_effectif ?? r.statut) === "occupee").length;
  const free = rooms.filter((r) => (r.statut_effectif ?? r.statut) === "libre").length;

  return (
    <>
      <PageHeader
        eyebrow="Réception"
        title="Tableau de bord"
        actions={<Link to="/reception/reservations" className="btn-primary">Traiter les demandes</Link>}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Demandes en attente" value={pending.length} icon={LuHourglass} accent />
        <StatCard label="Salles libres maintenant" value={free} icon={LuCircleCheck} />
        <StatCard label="Salles occupées" value={occupied} icon={LuBuilding2} />
      </div>

      <section className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Dernières demandes en attente</h2>
          <Link to="/reception/reservations" className="text-sm font-medium text-accent hover:text-accent-dark">Tout voir</Link>
        </div>
        {pending.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink/45">Aucune demande à traiter. 👍</p>
        ) : (
          <ul className="divide-y divide-ink/5">
            {pending.slice(0, 6).map((b) => (
              <li key={b.id_reservation} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium">
                    {b.client ? `${b.client.prenom} ${b.client.nom}` : `Client #${b.id_client}`} — {b.salle?.nom_salle ?? `salle #${b.id_salle}`}
                  </p>
                  <p className="text-xs text-ink/50">{formatDateTime(b.date_debut)} → {formatDateTime(b.date_fin)}</p>
                </div>
                <StatutBadge statut={b.statut} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ChartCard title="Demandes des 7 derniers jours">
          <StackedBars
            data={chart}
            xKey="jour"
            series={[
              { key: "en_attente", name: "En attente" },
              { key: "effectuees", name: "Effectuées" },
              { key: "annulees", name: "Annulées" },
            ]}
          />
        </ChartCard>
        <ChartCard title="Occupation actuelle des salles">
          <DonutChart data={occ} />
        </ChartCard>
      </div>
    </>
  );
}
