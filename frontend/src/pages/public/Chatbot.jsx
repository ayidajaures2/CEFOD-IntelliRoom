import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  LuBuilding2, LuCalendarDays, LuBanknote, LuDoorOpen, LuClock, LuMail,
  LuMessageCircleQuestion, LuArrowLeft, LuRefreshCw,
} from "react-icons/lu";
import MessageBubble from "../../components/chat/MessageBubble";
import { fetchFaq, sendChatbotMessage } from "../../api/chatbotApi";
import { useAuth } from "../../hooks/useAuth";
import { ROLES } from "../../utils/constants";
import { extractList } from "../../utils/extract";

/**
 * Chatbot FAQ d'orientation — accessible sans compte (visiteurs).
 *
 * FLUX EN 2 ÉTAPES :
 *  1) Accueil : message de bienvenue + tuiles des CATÉGORIES cliquables
 *     (déduites automatiquement de la colonne faq.categorie).
 *  2) Après clic sur une tuile : les questions de cette catégorie
 *     s'affichent en pilules. L'utilisateur clique, la réponse arrive.
 *     Fil d'Ariane « Catégories › Paiement » + bouton retour.
 *
 * Aucun champ de saisie : uniquement des boutons.
 */

const CATEGORY_META = {
  cefod:       { label: "Le CEFOD",        Icon: LuBuilding2,             desc: "L'institution, sa mission, ses valeurs.", order: 1 },
  reservation: { label: "Réservation",     Icon: LuCalendarDays,          desc: "Comment réserver, annuler, suivre.",     order: 2 },
  paiement:    { label: "Paiement",        Icon: LuBanknote,              desc: "Modes, frais et moment de paiement.",     order: 3 },
  salle:       { label: "Salles & tarifs", Icon: LuDoorOpen,              desc: "Capacités, équipements, grilles tarifaires.", order: 4 },
  horaires:    { label: "Horaires",        Icon: LuClock,                 desc: "Jours et heures d'ouverture.",             order: 5 },
  contact:     { label: "Contact",         Icon: LuMail,                  desc: "Nous joindre, adresse, factures.",         order: 6 },
};

const DEFAULT_META = { label: "Autres", Icon: LuMessageCircleQuestion, desc: "Questions diverses.", order: 99 };
const metaFor = (key) => CATEGORY_META[key] ?? DEFAULT_META;
const prettyCat = (key) => metaFor(key).label;

