import { useState } from "react";
import { Link } from "react-router-dom";
import ChatWindow from "../../components/chat/ChatWindow";
import { sendChatbotMessage } from "../../api/chatbotApi";
import { useAuth } from "../../hooks/useAuth";
import { ROLES } from "../../utils/constants";

const SUGGESTIONS = [
  "Quelles salles sont disponibles aujourd'hui ?",
  "Comment réserver une salle ?",
  "Quels sont les horaires d'ouverture ?",
  "Quels moyens de paiement acceptez-vous ?",
];

/** Chatbot FAQ d'orientation — accessible sans compte (visiteurs). */
export default function Chatbot() {
  const { isAuthenticated, role } = useAuth();
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [sending, setSending] = useState(false);

  const send = async (text) => {
    const now = new Date().toISOString();
    setMessages((m) => [...m, { expediteur: "client", contenu_mess: text, date_envoi: now }]);
    setSending(true);
    try {
      const { data } = await sendChatbotMessage(text, conversationId);
      if (data.id_conversation) setConversationId(data.id_conversation);
      setMessages((m) => [...m, {
        expediteur: "chatbot",
        contenu_mess: data.reponse ?? data.answer ?? data.message ?? "Je n'ai pas compris, pouvez-vous reformuler ?",
        date_envoi: new Date().toISOString(),
      }]);
    } catch {
      setMessages((m) => [...m, {
        expediteur: "chatbot",
        contenu_mess: "Le service est momentanément indisponible. Réessayez dans un instant.",
        date_envoi: new Date().toISOString(),
      }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl font-black">Assistant d'orientation</h1>
      <p className="mt-1 text-sm text-ink/55">
        Posez vos questions sur les salles, les disponibilités, les horaires ou la réservation.
        {isAuthenticated && role === ROLES.CLIENT && (
          <> Pour parler à une personne, utilisez la <Link to="/client/messages" className="font-semibold text-accent">messagerie</Link>.</>
        )}
      </p>

      <div className="mt-5">
        <ChatWindow
          messages={messages}
          onSend={send}
          sending={sending}
          isOwn={(m) => m.expediteur !== "chatbot"}
          placeholder="Votre question…"
          header={
            messages.length === 0 ? (
              <div className="flex flex-wrap gap-2 border-b border-ink/10 p-3">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)} className="rounded-full border border-accent/40 bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent-dark hover:bg-accent hover:text-paper">
                    {s}
                  </button>
                ))}
              </div>
            ) : null
          }
        />
      </div>
    </div>
  );
}
