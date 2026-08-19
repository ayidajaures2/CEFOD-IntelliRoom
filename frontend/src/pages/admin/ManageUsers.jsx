import { useCallback, useEffect, useState } from "react";
import { fetchUsers, createUser, updateUser, deleteUser, suspendUser, reactivateUser } from "../../api/userApi";
import { useNotify } from "../../contexts/NotificationContext";
import PageHeader from "../../components/common/PageHeader";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import Modal from "../../components/common/Modal";
import {
  SOUS_CATEGORIES_CLIENT,
  SOUS_CATEGORIE_CLIENT_LABELS,
  CATEGORIE_CLIENT_LABELS,
  ROLES,
  ROLE_LABELS,
} from "../../utils/constants";
import { apiErrorMessage } from "../../utils/apiError";
import { LuRefreshCw, LuBan, LuRotateCcw } from "react-icons/lu";

const EMPTY = {
  nom: "", prenom: "", email: "", telephone: "",
  role: ROLES.RECEPTIONNISTE, sous_categorie_client: "", password: "", password_confirmation: "",
};

/**
 * Gestion des comptes (AdminController). C'est ICI — et uniquement ici —
 * que la sous_categorie_client d'un client peut être corrigée, que les
 * comptes du personnel sont créés, et qu'un compte peut être suspendu.
 * L'e-mail est immuable après création, pour tous les rôles.
 *
 * Bouton manuel plutôt que polling : page de gestion, change rarement,
 * pas d'enjeu de fraîcheur seconde-par-seconde.
 *
 * Suspension : bloque la connexion (AuthController::login()) ET révoque
 * immédiatement les tokens Sanctum existants (déconnexion multi-appareils
 * instantanée). Un admin ne peut suspendre ni son propre compte ni un
 * autre compte admin (garde-fou backend, reflété ici côté UI).
 */