export default function Chatbot() {
  const { isAuthenticated, role } = useAuth();

  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [sending, setSending] = useState(false);

  const [faqAll, setFaqAll] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [asked, setAsked] = useState(() => new Set());

  const bottomRef = useRef(null);

  useEffect(() => {
    let alive = true;
    fetchFaq()
      .then(({ data }) => {
        if (!alive) return;
        setFaqAll(extractList(data));
      })
      .catch(() => { if (alive) setFaqAll([]); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedCat]);

  const categories = useMemo(() => {
    const groups = new Map();
    for (const f of faqAll) {
      const key = (f.categorie ?? "autres").toLowerCase();
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(f);
    }
    return [...groups.entries()]
      .map(([key, items]) => ({ key, items, ...metaFor(key) }))
      .sort((a, b) => a.order - b.order);
  }, [faqAll]);

  const questionsInCat = useMemo(() => {
    if (!selectedCat) return [];
    const cat = categories.find((c) => c.key === selectedCat);
    if (!cat) return [];
    return cat.items.filter((f) => !asked.has(String(f.id_faq)));
  }, [selectedCat, categories, asked]);

  const askQuestion = async (faq) => {
    if (sending) return;
    const text = faq.question;

    setMessages((m) => [...m, {
      expediteur: "client",
      contenu_mess: text,
      date_envoi: new Date().toISOString(),
    }]);
    setAsked((prev) => new Set(prev).add(String(faq.id_faq)));
    setSending(true);

    try {
      const { data } = await sendChatbotMessage(text, conversationId);
      if (data.id_conversation) setConversationId(data.id_conversation);
      setMessages((m) => [...m, {
        expediteur: "chatbot",
        contenu_mess: data.reponse ?? data.answer ?? data.message ?? faq.reponse ?? "Je n'ai pas compris, pouvez-vous reformuler ?",
        date_envoi: new Date().toISOString(),
      }]);
    } catch {
      setMessages((m) => [...m, {
        expediteur: "chatbot",
        contenu_mess: faq.reponse ?? "Le service est momentanément indisponible. Réessayez dans un instant.",
        date_envoi: new Date().toISOString(),
      }]);
    } finally {
      setSending(false);
    }
  };

  const backToCategories = () => setSelectedCat(null);

  const resetAll = () => {
    setMessages([]);
    setConversationId(null);
    setAsked(new Set());
    setSelectedCat(null);
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Assistance</p>
          <h1 className="mt-1 font-display text-3xl font-black">Assistant d'orientation</h1>
          <p className="mt-1 text-sm text-ink/55">
            Bienvenue. Pour commencer, choisissez le sujet qui vous intéresse ci-dessous.
            {isAuthenticated && role === ROLES.CLIENT && (
              <> Pour parler à une personne, utilisez la <Link to="/client/messages" className="font-semibold text-accent">messagerie</Link>.</>
            )}
          </p>
        </div>
        {(hasMessages || selectedCat) && (
          <button
            type="button"
            onClick={resetAll}
            disabled={sending}
            className="btn-ghost shrink-0 px-3 py-1.5 text-xs disabled:opacity-50"
            title="Repartir de zéro"
          >
            <LuRefreshCw className="h-4 w-4" /> Recommencer
          </button>
        )}
      </div>

      <div className="mt-5 card flex h-[65vh] flex-col overflow-hidden">
        <div className="flex-1 space-y-3 overflow-y-auto bg-ink/[0.02] p-4">
          {!hasMessages && !selectedCat ? (
            <WelcomeCategories categories={categories} onPick={setSelectedCat} />
          ) : (
            <>
              {messages.map((m, i) => (
                <MessageBubble key={m.id_message ?? i} message={m} own={m.expediteur !== "chatbot"} />
              ))}
              {sending && (
                <p className="text-xs italic text-ink/45">L'assistant rédige une réponse…</p>
              )}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {selectedCat ? (
          <div className="border-t border-ink/10 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs text-ink/55">
              <button
                type="button"
                onClick={backToCategories}
                className="inline-flex items-center gap-1 rounded-full px-2 py-1 hover:bg-ink/5 hover:text-accent"
              >
                <LuArrowLeft className="h-3.5 w-3.5" /> Catégories
              </button>
              <span>›</span>
              <span className="font-semibold text-ink/70">{prettyCat(selectedCat)}</span>
            </div>

            {questionsInCat.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {questionsInCat.map((f) => (
                  <button
                    key={f.id_faq}
                    type="button"
                    onClick={() => askQuestion(f)}
                    disabled={sending}
                    className="rounded-full border border-accent/40 bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent-dark transition-colors hover:bg-accent hover:text-paper disabled:opacity-50"
                  >
                    {f.question}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-ink/50">
                Vous avez fait le tour des questions de cette catégorie.{" "}
                <button type="button" onClick={backToCategories} className="font-semibold text-accent hover:underline">
                  Voir les autres sujets
                </button>.
              </p>
            )}
          </div>
        ) : hasMessages ? (
          <div className="border-t border-ink/10 p-3 text-xs text-ink/55">
            Choisissez un autre sujet ci-dessus pour continuer, ou{" "}
            <button type="button" onClick={resetAll} className="font-semibold text-accent hover:underline">
              recommencer une nouvelle conversation
            </button>.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function WelcomeCategories({ categories, onPick }) {
  if (categories.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <LuMessageCircleQuestion className="h-10 w-10 text-ink/25" />
        <p className="text-sm text-ink/45">Chargement des sujets…</p>
      </div>
    );
  }

  return (
    <div className="py-2">
      <div className="mb-4 rounded-2xl bg-accent-soft p-4 text-sm text-ink/75">
          <strong>Bienvenue sur l'assistant CEFOD IntelliRoom.</strong>{" "}
        Choisissez un sujet ci-dessous pour découvrir les réponses aux questions
        les plus fréquentes.
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {categories.map(({ key, label, Icon, desc, items }) => (
          <button
            key={key}
            type="button"
            onClick={() => onPick(key)}
            className="group flex items-start gap-3 rounded-2xl border border-ink/10 bg-surface p-4 text-left transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-soft"
          >
            <span className="stat-icon">
              <Icon className="h-6 w-6" strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-base font-bold group-hover:text-accent">
                {label}
              </span>
              <span className="block text-xs text-ink/55">{desc}</span>
              <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wide text-ink/40">
                {items.length} question{items.length > 1 ? "s" : ""}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}