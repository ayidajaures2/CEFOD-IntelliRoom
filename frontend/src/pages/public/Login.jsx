import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useNotify } from "../../contexts/NotificationContext";
import { homePathForRole } from "../../utils/roleHelpers";
import { apiErrorMessage } from "../../utils/apiError";

export default function Login() {
  const { login } = useAuth();
  const { success, error: toastError } = useNotify();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const me = await login(form);
      success(`Bienvenue, ${me.prenom ?? ""} !`);
      navigate(location.state?.from ?? homePathForRole(me.role), { replace: true });
    } catch (e) {
      toastError(apiErrorMessage(e, "Identifiants incorrects."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <h1 className="font-display text-3xl font-black">Connexion</h1>
      <p className="mt-1 text-sm text-ink/55">Accédez à votre espace de réservation.</p>

      <div className="card mt-6 space-y-4 p-6">
        <div>
          <label className="field-label" htmlFor="email">Adresse e-mail</label>
          <input id="email" type="email" className="field" value={form.email} onChange={set("email")} autoComplete="email" />
        </div>
        <div>
          <label className="field-label" htmlFor="password">Mot de passe</label>
          <input
            id="password" type="password" className="field" value={form.password} onChange={set("password")}
            autoComplete="current-password"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>
        <button className="btn-primary w-full" onClick={handleSubmit} disabled={submitting || !form.email || !form.password}>
          {submitting ? "Connexion…" : "Se connecter"}
        </button>
      </div>

      <p className="mt-4 text-center text-sm text-ink/60">
        Pas encore de compte ? <Link to="/register" className="font-semibold text-accent hover:text-accent-dark">Créer un compte</Link>
      </p>
    </div>
  );
}
