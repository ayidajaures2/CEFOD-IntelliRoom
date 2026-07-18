import { useCallback, useEffect, useState } from "react";
import { fetchUsers, createUser, updateUser, deleteUser } from "../../api/userApi";
import { useNotify } from "../../contexts/NotificationContext";
import PageHeader from "../../components/common/PageHeader";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import Modal from "../../components/common/Modal";
import { CATEGORIES_CLIENT, CATEGORIE_CLIENT_LABELS, ROLES, ROLE_LABELS } from "../../utils/constants";
import { apiErrorMessage } from "../../utils/apiError";

const EMPTY = {
  nom: "", prenom: "", email: "", telephone: "",
  role: ROLES.RECEPTIONNISTE, categorie_client: "", password: "", password_confirmation: "",
};

/**
 * Gestion des comptes (AdminController). C'est ICI — et uniquement ici —
 * que la `categorie_client` d'un client peut être corrigée, et que les
 * comptes réceptionniste/caissier/admin sont créés (CLAUDE.md §3 & §5).
 */
export default function ManageUsers() {
  const { success, error: toastError } = useNotify();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("");
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await fetchUsers();
      setUsers(Array.isArray(data) ? data : data.data ?? []);
    } catch {
      toastError("Impossible de charger les utilisateurs.");
    } finally {
      setLoading(false);
    }
  }, [toastError]);
  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(EMPTY); setCreating(true); };
  const openEdit = (u) => {
    setForm({
      nom: u.nom, prenom: u.prenom, email: u.email, telephone: u.telephone ?? "",
      role: u.role, categorie_client: u.categorie_client ?? "",
      password: "", password_confirmation: "",
    });
    setEditing(u);
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true);
    const payload = { ...form };
    if (payload.role !== ROLES.CLIENT) payload.categorie_client = null;
    if (editing && !payload.password) {
      delete payload.password;
      delete payload.password_confirmation;
    }
    try {
      if (editing) {
        await updateUser(editing.id_utilisateur, payload);
        success("Utilisateur mis à jour.");
      } else {
        await createUser(payload);
        success("Compte créé.");
      }
      setEditing(null);
      setCreating(false);
      load();
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
      load();
    } catch (e) {
      toastError(apiErrorMessage(e, "Suppression impossible : des réservations sont liées à ce compte."));
    }
  };

  const filtered = roleFilter ? users.filter((u) => u.role === roleFilter) : users;
  const isClientRole = form.role === ROLES.CLIENT;

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Utilisateurs"
        subtitle="Créez les comptes du personnel et corrigez la catégorie tarifaire des clients."
        actions={<button className="btn-primary" onClick={openCreate}>Créer un compte</button>}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {["", ...Object.values(ROLES)].map((r) => (
          <button key={r || "tous"} onClick={() => setRoleFilter(r)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${
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
              <tr><th>Nom</th><th>E-mail</th><th>Téléphone</th><th>Rôle</th><th>Catégorie tarifaire</th><th className="text-right">Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id_utilisateur}>
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
                  <td className="text-ink/60">{CATEGORIE_CLIENT_LABELS[u.categorie_client] ?? "—"}</td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <button className="btn-outline px-3 py-1.5 text-xs" onClick={() => openEdit(u)}>Modifier</button>
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
            <label className="field-label" htmlFor="u-email">E-mail</label>
            <input id="u-email" type="email" className="field" value={form.email} onChange={set("email")} />
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
                <label className="field-label" htmlFor="u-cat">Catégorie tarifaire</label>
                <select id="u-cat" className="field" value={form.categorie_client} onChange={set("categorie_client")}>
                  <option value="" disabled>Choisir…</option>
                  {CATEGORIES_CLIENT.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
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
            disabled={busy || !form.nom || !form.email || (isClientRole && !form.categorie_client) || (!editing && form.password.length < 8) || form.password !== form.password_confirmation}>
            {busy ? "Enregistrement…" : editing ? "Enregistrer" : "Créer le compte"}
          </button>
        </div>
      </Modal>
    </>
  );
}
