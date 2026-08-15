import { useEffect, useState } from "react";
import {
  fetchAdminServices,
  createService,
  updateService,
  deleteService,
  updateServicePrices,
} from "../../api/serviceApi";
import { useNotify } from "../../contexts/NotificationContext";
import PageHeader from "../../components/common/PageHeader";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import Modal from "../../components/common/Modal";
import { formatMoney } from "../../utils/formatMoney";
import { CATEGORIES_CLIENT } from "../../utils/constants";
import { apiErrorMessage } from "../../utils/apiError";
import { LuPlus, LuTrash2 } from "react-icons/lu";

const UNITES = [
  { value: "jour", label: "Par jour" },
  { value: "heure", label: "Par heure" },
  { value: "personne", label: "Par personne" },
];

const EMPTY_FORM = { nom: "", description: "", unite: "jour" };
const EMPTY_TARIF = { categorie_client: "", prix: "" }; // "" = tarif unique (null)

/**
 * Gestion du catalogue de services annexes (vidéoprojecteur, sonorisation,
 * restauration, retransmission radio...) — ServiceController, réservé admin.
 * Miroir de ManageRooms.jsx : info générale + tarifs enregistrés ensemble
 * via un seul formulaire, la grille tarifaire passant par la route dédiée
 * PUT /admin/services/{id}/prices après la création/modification.
 *
 * La retransmission radio apparaît normalement ici (c'est le catalogue
 * complet) — elle n'est exclue que de la liste cochable du formulaire de
 * réservation côté client (voir BookingForm.jsx).
 */
