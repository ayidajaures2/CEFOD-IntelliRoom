import { useMemo, useState } from "react";
import { formatMoney } from "../../utils/formatMoney";
import { CATEGORIE_CLIENT_LABELS } from "../../utils/constants";
import { toApiDateTime } from "../../utils/formatDate";

/**
 * Formulaire de demande de réservation (statut initial : en_attente).
 * Aucun paiement à ce stade — le prix affiché est indicatif, calculé
 * à partir du tarif de la catégorie du client (CLAUDE.md §3).
 */
export default function BookingForm({ rooms, user, initialRoomId = "", onSubmit, submitting }) {
  const [form, setForm] = useState({
    id_salle: initialRoomId ? String(initialRoomId) : "",
    date_debut: "",
    date_fin: "",
    motif: "",
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const room = useMemo(
    () => rooms.find((r) => String(r.id_salle) === form.id_salle),
    [rooms, form.id_salle]
  );

  const tarif = useMemo(() => {
    if (!room) return null;
    const list = room.tarifs ?? room.tarif_salles ?? [];
    // Tarif de la catégorie du client ; repli sur le premier tarif de la
    // grille si le profil n'a pas (encore) de catégorie.
    return list.find((t) => t.categorie_client === user?.categorie_client)
      ?? list[0]
      ?? (room.tarif_client ? { ...room.tarif_client } : null);
  }, [room, user]);

  const estimation = useMemo(() => {
    if (!tarif || !form.date_debut || !form.date_fin) return null;
    const start = new Date(form.date_debut);
    const end = new Date(form.date_fin);
    const ms = end - start;
    if (ms <= 0) return null;
    const units = tarif.unite === "heure"
      ? Math.ceil(ms / 3_600_000)
      : Math.ceil(ms / 86_400_000);
    return { units, total: units * Number(tarif.prix) };
  }, [tarif, form.date_debut, form.date_fin]);

  const datesInvalid = form.date_debut && form.date_fin && new Date(form.date_fin) <= new Date(form.date_debut);
  const canSubmit = form.id_salle && form.date_debut && form.date_fin && form.motif.trim() && !datesInvalid;

  const submit = () =>
    onSubmit({
      id_salle: Number(form.id_salle),
      date_debut: toApiDateTime(form.date_debut),
      date_fin: toApiDateTime(form.date_fin),
      motif: form.motif.trim(),
    });

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="card space-y-4 p-6">
        <div>
          <label className="field-label" htmlFor="salle">Salle</label>
          <select id="salle" className="field" value={form.id_salle} onChange={set("id_salle")}>
            <option value="" disabled>Choisir une salle…</option>
            {rooms.map((r) => (
              <option key={r.id_salle} value={r.id_salle}>
                {r.nom_salle} — {r.capacite} places ({r.type_salle})
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="debut">Début</label>
            <input id="debut" type="datetime-local" className="field" value={form.date_debut} onChange={set("date_debut")} />
          </div>
          <div>
            <label className="field-label" htmlFor="fin">Fin</label>
            <input id="fin" type="datetime-local" className="field" value={form.date_fin} onChange={set("date_fin")} />
            {datesInvalid && <p className="mt-1 text-xs font-medium text-accent-dark">La fin doit être après le début.</p>}
          </div>
        </div>
        <div>
          <label className="field-label" htmlFor="motif">Motif de la réservation</label>
          <textarea id="motif" rows={3} className="field" value={form.motif} onChange={set("motif")}
            placeholder="Ex. : atelier de formation, assemblée générale…" />
        </div>
        <button className="btn-primary w-full" disabled={!canSubmit || submitting} onClick={submit}>
          {submitting ? "Envoi…" : "Envoyer la demande de réservation"}
        </button>
      </div>

      <aside className="card h-fit p-6">
        <h2 className="font-display text-lg font-bold">Estimation</h2>
        {user?.categorie_client && (
          <p className="mt-1 text-xs text-ink/50">
            Catégorie : <strong>{CATEGORIE_CLIENT_LABELS[user.categorie_client]}</strong>
          </p>
        )}
        {estimation ? (
          <div className="mt-4 space-y-2 text-sm">
            <p className="flex justify-between"><span className="text-ink/60">Tarif</span><span>{formatMoney(tarif.prix)} / {tarif.unite}</span></p>
            <p className="flex justify-between"><span className="text-ink/60">Durée facturée</span><span>{estimation.units} {tarif.unite}(s)</span></p>
            <p className="flex justify-between border-t border-ink/10 pt-2 font-display text-lg font-bold">
              <span>Total estimé</span><span className="text-accent-dark">{formatMoney(estimation.total)}</span>
            </p>
          </div>
        ) : (
          tarif ? (
            <div className="mt-4 space-y-1 text-sm">
              <p className="flex justify-between"><span className="text-ink/60">Votre tarif ({CATEGORIE_CLIENT_LABELS[user?.categorie_client] ?? "standard"})</span><span className="font-semibold">{formatMoney(tarif.prix)} / {tarif.unite}</span></p>
              <p className="text-ink/50">Sélectionnez les dates pour voir le total estimé.</p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink/50">Choisissez une salle pour voir votre tarif.</p>
          )
        )}
        <p className="mt-4 border-t border-ink/5 pt-3 text-xs text-ink/45">
          Montant indicatif. Le prix définitif vous est confirmé après validation par la réception, <strong>avant</strong> tout paiement.
        </p>
      </aside>
    </div>
  );
}
