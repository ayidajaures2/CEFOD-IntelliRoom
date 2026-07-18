import { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ChatWindow from "../../components/chat/ChatWindow";
import { fetchMessages, sendMessage, closeConversation } from "../../api/conversationApi";
import { usePolling } from "../../hooks/usePolling";
import { useNotify } from "../../contexts/NotificationContext";
import { apiErrorMessage } from "../../utils/apiError";

export default function ConversationDetail() {
  const { id } = useParams();
  const { success, error: toastError } = useNotify();
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await fetchMessages(id);
      const conv = data.data ?? data;
      setMessages(Array.isArray(conv) ? conv : conv.messages ?? []);
    } catch { /* silencieux */ }
  }, [id]);
  usePolling(load, 5000);

  const send = async (text) => {
    setSending(true);
    try {
      await sendMessage(id, text);
      await load();
    } catch (e) {
      toastError(apiErrorMessage(e, "Message non envoyé."));
    } finally {
      setSending(false);
    }
  };

  const close = async () => {
    if (!window.confirm("Clôturer cette conversation ?")) return;
    try {
      await closeConversation(id);
      success("Conversation clôturée.");
    } catch (e) {
      toastError(apiErrorMessage(e, "Clôture impossible."));
    }
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <Link to="/reception/conversations" className="text-sm text-ink/55 hover:text-accent">← Toutes les conversations</Link>
        <button onClick={close} className="btn-outline px-3 py-1.5 text-xs">Clôturer</button>
      </div>
      <ChatWindow
        messages={messages}
        onSend={send}
        sending={sending}
        isOwn={(m) => m.expediteur !== "client" && m.expediteur !== "chatbot"}
        placeholder="Répondre au client…"
      />
    </>
  );
}
