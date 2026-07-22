import { useCallback, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { usePolling } from "../hooks/usePolling";
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from "../api/notificationApi";
import { ROLES, ROLE_LABELS } from "../utils/constants";
import { formatDateTime } from "../utils/formatDate";
import Avatar from "../components/common/Avatar";
import Logo from "../components/common/Logo";
import { LuMenu, LuBell, LuLogOut } from "react-icons/lu";
import ThemeToggle from "../components/common/ThemeToggle";

const NAV_BY_ROLE = {
  [ROLES.CLIENT]: [
    { to: "/client", label: "Tableau de bord", end: true },
    { to: "/client/reserver", label: "Réserver une salle" },
    { to: "/client/reservations", label: "Mes réservations" },
    { to: "/client/factures", label: "Mes factures" },
    { to: "/client/messages", label: "Messagerie" },
    { to: "/client/profil", label: "Mon profil" },
  ],
  [ROLES.RECEPTIONNISTE]: [
    { to: "/reception", label: "Tableau de bord", end: true },
    { to: "/reception/reservations", label: "Réservations" },
    { to: "/reception/conversations", label: "Messagerie clients" },
    { to: "/reception/factures", label: "Factures" },
    { to: "/reception/profil", label: "Mon profil" },
  ],
  [ROLES.CAISSIER]: [
    { to: "/caisse", label: "Tableau de bord", end: true },
    { to: "/caisse/paiements", label: "Paiements" },
    { to: "/caisse/profil", label: "Mon profil" },
  ],
  [ROLES.ADMIN]: [
    { to: "/admin", label: "Tableau de bord", end: true },
    { to: "/admin/salles", label: "Salles & tarifs" },
    { to: "/admin/utilisateurs", label: "Utilisateurs" },
    { to: "/admin/rapports", label: "Rapports" },
    { to: "/admin/parametres", label: "Paramètres" },
    { to: "/admin/profil", label: "Mon profil" },
  ],
};

export default function DashboardLayout() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = useCallback(async () => {
    try {
      const { data } = await fetchNotifications();
      setNotifications(Array.isArray(data) ? data : data.data ?? []);
    } catch {
      /* notifications non bloquantes */
    }
  }, []);
  usePolling(loadNotifications, 15000);

  const isRead = (n) => n.est_lu === true || n.est_lu === 1 || n.est_lu === "1" || n.est_lu === "true";
  const unread = notifications.filter((n) => !isRead(n)).length;

  const handleRead = async (n) => {
    if (!isRead(n)) {
      try { await markNotificationRead(n.id_notification); } catch { /* silencieux */ }
      loadNotifications();
    }
  };

  const handleReadAll = async () => {
    const unreadIds = notifications.filter((n) => !isRead(n)).map((n) => n.id_notification);
    try { await markAllNotificationsRead(unreadIds); } catch { /* silencieux */ }
    loadNotifications();
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const links = NAV_BY_ROLE[role] ?? [];
  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
      isActive ? "bg-accent text-paper" : "text-paper/65 hover:bg-paper/10 hover:text-paper"
    }`;

  return (
    <div className="flex min-h-screen bg-ink/[0.03]">
      {/* Barre latérale */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-ink p-4 text-paper transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Menu de l'espace"
      >
        <div className="mb-6 px-1">
          <Logo variant="full" to="/" />
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass} onClick={() => setSidebarOpen(false)}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-4 border-t border-paper/10 pt-4">
          <div className="flex items-center gap-3 px-1">
            <Avatar user={user} size={40} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user?.prenom} {user?.nom}</p>
              <p className="text-xs text-accent">{ROLE_LABELS[role]}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn mt-3 flex w-full items-center gap-2 px-3 py-2 text-paper/65 hover:bg-paper/10 hover:text-paper">
            <LuLogOut className="h-4 w-4" /> Se déconnecter
          </button>
        </div>
      </aside>
      {sidebarOpen && (
        <button className="fixed inset-0 z-30 bg-ink/50 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Fermer le menu" />
      )}

      {/* Contenu */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-ink/10 bg-surface px-4 lg:px-8">
          <button className="btn-ghost px-2 lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Ouvrir le menu"><LuMenu className="h-5 w-5" /></button>
          <Link to="/salles" className="hidden text-sm text-ink/55 hover:text-accent sm:block">← Retour au site public</Link>

          <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="relative">
            <button
              className="btn-ghost relative px-3"
              onClick={() => setNotifOpen((o) => !o)}
              aria-expanded={notifOpen}
              aria-label={`Notifications (${unread} non lues)`}
            >
              <LuBell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-paper">
                  {unread}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-ink/10 bg-surface shadow-xl">
                <div className="flex items-center justify-between border-b border-ink/5 px-4 py-2.5">
                  <p className="text-sm font-semibold">Notifications</p>
                  {unread > 0 && (
                    <button onClick={handleReadAll} className="text-xs font-medium text-accent hover:text-accent-dark">Tout marquer lu</button>
                  )}
                </div>
                <ul className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 && (
                    <li className="px-4 py-6 text-center text-sm text-ink/45">Aucune notification.</li>
                  )}
                  {notifications.map((n) => (
                    <li key={n.id_notification}>
                      <button
                        onClick={() => handleRead(n)}
                        className={`block w-full px-4 py-3 text-left text-sm hover:bg-accent-soft/60 ${isRead(n) ? "text-ink/50" : ""}`}
                      >
                        <span className="flex items-start gap-2">
                          {!isRead(n) && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden="true" />}
                          <span>
                            <span className="block font-medium">{n.titre}</span>
                            <span className="block text-xs text-ink/50">{n.contenu}</span>
                            <span className="block pt-0.5 text-[11px] text-ink/35">{formatDateTime(n.date_creation)}</span>
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}