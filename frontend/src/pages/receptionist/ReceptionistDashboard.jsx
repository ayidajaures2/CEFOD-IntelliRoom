import { useCallback, useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { fetchAllBookings } from "../../api/bookingApi";
import { fetchOccupation } from "../../api/roomApi";
import { usePolling } from "../../hooks/usePolling";
import PageHeader from "../../components/common/PageHeader";
import StatutBadge from "../../components/common/StatutBadge";
import { formatDateTime } from "../../utils/formatDate";
import { fetchReceptionChart, fetchReceptionOccupancy, fetchReceptionMessagingStats } from "../../api/chartApi";
import { StackedBars, DonutChart, BarsChart, ChartCard } from "../../components/common/Charts";
import StatCard from "../../components/common/StatCard";
import { LuMessageSquare, LuCircleCheck, LuBuilding2, LuUsers } from "react-icons/lu";

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
  usePolling(load, 20000);

  const [chart, setChart] = useState([]);
  const [occ, setOcc] = useState([]);
  useEffect(() => {
    fetchReceptionChart().then(({ data }) => setChart(Array.isArray(data) ? data : data.data ?? [])).catch(() => {});
    fetchReceptionOccupancy().then(({ data }) => setOcc(Array.isArray(data) ? data : data.data ?? [])).catch(() => {});
  }, []);

  const [messagingStats, setMessagingStats] = useState({ pendingConversations: 0, totalClients: 0 });
  const loadMessagingStats = useCallback(async () => {
    try {
      const { data } = await fetchReceptionMessagingStats();
      setMessagingStats(data);
    } catch { /* réessayé au prochain tick */ }
  }, []);
  usePolling(loadMessagingStats, 20000);

  const pending = bookings.filter((b) => b.statut === "en_attente");
  const occupied = rooms.filter((r) => (r.statut_effectif ?? r.statut) === "occupee").length;
  const free = rooms.filter((r) => (r.statut_effectif ?? r.statut) === "libre").length;

  const bookingsBySalle = useMemo(() => {
    const counts = new Map();
    bookings.forEach((b) => {
      const nom = b.salle?.nom_salle ?? `Salle #${b.id_salle}`;
      counts.set(nom, (counts.get(nom) ?? 0) + 1);
    });
    return Array.from(counts, ([salle, reservations]) => ({ salle, reservations }))
      .sort((a, b) => b.reservations - a.reservations)
      .slice(0, 8);
  }, [bookings]);

  return (
    <>
      <PageHeader
        eyebrow="Réception"
        title="Tableau de bord"
        actions={<Link to="/reception/reservations" className="btn-primary">Consulter les réservations</Link>}
      />

      <div className="mb-2 grid gap-4 sm:grid-cols-3">
        <StatCard label="Conversations en attente de réponse" value={messagingStats.pendingConversations} icon={LuMessageSquare} />
        <StatCard label="Salles libres maintenant" value={free} icon={LuCircleCheck} />
        <StatCard label="Salles occupées" value={occupied} icon={LuBuilding2} />
      </div>

      <p className="mb-6 flex items-center gap-1.5 text-sm text-ink/50">
        <LuUsers size={14} />
        {messagingStats.totalClients} client{messagingStats.totalClients > 1 ? "s" : ""} inscrit{messagingStats.totalClients > 1 ? "s" : ""}
      </p>

      <section className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Dernières demandes reçues</h2>
          <Link to="/reception/reservations" className="text-sm font-medium text-accent hover:text-accent-dark">Tout voir</Link>
        </div>
        {pending.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink/45">Aucune demande en attente.</p>
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
        <div className="xl:col-span-2">
          <ChartCard title="Réservations par salle">
            <BarsChart
              data={bookingsBySalle}
              dataKey="reservations"
              xKey="salle"
              name="Réservations"
              maxBarSize={48}
              barCategoryGap="35%"
            />
          </ChartCard>
        </div>
      </div>
    </>
  );
}