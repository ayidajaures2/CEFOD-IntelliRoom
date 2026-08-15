import { useCallback, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchAllBookings } from "../../api/bookingApi";
import { usePolling } from "../../hooks/usePolling";
import { extractList } from "../../utils/extract";
import PageHeader from "../../components/common/PageHeader";
import StatutBadge from "../../components/common/StatutBadge";
import { formatDateTime } from "../../utils/formatDate";
import { fetchSgChart } from "../../api/chartApi";
import { StackedBars, ChartCard } from "../../components/common/Charts";
import StatCard from "../../components/common/StatCard";
import { LuHourglass, LuCircleCheck, LuCalendarCheck } from "react-icons/lu";

export default function SgDashboard() {
  const [bookings, setBookings] = useState([]);

  const load = useCallback(async () => {
    try {
      const { data } = await fetchAllBookings();
      setBookings(extractList(data));
    } catch { /* réessayé au prochain tick */ }
  }, []);
  usePolling(load, 20000);

  const [chart, setChart] = useState([]);
  useEffect(() => {
    fetchSgChart().then(({ data }) => setChart(Array.isArray(data) ? data : data.data ?? [])).catch(() => {});
  }, []);

  const pending = bookings.filter((b) => b.statut === "en_attente");
  const validated = bookings.filter((b) => b.statut === "validee");
  const confirmed = bookings.filter((b) => b.statut === "confirmee");

  // Les plus anciennes en premier — éviter qu'une demande traîne derrière des plus récentes.
  const oldestPending = [...pending].sort(
    (a, b) => new Date(a.date_creation) - new Date(b.date_creation)
  );

  return (
    <>
      <PageHeader
        eyebrow="Secrétariat Général"
        title="Tableau de bord"
        actions={<Link to="/sg/reservations" className="btn-primary">Traiter les demandes</Link>}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Demandes en attente" value={pending.length} icon={LuHourglass} accent />
        <StatCard label="Validées, en attente de paiement" value={validated.length} icon={LuCircleCheck} />
        <StatCard label="Confirmées (payées)" value={confirmed.length} icon={LuCalendarCheck} />
      </div>

      <section className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Demandes à traiter en priorité</h2>
          <Link to="/sg/reservations" className="text-sm font-medium text-accent hover:text-accent-dark">Tout voir</Link>
        </div>
        {oldestPending.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink/45">Aucune demande à traiter.</p>
        ) : (
          <ul className="divide-y divide-ink/5">
            {oldestPending.slice(0, 6).map((b) => (
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

      <div className="mt-6">
        <ChartCard title="Demandes des 7 derniers jours">
          <StackedBars
            data={chart}
            xKey="jour"
            series={[
              { key: "recues", name: "Reçues" },
              { key: "validees", name: "Validées" },
              { key: "annulees", name: "Annulées" },
            ]}
          />
        </ChartCard>
      </div>
    </>
  );
}