export default function ManageUsers() {
  const { success, error: toastError } = useNotify();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [roleFilter, setRoleFilter] = useState("");
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [suspendingId, setSuspendingId] = useState(null);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const { data } = await fetchUsers();
      setUsers(Array.isArray(data) ? data : data.data ?? []);
    } catch {
      toastError("Impossible de charger les utilisateurs.");
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  }, [toastError]);
  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(EMPTY); setCreating(true); };
  const openEdit = (u) => {
    setForm({
      nom: u.nom, prenom: u.prenom, email: u.email, telephone: u.telephone ?? "",
      role: u.role, sous_categorie_client: u.sous_categorie_client ?? "",
      password: "", password_confirmation: "",
    });
    setEditing(u);
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true);
    const { email, ...rest } = form;
    const payload = { ...rest };
    if (payload.role !== ROLES.CLIENT) payload.sous_categorie_client = null;
    if (editing && !payload.password) {
      delete payload.password;
      delete payload.password_confirmation;
    }
    try {
      if (editing) {
        await updateUser(editing.id_utilisateur, payload);
        success("Utilisateur mis à jour.");
      } else {
        await createUser(form);
        success("Compte créé.");
      }
      setEditing(null);
      setCreating(false);
      load({ silent: true });
    } catch (e) {
      toastError(apiErrorMessage(e, "Enregistrement impossible."));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (u) => {
    if (!window.confirm(`Supprimer le compte de ${u.prenom} ${u.nom} ?`)) return;
    try {
      await deleteUser(u.id_utilisateur);
      success("Compte supprimé.");
      load({ silent: true });
    } catch (e) {
      toastError(apiErrorMessage(e, "Suppression impossible : des réservations ou paiements sont liés à ce compte."));
    }
  };

  const toggleSuspension = async (u) => {
    const suspending = !u.est_suspendu;
    if (suspending && !window.confirm(`Suspendre le compte de ${u.prenom} ${u.nom} ? Il sera déconnecté immédiatement et ne pourra plus se reconnecter tant que le compte est suspendu.`)) {
      return;
    }
    setSuspendingId(u.id_utilisateur);
    try {
      if (suspending) {
        await suspendUser(u.id_utilisateur);
        success(`Compte de ${u.prenom} ${u.nom} suspendu.`);
      } else {
        await reactivateUser(u.id_utilisateur);
        success(`Compte de ${u.prenom} ${u.nom} réactivé.`);
      }
      load({ silent: true });
    } catch (e) {
      toastError(apiErrorMessage(e, "Action impossible."));
    } finally {
      setSuspendingId(null);
    }
  };

  const filtered = roleFilter ? users.filter((u) => u.role === roleFilter) : users;
  const isClientRole = form.role === ROLES.CLIENT;

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Utilisateurs"
        subtitle="Créez les comptes du personnel, corrigez la sous-catégorie déclarée des clients, suspendez un compte si besoin. L'e-mail est immuable après création."
        actions={
          <>
            <button
              className="btn-outline flex items-center gap-1.5"
              onClick={() => load({ silent: true })}
              disabled={refreshing}
            >
              <LuRefreshCw className={refreshing ? "animate-spin" : ""} size={16} />
              Actualiser
            </button>
            <button className="btn-primary" onClick={openCreate}>Créer un compte</button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {["", ...Object.values(ROLES)].map((r) => (
          <button key={r || "tous"} onClick={() => setRoleFilter(r)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              roleFilter === r ? "bg-ink text-paper" : "border border-ink/15 hover:border-accent hover:text-accent"
            }`}>
            {r ? ROLE_LABELS[r] : "Tous"}
          </button>
        ))}
      </div>

      {loading && <Loader />}
      {!loading && filtered.length === 0 && <EmptyState title="Aucun utilisateur pour ce filtre" />}

      {!loading && filtered.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr><th>Nom</th><th>E-mail</th><th>Téléphone</th><th>Rôle</th><th>Catégorie</th><th>Statut</th><th className="text-right">Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.id_utilisateur} className={`stagger-in ${u.est_suspendu ? "opacity-60" : ""}`} style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}>
                  <td className="font-medium">{u.prenom} {u.nom}</td>
                  <td className="text-ink/60">{u.email}</td>
                  <td className="text-ink/60">{u.telephone ?? "—"}</td>
                  <td>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      u.role === ROLES.ADMIN ? "bg-ink text-paper"
                      : u.role === ROLES.CLIENT ? "border border-ink/15"
                      : "bg-accent-soft text-accent-dark"
                    }`}>
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="text-ink/60">
                    {SOUS_CATEGORIE_CLIENT_LABELS[u.sous_categorie_client]
                      ?? CATEGORIE_CLIENT_LABELS[u.categorie_client]
                      ?? "—"}
                  </td>
                  <td>
                    {u.est_suspendu ? (
                      <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">Suspendu</span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Actif</span>
                    )}
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <button className="btn-outline px-3 py-1.5 text-xs" onClick={() => openEdit(u)}>Modifier</button>
                      {u.role !== ROLES.ADMIN && (
                        <button
                          className={`btn-outline flex items-center gap-1 px-3 py-1.5 text-xs ${u.est_suspendu ? "" : "text-red-600"}`}
                          onClick={() => toggleSuspension(u)}
                          disabled={suspendingId === u.id_utilisateur}
                          title={u.est_suspendu ? "Réactiver ce compte" : "Suspendre ce compte"}
                        >
                          {u.est_suspendu ? <LuRotateCcw size={13} /> : <LuBan size={13} />}
                          {u.est_suspendu ? "Réactiver" : "Suspendre"}
                        </button>
                      )}
                      <button className="btn-ghost px-3 py-1.5 text-xs text-accent-dark" onClick={() => remove(u)}>Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={creating || Boolean(editing)}
        title={editing ? `Modifier ${editing.prenom} ${editing.nom}` : "Créer un compte"}
        onClose={() => { setCreating(false); setEditing(null); }}
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="u-nom">Nom</label>
              <input id="u-nom" className="field" value={form.nom} onChange={set("nom")} />
            </div>
            <div>
              <label className="field-label" htmlFor="u-prenom">Prénom</label>
              <input id="u-prenom" className="field" value={form.prenom} onChange={set("prenom")} />
            </div>
          </div>
          <div>
            <label className="field-label" htmlFor="u-email">
              E-mail {editing && <span className="font-normal text-ink/40">(immuable, non modifiable)</span>}
            </label>
            <input
              id="u-email"
              type="email"
              className="field disabled:bg-ink/5 disabled:text-ink/40"
              value={form.email}
              onChange={set("email")}
              disabled={Boolean(editing)}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="u-tel">Téléphone</label>
            <input id="u-tel" className="field" value={form.telephone} onChange={set("telephone")} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="u-role">Rôle</label>
              <select id="u-role" className="field" value={form.role} onChange={set("role")}>
                {Object.values(ROLES).map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>
            {isClientRole && (
              <div>
                <label className="field-label" htmlFor="u-cat">Sous-catégorie (fiche papier)</label>
                <select id="u-cat" className="field" value={form.sous_categorie_client} onChange={set("sous_categorie_client")}>
                  <option value="" disabled>Choisir…</option>
                  {SOUS_CATEGORIES_CLIENT.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="u-pwd">{editing ? "Nouveau mot de passe (optionnel)" : "Mot de passe"}</label>
              <input id="u-pwd" type="password" className="field" value={form.password} onChange={set("password")} autoComplete="new-password" />
            </div>
            <div>
              <label className="field-label" htmlFor="u-pwd2">Confirmation</label>
              <input id="u-pwd2" type="password" className="field" value={form.password_confirmation} onChange={set("password_confirmation")} autoComplete="new-password" />
            </div>
          </div>
          <button className="btn-primary w-full" onClick={submit}
            disabled={busy || !form.nom || (!editing && !form.email) || (isClientRole && !form.sous_categorie_client) || (!editing && form.password.length < 8) || form.password !== form.password_confirmation}>
            {busy ? "Enregistrement…" : editing ? "Enregistrer" : "Créer le compte"}
          </button>
        </div>
      </Modal>
    </>
  );
}