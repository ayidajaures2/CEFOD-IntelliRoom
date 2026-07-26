import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMyBookings } from "../../api/bookingApi";
import { useAuth } from "../../hooks/useAuth";
import { usePolling } from "../../hooks/usePolling";
import PageHeader from "../../components/common/PageHeader";
import Loader from "../../components/common/Loader";
import StatutBadge from "../../components/common/StatutBadge";
import { formatDateTime } from "../../utils/formatDate";
import { CATEGORIE_CLIENT_LABELS, STATUT_RESERVATION_LABELS } from "../../utils/constants";
import { useMemo } from "react";
import { DonutChart, ChartCard } from "../../components/common/Charts";
import { LuCalendarDays, LuHourglass, LuWallet, LuWalletCards, LuWalletMinimal } from "react-icons/lu";

export default function ClientDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await fetchMyBookings();
      setBookings(Array.isArray(data) ? data : data.data ?? []);
    } catch { /* le tableau de bord reste consultable */ }
    finally { setLoading(false); }
  }, []);
  usePolling(load, 15000);

  const upcoming = bookings
    .filter((b) => ["validee", "confirmee", "en_attente"].includes(b.statut))
    .slice(0, 5);
  const toPay = bookings.filter((b) => b.statut === "validee").length;
  const pending = bookings.filter((b) => b.statut === "en_attente").length;

  const byStatus = useMemo(() => {
    const c = {};
    bookings.forEach((b) => { const k = b.statut_effectif ?? b.statut; c[k] = (c[k] ?? 0) + 1; });
    return Object.entries(c).map(([k, v]) => ({ name: STATUT_RESERVATION_LABELS[k] ?? k, value: v }));
  }, [bookings]);

  return (
    <>
      <PageHeader
        eyebrow="Espace client"
        title={`Bonjour, ${user?.prenom ?? ""}`}
        subtitle={user?.categorie_client ? `Catégorie tarifaire : ${CATEGORIE_CLIENT_LABELS[user.categorie_client]}` : undefined}
        actions={<Link to="/client/reserver" className="btn-primary">Réserver une salle</Link>}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Réservations", value: bookings.length, to: "/client/reservations", icon: LuCalendarDays },
          { label: "En attente de validation", value: pending, to: "/client/reservations", icon: LuHourglass },
          { label: "À payer", value: toPay, to: "/client/reservations", icon: LuWallet }
        ].map((c) => {
          const Icon = c.icon;
          return (
          <Link key={c.label} to={c.to} className="card card-hover flex items-center gap-4 p-5">
            <span className={`stat-icon ${c.accent ? "bg-accent text-white" : ""}`}><Icon className="h-6 w-6" strokeWidth={2} /></span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">{c.label}</p>
              <p className="mt-0.5 font-display text-2xl font-black leading-tight">{loading ? "…" : c.value}</p>
            </div>
          </Link>
          );
        })}
      </div>

      {bookings.length > 0 && (
        <div className="mb-6">
          <ChartCard title="Répartition de mes réservations">
            <DonutChart data={byStatus} height={240} />
          </ChartCard>
        </div>
      )}

      <section className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Réservations à venir</h2>
          <Link to="/client/reservations" className="text-sm font-medium text-accent hover:text-accent-dark">Tout voir</Link>
        </div>
        {loading ? <Loader /> : upcoming.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink/45">Aucune réservation en cours.</p>
        ) : (
          <ul className="divide-y divide-ink/5">
            {upcoming.map((b) => (
              <li key={b.id_reservation} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium">{b.salle?.nom_salle ?? `Salle #${b.id_salle}`}</p>
                  <p className="text-xs text-ink/50">{formatDateTime(b.date_debut)} → {formatDateTime(b.date_fin)}</p>
                </div>
                <StatutBadge statut={b.statut_effectif ?? b.statut} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
