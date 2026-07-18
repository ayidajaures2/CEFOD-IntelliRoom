import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { fetchConversations } from "../../api/conversationApi";
import { usePolling } from "../../hooks/usePolling";
import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";
import { formatDateTime } from "../../utils/formatDate";

export default function ConversationsList() {
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

  return (
    <>
      <PageHeader eyebrow="Réception" title="Messagerie clients" subtitle="Conversations en direct avec les clients connectés." />
      {loaded && conversations.length === 0 && (
        <EmptyState title="Aucune conversation" hint="Les messages des clients apparaîtront ici." />
      )}
      <ul className="grid gap-3">
        {conversations.map((c) => (
          <li key={c.id_conversation}>
            <Link to={`/reception/conversations/${c.id_conversation}`} className="card flex items-center justify-between gap-3 p-4 transition-shadow hover:shadow-md">
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
