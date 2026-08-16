import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { LuSun, LuMoon, LuMenu, LuX, LuBadgePlus, LuSigma, LuSmile, LuSmilePlus, LuSquareMenu, LuCircleMinus, LuYoutube, LuEyeClosed, LuDoorClosed, LuBadgeX, LuBadgeMinus, LuBookUser, LuFileMinus } from "react-icons/lu";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../hooks/useAuth";
import { homePathForRole } from "../../utils/roleHelpers";
import Logo from "./Logo";
import { VscLayoutMenubar } from "react-icons/vsc";

const LINKS = [
  { to: "/", label: "Accueil", end: true },
  { to: "/salles", label: "Salles" },
  { to: "/services", label: "Services" },
  { to: "/affichage", label: "Disponibilités" },
  { to: "/chatbot", label: "Assistant" },
  { to: "/a-propos", label: "À propos" },
];

export default function Navbar() {
  const { isAuthenticated, user, role, logout } = useAuth();
  const { isDark, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const linkClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive ? "text-accent" : "text-paper/75 hover:text-paper"
    }`;

  return (
    <header className="sticky top-0 z-40 bg-ink text-paper">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Logo variant="full" to="/" />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Navigation principale">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>{l.label}</NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <button
            onClick={toggleTheme}
            aria-label={isDark ? "Mode clair" : "Mode sombre"}
            title={isDark ? "Mode clair" : "Mode sombre"}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-paper/70 transition-colors hover:bg-paper/10 hover:text-paper"
          >
            {isDark ? <LuSun className="h-5 w-5" /> : <LuMoon className="h-5 w-5" />}
          </button>
          {isAuthenticated ? (
            <>
              <Link to={homePathForRole(role)} className="btn-primary py-2">Mon espace</Link>
              <button onClick={handleLogout} className="btn px-3 py-2 text-paper/70 hover:text-paper">
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn px-3 py-2 text-paper/85 hover:text-paper">Connexion</Link>
              <Link to="/register" className="btn-primary py-2">Créer un compte</Link>
            </>
          )}
        </div>

        <button
          className="btn px-2 py-2 text-paper md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="Ouvrir le menu"
        >
          {open ? <LuX className="h-5 w-5" /> : <LuMenu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-paper/10 px-4 pb-4 pt-2 md:hidden" aria-label="Navigation mobile">
          <div className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={linkClass} onClick={() => setOpen(false)}>
                {l.label}
              </NavLink>
            ))}
            {isAuthenticated ? (
              <>
                <Link to={homePathForRole(role)} onClick={() => setOpen(false)} className="btn-primary mt-2">Mon espace ({user?.prenom})</Link>
                <button onClick={handleLogout} className="btn text-paper/70">Déconnexion</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="btn text-paper/85">Connexion</Link>
                <Link to="/register" onClick={() => setOpen(false)} className="btn-primary">Créer un compte</Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}