export default function ManageServices() {
  const { success, error: toastError } = useNotify();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [tarifs, setTarifs] = useState([{ ...EMPTY_TARIF }]);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await fetchAdminServices();
      setServices(Array.isArray(data) ? data : data.data ?? []);
    } catch {
      toastError("Impossible de charger les services.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setTarifs([{ ...EMPTY_TARIF }]);
    setCreating(true);
  };

  const openEdit = (s) => {
    setForm({ nom: s.nom, description: s.description ?? "", unite: s.unite });
    setTarifs(
      s.tarifs?.length
        ? s.tarifs.map((t) => ({ categorie_client: t.categorie_client ?? "", prix: t.prix }))
        : [{ ...EMPTY_TARIF }]
    );
    setEditing(s);
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const setTarif = (i, k, v) => setTarifs((t) => t.map((row, idx) => (idx === i ? { ...row, [k]: v } : row)));
  const addTarifRow = () => setTarifs((t) => [...t, { ...EMPTY_TARIF }]);
  const removeTarifRow = (i) => setTarifs((t) => t.filter((_, idx) => idx !== i));

  const submit = async () => {
    setSubmitting(true);
    const validTarifs = tarifs
      .filter((t) => t.prix !== "")
      .map((t) => ({ categorie_client: t.categorie_client || null, prix: Number(t.prix) }));

    try {
      let id = editing?.id_service;
      if (editing) {
        await updateService(id, form);
      } else {
        const { data } = await createService({ ...form, tarifs: validTarifs });
        id = (data.data ?? data)?.id_service;
      }
      // En édition, la grille tarifaire passe par la route dédiée (comme les salles).
      if (editing && id && validTarifs.length) {
        try { await updateServicePrices(id, validTarifs); }
        catch { toastError("Service enregistré, mais la grille tarifaire n'a pas pu être sauvegardée."); }
      }
      success(editing ? "Service mis à jour." : "Service créé.");
      setEditing(null);
      setCreating(false);
      load();
    } catch (e) {
      toastError(apiErrorMessage(e, "Enregistrement impossible."));
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (s) => {
    if (!window.confirm(`Supprimer « ${s.nom} » ? Cette action est définitive.`)) return;
    try {
      await deleteService(s.id_service);
      success("Service supprimé.");
      load();
    } catch (e) {
      toastError(apiErrorMessage(e, "Suppression impossible : ce service est déjà utilisé dans une réservation."));
    }
  };

  const tarifSummary = (s) => {
    if (!s.tarifs?.length) return "Aucun tarif";
    const unique = s.tarifs.find((t) => t.categorie_client === null);
    if (unique) return `${formatMoney(unique.prix)} (tarif unique)`;
    return s.tarifs.map((t) => formatMoney(t.prix)).join(" · ");
  };

  const canSubmit = form.nom.trim() && tarifs.some((t) => t.prix !== "");

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Services annexes"
        subtitle="Vidéoprojecteur, sonorisation, restauration, retransmission radio… catalogue et tarifs."
        actions={<button className="btn-primary" onClick={openCreate}>Ajouter un service</button>}
      />

      {loading && <Loader />}
      {!loading && services.length === 0 && (
        <EmptyState title="Aucun service" hint="Créez le premier service du catalogue."
          action={<button className="btn-primary" onClick={openCreate}>Ajouter un service</button>} />
      )}

      {services.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr><th>Service</th><th>Unité</th><th>Tarif(s)</th><th className="text-right">Actions</th></tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id_service}>
                  <td className="font-medium">
                    {s.nom}
                    {s.description && <p className="mt-0.5 text-xs font-normal text-ink/45">{s.description}</p>}
                  </td>
                  <td className="text-ink/60">{UNITES.find((u) => u.value === s.unite)?.label ?? s.unite}</td>
                  <td className="text-ink/60">{tarifSummary(s)}</td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <button className="btn-outline px-3 py-1.5 text-xs" onClick={() => openEdit(s)}>Modifier</button>
                      <button className="btn-ghost px-3 py-1.5 text-xs text-accent-dark" onClick={() => remove(s)}>Supprimer</button>
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
        wide
        title={editing ? `Modifier « ${editing.nom} »` : "Nouveau service"}
        onClose={() => { setCreating(false); setEditing(null); }}
      >
        <div className="space-y-4">
          <div>
            <label className="field-label" htmlFor="s-nom">Nom</label>
            <input id="s-nom" className="field" value={form.nom} onChange={set("nom")} />
          </div>
          <div>
            <label className="field-label" htmlFor="s-desc">Description (optionnel)</label>
            <textarea id="s-desc" rows={2} className="field" value={form.description} onChange={set("description")} />
          </div>
          <div>
            <label className="field-label" htmlFor="s-unite">Unité de facturation</label>
            <select id="s-unite" className="field" value={form.unite} onChange={set("unite")}>
              {UNITES.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
            </select>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="field-label !mb-0">Tarifs</span>
              <button type="button" className="btn-outline flex items-center gap-1 px-2.5 py-1 text-xs" onClick={addTarifRow}>
                <LuPlus size={13} /> Ajouter une ligne
              </button>
            </div>
            <p className="mb-2 text-xs text-ink/45">
              Laissez « Toutes catégories » pour un tarif unique (ex. sonorisation, retransmission radio),
              ou définissez un prix par catégorie (ex. vidéoprojecteur).
            </p>
            <div className="space-y-2">
              {tarifs.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select
                    className="field flex-1"
                    value={t.categorie_client}
                    onChange={(e) => setTarif(i, "categorie_client", e.target.value)}
                  >
                    <option value="">Toutes catégories (tarif unique)</option>
                    {CATEGORIES_CLIENT.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  <input
                    type="number" min="0" className="field w-32" placeholder="Prix FCFA"
                    value={t.prix} onChange={(e) => setTarif(i, "prix", e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-ghost px-2 py-2 text-accent-dark disabled:opacity-30"
                    onClick={() => removeTarifRow(i)}
                    disabled={tarifs.length === 1}
                    aria-label="Retirer cette ligne de tarif"
                  >
                    <LuTrash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button className="btn-primary w-full" onClick={submit} disabled={!canSubmit || submitting}>
            {submitting ? "Enregistrement…" : editing ? "Enregistrer" : "Créer le service"}
          </button>
        </div>
      </Modal>
    </>
  );
}