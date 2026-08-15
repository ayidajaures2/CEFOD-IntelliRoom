import { useCallback, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchConversations } from "../../api/conversationApi";
import { usePolling } from "../../hooks/usePolling";
import { useAuth } from "../../hooks/useAuth";
import { homePathForRole } from "../../utils/roleHelpers";
import { ROLE_LABELS } from "../../utils/constants";
import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";
import { formatDateTime } from "../../utils/formatDate";

/**
 * Générique par rôle (réception ET SG y accèdent, mêmes données, même
 * permission côté API — pas de logique conditionnelle, donc pas de raison
 * de dupliquer ce composant comme Clients.jsx).
 */
export default function ConversationsList() {
  const { role } = useAuth();
  const base = homePathForRole(role);
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";

  const [conversations, setConversations] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await fetchConversations();
      setConversations(Array.isArray(data) ? data : data.data ?? []);
    } catch { /* silencieux */ }
    finally { setLoaded(true); }
  }, []);
  usePolling(load, 8000);

  const filtered = q
    ? conversations.filter((c) => {
        const nom = c.utilisateur ? `${c.utilisateur.prenom} ${c.utilisateur.nom}` : "";
        return nom.toLowerCase().includes(q.toLowerCase());
      })
    : conversations;

  return (
    <>
      <PageHeader
        eyebrow={ROLE_LABELS[role]}
        title="Messagerie clients"
        subtitle="Conversations en direct avec les clients connectés."
      />
      <input
        className="field mb-4 max-w-sm"
        placeholder="Rechercher un client…"
        value={q}
        onChange={(e) => setSearchParams(e.target.value ? { q: e.target.value } : {})}
        aria-label="Rechercher une conversation par client"
      />
      {loaded && filtered.length === 0 && (
        <EmptyState
          title={q ? "Aucune conversation pour ce client" : "Aucune conversation"}
          hint={q ? "Ce client n'a pas encore écrit." : "Les messages des clients apparaîtront ici."}
        />
      )}
      <ul className="grid gap-3">
        {filtered.map((c) => (
          <li key={c.id_conversation}>
            <Link to={`${base}/conversations/${c.id_conversation}`} className="card flex items-center justify-between gap-3 p-4 transition-shadow hover:shadow-md">
              <div>
                <p className="font-medium">
                  {c.utilisateur ? `${c.utilisateur.prenom} ${c.utilisateur.nom}` : "Visiteur"}
                </p>
                <p className="text-xs text-ink/50">Débutée le {formatDateTime(c.debut_conversation)}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${c.fin_conversation ? "bg-ink/5 text-ink/50" : "bg-accent text-paper"}`}>
                {c.fin_conversation ? "Clôturée" : "En cours"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}