import { useEffect, useMemo, useState } from "react";
import { formatMoney } from "../../utils/formatMoney";
import { fetchServices } from "../../api/serviceApi";
import {
  CATEGORIE_CLIENT_LABELS,
  BUSINESS_HOURS_LABEL,
  TYPES_ACTIVITE,
  SUJETS_PRINCIPAUX,
  PUBLICS_CIBLES,
  MEDIAS_INVITES_OPTIONS,
  NOMBRE_FEMMES_OPTIONS,
  RETRANSMISSION_RADIO_TARIF_HORAIRE,
  computeOpenMinutes,
  validateSlot,
} from "../../utils/constants";
import TermsGate from "./TermsGate";
import { toApiDateTime } from "../../utils/formatDate";

const EMPTY = {
  id_salle: "",
  date_debut: "",
  date_fin: "",
  motif: "",
  type_activite: "",
  type_activite_autre: "",
  sujet_principal: "",
  sujet_principal_autre: "",
  public_cible: "",
  medias_invites: "",
  retransmission_radio: false,
  duree_retransmission_heures: "",
  nombre_participants: "",
  nombre_femmes: "",
  titre_groupe_utilisateur: "",
  adresse_groupe_utilisateur: "",
  nom_responsable_reunion: "",
  adresse_responsable_reunion: "",
};

/**
 * Formulaire de demande de réservation (statut initial : en_attente).
 * Aucun paiement à ce stade — le prix affiché est indicatif.
 *
 * Reprend les champs de la fiche papier CEFOD (type d'activité, sujet,
 * public visé, médias, retransmission radio, participants/femmes, groupe
 * et responsable) + le choix des services annexes.
 *
 * ⚠ La retransmission radio n'apparaît PAS dans la liste de services
 * cochables : une seule question dédiée (oui/non + heures), traduite
 * automatiquement par le serveur en ligne facturable à la création
 * (BookingController::store()) — décision actée pour éviter toute
 * désynchronisation entre la réponse du client et ce qui est facturé.
 */
