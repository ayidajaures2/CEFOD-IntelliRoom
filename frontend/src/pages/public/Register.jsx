import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useNotify } from "../../contexts/NotificationContext";
import { SOUS_CATEGORIES_CLIENT } from "../../utils/constants";
import { apiErrorMessage } from "../../utils/apiError";

/**
 * Inscription CLIENT uniquement : aucun champ `role` n'est envoyé
 * (forcé à `client` côté serveur).
 * `sous_categorie_client` est obligatoire (les 7 valeurs de la fiche
 * papier) — c'est ce que le client choisit réellement. Le palier tarifaire
 * `categorie_client` est dérivé automatiquement côté backend, jamais saisi.
 */
export default function Register() {
  const { register } = useAuth();
  const { success, error: toastError } = useNotify();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    nom: "", prenom: "", email: "", telephone: "",
    sous_categorie_client: "", password: "", password_confirmation: "",
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const canSubmit =
    form.nom && form.prenom && form.email && form.sous_categorie_client &&
    form.password.length >= 8 && form.password === form.password_confirmation;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await register(form);
      success("Compte créé. Bienvenue !");
      navigate("/client", { replace: true });
    } catch (e) {
      toastError(apiErrorMessage(e, "Inscription impossible. Vérifiez les champs."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-lg flex-col px-4 py-12">
      <h1 className="font-display text-3xl font-black">Créer un compte client</h1>
      <p className="mt-1 text-sm text-ink/55">
        Votre catégorie détermine les tarifs qui vous sont appliqués. Elle pourra être vérifiée par nos équipes.
      </p>

      <div className="card mt-6 space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="nom">Nom</label>
            <input id="nom" className="field" value={form.nom} onChange={set("nom")} autoComplete="family-name" />
          </div>
          <div>
            <label className="field-label" htmlFor="prenom">Prénom</label>
            <input id="prenom" className="field" value={form.prenom} onChange={set("prenom")} autoComplete="given-name" />
          </div>
        </div>
        <div>
          <label className="field-label" htmlFor="email">
            Adresse e-mail <span className="font-normal text-ink/40">(définitive, non modifiable ensuite)</span>
          </label>
          <input id="email" type="email" className="field" value={form.email} onChange={set("email")} autoComplete="email" />
        </div>
        <div>
          <label className="field-label" htmlFor="telephone">Téléphone</label>
          <input id="telephone" type="tel" className="field" value={form.telephone} onChange={set("telephone")} placeholder="+235 …" autoComplete="tel" />
        </div>
        <div>
          <label className="field-label" htmlFor="categorie">Catégorie de votre organisation</label>
          <select id="categorie" className="field" value={form.sous_categorie_client} onChange={set("sous_categorie_client")}>
            <option value="" disabled>Choisir une catégorie…</option>
            {SOUS_CATEGORIES_CLIENT.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="password">Mot de passe</label>
            <input id="password" type="password" className="field" value={form.password} onChange={set("password")} autoComplete="new-password" />
            <p className="mt-1 text-xs text-ink/45">8 caractères minimum.</p>
          </div>
          <div>
            <label className="field-label" htmlFor="password2">Confirmation</label>
            <input id="password2" type="password" className="field" value={form.password_confirmation} onChange={set("password_confirmation")} autoComplete="new-password" />
            {form.password_confirmation && form.password !== form.password_confirmation && (
              <p className="mt-1 text-xs font-medium text-accent-dark">Les mots de passe ne correspondent pas.</p>
            )}
          </div>
        </div>
        <button className="btn-primary w-full" onClick={handleSubmit} disabled={!canSubmit || submitting}>
          {submitting ? "Création…" : "Créer mon compte"}
        </button>
      </div>

      <p className="mt-4 text-center text-sm text-ink/60">
        Déjà inscrit ? <Link to="/login" className="font-semibold text-accent hover:text-accent-dark">Se connecter</Link>
      </p>
    </div>
  );
}