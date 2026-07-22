import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LuMessageCircleQuestion, LuBell, LuSettings, LuPlus, LuPencil, LuTrash2,
  LuSearch, LuSend, LuCircleAlert, LuCircleCheck,
} from "react-icons/lu";
import PageHeader from "../../components/common/PageHeader";
import Modal from "../../components/common/Modal";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import { POLLING_INTERVAL } from "../../utils/constants";
import { extractList } from "../../utils/extract";
import { apiErrorMessage } from "../../utils/apiError";
import {
  fetchAdminFaq, createFaq, updateFaqItem, deleteFaqItem, broadcastNotification,
} from "../../api/FaqApi";

/**
 * Page « Paramètres » de l'admin (v2, refonte 22/07/2026).
 *
 * Trois onglets :
 *   1) FAQ           → CRUD complet des questions (par catégorie).
 *   2) Notifications → diffusion d'une alerte à un rôle donné.
 *   3) Général       → infos techniques (lecture seule) + profil admin.
 *
 * Onglets contrôlés par un simple useState — pas de librairie ajoutée.
 */

const TABS = [
  { id: "faq",       label: "FAQ",           Icon: LuMessageCircleQuestion },
  { id: "notif",     label: "Notifications", Icon: LuBell },
  { id: "general",   label: "Général",       Icon: LuSettings },
];

export default function Settings() {
  const [tab, setTab] = useState("faq");

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Paramètres"
        subtitle="Gestion de la FAQ, diffusion de notifications et configuration technique."
      />

      {/* Onglets */}
      <div className="mb-6 flex flex-wrap gap-1 border-b border-ink/10">
        {TABS.map(({ id, label, Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={
                "-mb-px flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors " +
                (active
                  ? "border-b-2 border-accent text-accent"
                  : "border-b-2 border-transparent text-ink/55 hover:text-ink")
              }
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
              {label}
            </button>
          );
        })}
      </div>

      {tab === "faq" && <FaqPanel />}
      {tab === "notif" && <NotificationsPanel />}
      {tab === "general" && <GeneralPanel />}
    </>
  );
}

// ============================================================
// ONGLET FAQ — CRUD par catégorie
// ============================================================

