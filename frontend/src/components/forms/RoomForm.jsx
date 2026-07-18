import { useState } from "react";
import { CATEGORIES_CLIENT } from "../../utils/constants";

const EMPTY_TARIFS = CATEGORIES_CLIENT.map((c) => ({
  categorie_client: c.value, prix: "", unite: "jour",
}));

/**
 * Création / édition d'une salle + grille tarifaire TarifSalle
 * (une ligne par catégorie de client — CLAUDE.md §2).
 */
export default function RoomForm({ initial = null, onSubmit, submitting }) {
  const [form, setForm] = useState({
    nom_salle: initial?.nom_salle ?? "",
    type_salle: initial?.type_salle ?? "",
    capacite: initial?.capacite ?? "",
    description: initial?.description ?? "",
    equipements: initial?.equipements ?? "",
  });
  const [tarifs, setTarifs] = useState(() => {
    const existing = initial?.tarifs ?? initial?.tarif_salles ?? [];
    return EMPTY_TARIFS.map((t) => {
      const found = existing.find((e) => e.categorie_client === t.categorie_client);
      return found ? { ...t, prix: found.prix, unite: found.unite ?? "jour" } : t;
    });
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setTarif = (i, k) => (e) =>
    setTarifs((list) => list.map((t, idx) => (idx === i ? { ...t, [k]: e.target.value } : t)));

  const canSubmit = form.nom_salle && form.type_salle && Number(form.capacite) > 0;

  const submit = () =>
    onSubmit({
      ...form,
      capacite: Number(form.capacite),
      tarifs: tarifs
        .filter((t) => t.prix !== "" && Number(t.prix) >= 0)
        .map((t) => ({ ...t, prix: Number(t.prix) })),
    });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="r-nom">Nom de la salle</label>
          <input id="r-nom" className="field" value={form.nom_salle} onChange={set("nom_salle")} placeholder="Salle Toumaï" />
        </div>
        <div>
          <label className="field-label" htmlFor="r-type">Type</label>
          <input id="r-type" className="field" value={form.type_salle} onChange={set("type_salle")} placeholder="Conférence, formation…" />
        </div>
      </div>
      <div>
        <label className="field-label" htmlFor="r-cap">Capacité (places)</label>
        <input id="r-cap" type="number" min="1" className="field" value={form.capacite} onChange={set("capacite")} />
      </div>
      <div>
        <label className="field-label" htmlFor="r-desc">Description</label>
        <textarea id="r-desc" rows={3} className="field" value={form.description} onChange={set("description")} />
      </div>
      <div>
        <label className="field-label" htmlFor="r-equip">Équipements (séparés par des virgules)</label>
        <input id="r-equip" className="field" value={form.equipements} onChange={set("equipements")} placeholder="Vidéoprojecteur, climatisation, sonorisation" />
      </div>

      <fieldset className="rounded-xl border border-ink/10 p-4">
        <legend className="px-2 text-xs font-semibold uppercase tracking-wide text-ink/60">Grille tarifaire par catégorie</legend>
        <div className="space-y-3">
          {tarifs.map((t, i) => (
            <div key={t.categorie_client} className="grid items-center gap-2 sm:grid-cols-[1fr_140px_120px]">
              <span className="text-sm font-medium">
                {CATEGORIES_CLIENT.find((c) => c.value === t.categorie_client)?.label}
              </span>
              <input
                type="number" min="0" className="field" placeholder="Prix (FCFA)"
                value={t.prix} onChange={setTarif(i, "prix")}
                aria-label={`Prix ${t.categorie_client}`}
              />
              <select className="field" value={t.unite} onChange={setTarif(i, "unite")} aria-label={`Unité ${t.categorie_client}`}>
                <option value="jour">/ jour</option>
                <option value="heure">/ heure</option>
              </select>
            </div>
          ))}
        </div>
      </fieldset>

      <button className="btn-primary w-full" onClick={submit} disabled={!canSubmit || submitting}>
        {submitting ? "Enregistrement…" : initial ? "Enregistrer les modifications" : "Créer la salle"}
      </button>
    </div>
  );
}
