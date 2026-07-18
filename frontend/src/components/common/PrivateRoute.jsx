import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { homePathForRole } from "../../utils/roleHelpers";
import Loader from "./Loader";

/**
 * Garde de route : exige une session, et un rôle autorisé si `roles` est fourni.
 * Un utilisateur connecté au mauvais endroit est renvoyé vers SON tableau de bord.
 */
export default function PrivateRoute({ roles }) {
  const { isAuthenticated, role, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <Loader full label="Vérification de la session…" />;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (roles && !roles.includes(role)) {
    return <Navigate to={homePathForRole(role)} replace />;
  }
  return <Outlet />;
}