function FaqPanel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");

  const [editing, setEditing] = useState(null);   // null = fermé, {} = création, {…} = édition
  const [deleting, setDeleting] = useState(null); // faq en cours de confirmation de suppression

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await fetchAdminFaq();
      setItems(extractList(data));
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /** Catégories distinctes présentes en base (pour datalist + filtre). */
  const categories = useMemo(() => {
    const set = new Set();
    for (const f of items) {
      const c = (f.categorie ?? "").toLowerCase();
      if (c) set.add(c);
    }
    return [...set].sort();
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((f) => {
      if (catFilter && (f.categorie ?? "").toLowerCase() !== catFilter) return false;
      if (!q) return true;
      return (
        (f.question ?? "").toLowerCase().includes(q) ||
        (f.reponse ?? "").toLowerCase().includes(q) ||
        (f.mots_cles ?? "").toLowerCase().includes(q)
      );
    });
  }, [items, search, catFilter]);

  /** Regroupement par catégorie pour affichage. */
  const grouped = useMemo(() => {
    const map = new Map();
    for (const f of filtered) {
      const key = (f.categorie ?? "autres").toLowerCase();
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(f);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const handleSave = async (payload, id) => {
    try {
      if (id) await updateFaqItem(id, payload);
      else await createFaq(payload);
      setEditing(null);
      await load();
    } catch (e) {
      alert(apiErrorMessage(e));
    }
  };

  const handleDelete = async (faq) => {
    try {
      await deleteFaqItem(faq.id_faq);
      setDeleting(null);
      await load();
    } catch (e) {
      alert(apiErrorMessage(e));
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-5">
      {/* Barre d'outils */}
      <div className="card flex flex-wrap items-center gap-3 p-4">
        <div className="relative flex-1 min-w-[200px]">
          <LuSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <input
            className="field pl-9"
            placeholder="Rechercher une question, une réponse ou un mot-clé…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="field w-auto"
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
        >
          <option value="">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setEditing({})}
          className="btn-primary shrink-0"
        >
          <LuPlus className="h-4 w-4" /> Nouvelle question
        </button>
      </div>

      {error && (
        <div className="card flex items-start gap-3 border-l-4 border-accent p-4 text-sm">
          <LuCircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <p>{error}</p>
        </div>
      )}

      {/* Liste des questions par catégorie */}
      {grouped.length === 0 ? (
        <EmptyState
          title="Aucune question à afficher"
          hint={search || catFilter
            ? "Modifiez vos filtres ou créez une nouvelle question."
            : "Commencez par ajouter une première question."}
        />
      ) : (
        grouped.map(([cat, list]) => (
          <section key={cat} className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-base font-bold capitalize">{cat}</h3>
              <span className="text-xs font-semibold uppercase tracking-wide text-ink/45">
                {list.length} question{list.length > 1 ? "s" : ""}
              </span>
            </div>
            <ul className="divide-y divide-ink/5">
              {list.map((f) => (
                <li key={f.id_faq} className="flex flex-wrap items-start gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{f.question}</p>
                    <p className="mt-0.5 text-sm text-ink/60 line-clamp-2">{f.reponse}</p>
                    {f.mots_cles && (
                      <p className="mt-1 text-xs text-ink/45">
                        <span className="uppercase tracking-wide">Mots-clés :</span> {f.mots_cles}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => setEditing(f)}
                      className="btn-ghost px-2 py-1.5"
                      title="Modifier"
                    >
                      <LuPencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(f)}
                      className="btn-ghost px-2 py-1.5 text-accent-dark"
                      title="Supprimer"
                    >
                      <LuTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      {/* Modal d'édition / création */}
      {editing && (
        <FaqModal
          faq={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}

      {/* Confirmation de suppression */}
      {deleting && (
        <Modal open onClose={() => setDeleting(null)} title="Supprimer cette question ?">
          <p className="text-sm">
            <strong>Question :</strong> {deleting.question}
          </p>
          <p className="mt-2 text-sm text-ink/60">
            Cette action est définitive. La question disparaîtra du chatbot pour tous les visiteurs.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => setDeleting(null)} className="btn-ghost">
              Annuler
            </button>
            <button type="button" onClick={() => handleDelete(deleting)} className="btn-primary">
              Supprimer
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/** Modal de création / édition d'une FAQ. */
function FaqModal({ faq, categories, onClose, onSave }) {
  const isEdit = !!faq.id_faq;
  const [form, setForm] = useState({
    question: faq.question ?? "",
    reponse: faq.reponse ?? "",
    categorie: (faq.categorie ?? "").toLowerCase(),
    mots_cles: faq.mots_cles ?? "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.question.trim() || !form.reponse.trim() || !form.categorie.trim()) {
      alert("Question, réponse et catégorie sont obligatoires.");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        question: form.question.trim(),
        reponse: form.reponse.trim(),
        categorie: form.categorie.trim().toLowerCase(),
        mots_cles: form.mots_cles.trim() || null,
      }, isEdit ? faq.id_faq : null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={isEdit ? "Modifier la question" : "Nouvelle question"}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="field-label">Question</label>
          <input className="field" value={form.question} onChange={set("question")} required />
        </div>
        <div>
          <label className="field-label">Réponse</label>
          <textarea className="field min-h-[120px]" value={form.reponse} onChange={set("reponse")} required />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="field-label">Catégorie</label>
            <input
              className="field"
              list="faq-categories"
              value={form.categorie}
              onChange={set("categorie")}
              placeholder="paiement, cefod, salle…"
              required
            />
            <datalist id="faq-categories">
              {categories.map((c) => <option key={c} value={c} />)}
            </datalist>
            <p className="mt-1 text-xs text-ink/45">
              Minuscules, sans accent. Une nouvelle catégorie sera créée si elle n'existe pas.
            </p>
          </div>
          <div>
            <label className="field-label">Mots-clés</label>
            <input
              className="field"
              value={form.mots_cles}
              onChange={set("mots_cles")}
              placeholder="tarif, prix, coût…"
            />
            <p className="mt-1 text-xs text-ink/45">Séparés par des virgules. Optionnel.</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost" disabled={saving}>
            Annuler
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ============================================================
// ONGLET NOTIFICATIONS — diffusion
// ============================================================

const NOTIF_TYPES = [
  { value: "info",         label: "Information" },
  { value: "confirmation", label: "Confirmation" },
  { value: "rappel",       label: "Rappel" },
  { value: "annulation",   label: "Annulation" },
  { value: "validation",   label: "Validation" },
  { value: "reservation",  label: "Réservation" },
  { value: "paiement",     label: "Paiement" },
];

const NOTIF_ROLES = [
  { value: "",              label: "Tous les utilisateurs" },
  { value: "client",        label: "Clients" },
  { value: "receptionniste",label: "Réception" },
  { value: "caissier",      label: "Caisse" },
  { value: "admin",         label: "Administrateurs" },
];

function NotificationsPanel() {
  const [form, setForm] = useState({ titre: "", contenu: "", type: "info", role: "" });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null); // { ok, message }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.titre.trim() || !form.contenu.trim()) {
      setResult({ ok: false, message: "Le titre et le contenu sont obligatoires." });
      return;
    }
    setSending(true); setResult(null);
    try {
      const payload = {
        titre: form.titre.trim(),
        contenu: form.contenu.trim(),
        type: form.type || "info",
      };
      if (form.role) payload.role = form.role;
      const { data } = await broadcastNotification(payload);
      setResult({
        ok: true,
        message: data.destinataires
          ? `Notification envoyée à ${data.destinataires} destinataire${data.destinataires > 1 ? "s" : ""}.`
          : (data.message ?? "Notification envoyée."),
      });
      setForm({ titre: "", contenu: "", type: "info", role: "" });
    } catch (e) {
      setResult({ ok: false, message: apiErrorMessage(e) });
    } finally {
      setSending(false);
    }
  };

  const roleLabel = NOTIF_ROLES.find((r) => r.value === form.role)?.label ?? "";

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {/* Formulaire */}
      <form onSubmit={submit} className="card space-y-4 p-5 lg:col-span-2">
        <h3 className="font-display text-lg font-bold">Diffuser une notification</h3>
        <p className="text-sm text-ink/55">
          Envoyez un message à un rôle donné. Les destinataires la verront dans leur cloche
          de notifications, immédiatement.
        </p>

        <div>
          <label className="field-label">Titre</label>
          <input
            className="field"
            value={form.titre}
            onChange={set("titre")}
            placeholder="Maintenance planifiée dimanche"
            maxLength={255}
            required
          />
        </div>

        <div>
          <label className="field-label">Contenu</label>
          <textarea
            className="field min-h-[120px]"
            value={form.contenu}
            onChange={set("contenu")}
            placeholder="Le CEFOD sera fermé exceptionnellement dimanche. Merci de votre compréhension."
            maxLength={2000}
            required
          />
          <p className="mt-1 text-xs text-ink/45">{form.contenu.length}/2000 caractères</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="field-label">Type</label>
            <select className="field" value={form.type} onChange={set("type")}>
              {NOTIF_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Destinataires</label>
            <select className="field" value={form.role} onChange={set("role")}>
              {NOTIF_ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>

        {result && (
          <div className={
            "flex items-start gap-2 rounded-xl p-3 text-sm " +
            (result.ok
              ? "bg-accent-soft text-accent-dark"
              : "border border-accent bg-accent-soft text-accent-dark")
          }>
            {result.ok
              ? <LuCircleCheck className="mt-0.5 h-4 w-4 shrink-0" />
              : <LuCircleAlert className="mt-0.5 h-4 w-4 shrink-0" />}
            <p>{result.message}</p>
          </div>
        )}

        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={sending}>
            <LuSend className="h-4 w-4" />
            {sending ? "Envoi…" : "Envoyer maintenant"}
          </button>
        </div>
      </form>

      {/* Aperçu */}
      <aside className="card p-5">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-ink/45">Aperçu</h4>
        <div className="mt-3 rounded-2xl border border-ink/10 bg-surface p-4">
          <div className="flex items-start gap-3">
            <span className="stat-icon shrink-0">
              <LuBell className="h-5 w-5" strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {form.titre.trim() || "Titre de la notification"}
              </p>
              <p className="mt-1 whitespace-pre-line text-sm text-ink/70">
                {form.contenu.trim() || "Le contenu du message apparaîtra ici."}
              </p>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-ink/40">
                {form.type} · {roleLabel}
              </p>
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-ink/45">
          Cet aperçu se met à jour au fur et à mesure de votre saisie.
        </p>
      </aside>
    </div>
  );
}

// ============================================================
// ONGLET GÉNÉRAL — infos techniques + profil admin
// ============================================================

function GeneralPanel() {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <h3 className="font-display text-lg font-bold">Configuration technique</h3>
        <p className="mt-1 text-sm text-ink/55">
          Ces valeurs proviennent du fichier <code className="rounded bg-ink/5 px-1">.env</code>{" "}
          du frontend. Pour les modifier : éditez le fichier puis relancez{" "}
          <code className="rounded bg-ink/5 px-1">npm run dev</code>.
        </p>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-ink/55">URL de l'API</dt>
            <dd className="font-mono text-xs">{apiUrl}</dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-ink/55">Intervalle du temps réel</dt>
            <dd className="font-mono text-xs">{POLLING_INTERVAL} ms</dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-ink/55">Environnement</dt>
            <dd className="font-mono text-xs">{import.meta.env.MODE}</dd>
          </div>
        </dl>
      </div>

    </div>
  );
}