export default function BookingForm({ rooms, user, initialRoomId = "", onSubmit, submitting }) {
  const [form, setForm] = useState({ ...EMPTY, id_salle: initialRoomId ? String(initialRoomId) : "" });
  // Jamais persisté (pas de localStorage/contexte) : se réinitialise à
  // chaque montage du composant, donc à chaque nouvelle demande — le client
  // doit relire et réaccepter à chaque fois, comme demandé.
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState({}); // { id_service: quantite }

  useEffect(() => {
    fetchServices()
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : data.data ?? [];
        // La retransmission radio ne se choisit jamais ici — voir docblock.
        setServices(list.filter((s) => s.nom !== "Retransmission radio"));
      })
      .catch(() => setServices([]));
  }, []);

  const set = (k) => (e) => {
    const v = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
  };

  const toggleService = (idService) => {
    setSelectedServices((s) => {
      const next = { ...s };
      if (next[idService] != null) delete next[idService];
      else next[idService] = 1;
      return next;
    });
  };
  const setServiceQty = (idService, qty) => {
    setSelectedServices((s) => ({ ...s, [idService]: Math.max(1, Number(qty) || 1) }));
  };

  const room = useMemo(
    () => rooms.find((r) => String(r.id_salle) === form.id_salle),
    [rooms, form.id_salle]
  );

  const tarif = useMemo(() => {
    if (!room) return null;
    const list = room.tarifs ?? room.tarif_salles ?? [];
    return list.find((t) => t.categorie_client === user?.categorie_client)
      ?? list[0]
      ?? (room.tarif_client ? { ...room.tarif_client } : null);
  }, [room, user]);

  const resolveServicePrice = (service) => {
    const specific = service.tarifs?.find((t) => t.categorie_client === user?.categorie_client);
    const fallback = service.tarifs?.find((t) => t.categorie_client === null);
    return Number(specific?.prix ?? fallback?.prix ?? 0);
  };

  const slotCheck = useMemo(() => {
    if (!form.date_debut || !form.date_fin) return null;
    const start = new Date(form.date_debut);
    const end = new Date(form.date_fin);
    if (isNaN(start) || isNaN(end) || end <= start) return null;
    const errors = validateSlot(start, end);
    const openMin = computeOpenMinutes(start, end);
    return { errors, openMin };
  }, [form.date_debut, form.date_fin]);

  const servicesTotal = useMemo(
    () =>
      Object.entries(selectedServices).reduce((sum, [idService, qty]) => {
        const svc = services.find((s) => String(s.id_service) === idService);
        return svc ? sum + resolveServicePrice(svc) * qty : sum;
      }, 0),
    [selectedServices, services, user]
  );

  const radioTotal = form.retransmission_radio && form.duree_retransmission_heures
    ? RETRANSMISSION_RADIO_TARIF_HORAIRE * Number(form.duree_retransmission_heures)
    : 0;

  const estimation = useMemo(() => {
    if (!tarif || !slotCheck || slotCheck.errors) return null;
    const { openMin } = slotCheck;
    if (openMin <= 0) return null;
    const units = tarif.unite === "heure"
      ? Math.max(1, Math.ceil(openMin / 60))
      : Math.max(1, Math.ceil(openMin / 600));
    const salleTotal = units * Number(tarif.prix);
    return { units, salleTotal, openMin, total: salleTotal + servicesTotal + radioTotal };
  }, [tarif, slotCheck, servicesTotal, radioTotal]);

  const datesInvalid = form.date_debut && form.date_fin && new Date(form.date_fin) <= new Date(form.date_debut);
  const hasSlotErrors = slotCheck?.errors != null;
  const radioIncomplete = form.retransmission_radio && !form.duree_retransmission_heures;
  const canSubmit =
    form.id_salle && form.date_debut && form.date_fin && form.motif.trim() &&
    !datesInvalid && !hasSlotErrors && !radioIncomplete && acceptedTerms;

  const submit = () =>
    onSubmit({
      id_salle: Number(form.id_salle),
      date_debut: toApiDateTime(form.date_debut),
      date_fin: toApiDateTime(form.date_fin),
      motif: form.motif.trim(),
      type_activite: form.type_activite || undefined,
      type_activite_autre: form.type_activite === "autre" ? form.type_activite_autre.trim() || undefined : undefined,
      sujet_principal: form.sujet_principal || undefined,
      sujet_principal_autre: form.sujet_principal === "autre" ? form.sujet_principal_autre.trim() || undefined : undefined,
      public_cible: form.public_cible || undefined,
      medias_invites: form.medias_invites || undefined,
      retransmission_radio: form.retransmission_radio,
      duree_retransmission_heures: form.retransmission_radio ? Number(form.duree_retransmission_heures) : undefined,
      nombre_participants: form.nombre_participants ? Number(form.nombre_participants) : undefined,
      nombre_femmes: form.nombre_femmes || undefined,
      titre_groupe_utilisateur: form.titre_groupe_utilisateur.trim() || undefined,
      adresse_groupe_utilisateur: form.adresse_groupe_utilisateur.trim() || undefined,
      nom_responsable_reunion: form.nom_responsable_reunion.trim() || undefined,
      adresse_responsable_reunion: form.adresse_responsable_reunion.trim() || undefined,
      services: Object.entries(selectedServices).map(([id_service, quantite]) => ({
        id_service: Number(id_service),
        quantite,
      })),
    });

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="card space-y-5 p-6">
        <div className="rounded-lg bg-accent-soft px-4 py-3 text-sm text-ink/70">
          <span className="font-semibold text-accent-dark">Horaires d'ouverture :</span> {BUSINESS_HOURS_LABEL}
        </div>

        {/* -------- Salle et créneau -------- */}
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
            {slotCheck?.errors?.date_debut && <p className="mt-1 text-xs font-medium text-accent-dark">{slotCheck.errors.date_debut}</p>}
          </div>
          <div>
            <label className="field-label" htmlFor="fin">Fin</label>
            <input id="fin" type="datetime-local" className="field" value={form.date_fin} onChange={set("date_fin")} />
            {datesInvalid && <p className="mt-1 text-xs font-medium text-accent-dark">La fin doit être après le début.</p>}
            {!datesInvalid && slotCheck?.errors?.date_fin && <p className="mt-1 text-xs font-medium text-accent-dark">{slotCheck.errors.date_fin}</p>}
          </div>
        </div>
        {slotCheck?.errors?.duree && (
          <p className="rounded-lg bg-accent-dark/10 px-4 py-2 text-xs font-medium text-accent-dark">{slotCheck.errors.duree}</p>
        )}

        <div>
          <label className="field-label" htmlFor="motif">Objet de la réservation</label>
          <textarea id="motif" rows={2} className="field" value={form.motif} onChange={set("motif")}
            placeholder="Ex. : atelier de formation, assemblée générale…" />
        </div>

        {/* -------- Profil de l'activité (fiche papier) -------- */}
        <fieldset className="space-y-4 border-t border-ink/10 pt-4">
          <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink/45">Profil de l'activité</legend>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="type_activite">Type d'activité</label>
              <select id="type_activite" className="field" value={form.type_activite} onChange={set("type_activite")}>
                <option value="">Non précisé</option>
                {TYPES_ACTIVITE.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              {form.type_activite === "autre" && (
                <input className="field mt-2" placeholder="Précisez…" value={form.type_activite_autre} onChange={set("type_activite_autre")} />
              )}
            </div>
            <div>
              <label className="field-label" htmlFor="sujet_principal">Sujet principal</label>
              <select id="sujet_principal" className="field" value={form.sujet_principal} onChange={set("sujet_principal")}>
                <option value="">Non précisé</option>
                {SUJETS_PRINCIPAUX.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              {form.sujet_principal === "autre" && (
                <input className="field mt-2" placeholder="Précisez…" value={form.sujet_principal_autre} onChange={set("sujet_principal_autre")} />
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="public_cible">Public visé</label>
              <select id="public_cible" className="field" value={form.public_cible} onChange={set("public_cible")}>
                <option value="">Non précisé</option>
                {PUBLICS_CIBLES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="medias_invites">Médias invités</label>
              <select id="medias_invites" className="field" value={form.medias_invites} onChange={set("medias_invites")}>
                <option value="">Non précisé</option>
                {MEDIAS_INVITES_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="nombre_participants">Nombre de participants</label>
              <input id="nombre_participants" type="number" min="0" className="field" value={form.nombre_participants} onChange={set("nombre_participants")} />
            </div>
            <div>
              <label className="field-label" htmlFor="nombre_femmes">Part de femmes (estimation)</label>
              <select id="nombre_femmes" className="field" value={form.nombre_femmes} onChange={set("nombre_femmes")}>
                <option value="">Non précisé</option>
                {NOMBRE_FEMMES_OPTIONS.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
              </select>
            </div>
          </div>

          <div className="rounded-lg border border-ink/10 px-4 py-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={form.retransmission_radio} onChange={set("retransmission_radio")} />
              Retransmission en direct sur la Radio CEFOD ({formatMoney(RETRANSMISSION_RADIO_TARIF_HORAIRE)}/h)
            </label>
            {form.retransmission_radio && (
              <div className="mt-2">
                <label className="field-label" htmlFor="duree_radio">Durée (heures)</label>
                <input id="duree_radio" type="number" min="0.5" step="0.5" className="field max-w-[140px]"
                  value={form.duree_retransmission_heures} onChange={set("duree_retransmission_heures")} />
              </div>
            )}
          </div>
        </fieldset>

        {/* -------- Groupe et responsable -------- */}
        <fieldset className="space-y-4 border-t border-ink/10 pt-4">
          <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink/45">
            Groupe et responsable <span className="font-normal normal-case text-ink/40">(si différent de votre compte)</span>
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="titre_groupe">Titre du groupe / organisme</label>
              <input id="titre_groupe" className="field" value={form.titre_groupe_utilisateur} onChange={set("titre_groupe_utilisateur")} />
            </div>
            <div>
              <label className="field-label" htmlFor="adresse_groupe">Adresse du groupe</label>
              <input id="adresse_groupe" className="field" value={form.adresse_groupe_utilisateur} onChange={set("adresse_groupe_utilisateur")} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="nom_resp">Nom du responsable de la réunion</label>
              <input id="nom_resp" className="field" value={form.nom_responsable_reunion} onChange={set("nom_responsable_reunion")} />
            </div>
            <div>
              <label className="field-label" htmlFor="adresse_resp">Adresse du responsable</label>
              <input id="adresse_resp" className="field" value={form.adresse_responsable_reunion} onChange={set("adresse_responsable_reunion")} />
            </div>
          </div>
        </fieldset>

        {/* -------- Services annexes -------- */}
        {services.length > 0 && (
          <fieldset className="space-y-2 border-t border-ink/10 pt-4">
            <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink/45">Services annexes</legend>
            {services.map((s) => {
              const checked = selectedServices[s.id_service] != null;
              const prix = resolveServicePrice(s);
              return (
                <div key={s.id_service} className="flex items-center justify-between gap-3 rounded-lg border border-ink/10 px-4 py-2.5">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={checked} onChange={() => toggleService(s.id_service)} />
                    {s.nom} <span className="text-ink/45">— {formatMoney(prix)}/{s.unite}</span>
                  </label>
                  {checked && (
                    <input
                      type="number" min="1" className="field w-20 py-1 text-sm"
                      value={selectedServices[s.id_service]}
                      onChange={(e) => setServiceQty(s.id_service, e.target.value)}
                      aria-label={`Quantité pour ${s.nom}`}
                    />
                  )}
                </div>
              );
            })}
          </fieldset>
        )}

        <TermsGate accepted={acceptedTerms} onAcceptedChange={setAcceptedTerms} />

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
            <p className="flex justify-between"><span className="text-ink/60">Salle ({estimation.units} {tarif.unite}(s))</span><span>{formatMoney(estimation.salleTotal)}</span></p>
            {servicesTotal > 0 && (
              <p className="flex justify-between"><span className="text-ink/60">Services annexes</span><span>{formatMoney(servicesTotal)}</span></p>
            )}
            {radioTotal > 0 && (
              <p className="flex justify-between"><span className="text-ink/60">Retransmission radio</span><span>{formatMoney(radioTotal)}</span></p>
            )}
            <p className="flex justify-between border-t border-ink/10 pt-2 font-display text-lg font-bold">
              <span>Total estimé</span><span className="text-accent-dark">{formatMoney(estimation.total)}</span>
            </p>
          </div>
        ) : (
          tarif ? (
            <div className="mt-4 space-y-1 text-sm">
              <p className="flex justify-between"><span className="text-ink/60">Votre tarif</span><span className="font-semibold">{formatMoney(tarif.prix)} / {tarif.unite}</span></p>
              <p className="text-ink/50">Sélectionnez les dates pour voir le total estimé.</p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink/50">Choisissez une salle pour voir votre tarif.</p>
          )
        )}
        <p className="mt-4 border-t border-ink/5 pt-3 text-xs text-ink/45">
          Montant indicatif — seules les heures ouvrées sont facturées ({BUSINESS_HOURS_LABEL}).
          Le prix définitif vous est confirmé après validation par le secrétariat général, <strong>avant</strong> tout paiement.
        </p>
      </aside>
    </div>
  );
}