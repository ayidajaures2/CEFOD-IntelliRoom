import { useCallback, useState } from "react";
import ChatWindow from "../../components/chat/ChatWindow";
import PageHeader from "../../components/common/PageHeader";
import { fetchConversations, startConversation, fetchMessages, sendMessage } from "../../api/conversationApi";
import { usePolling } from "../../hooks/usePolling";
import { useNotify } from "../../contexts/NotificationContext";
import { apiErrorMessage } from "../../utils/apiError";

/** Messagerie humaine avec la réception (distincte du chatbot FAQ). */
export default function ClientConversation() {
  const { error: toastError } = useNotify();
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      let id = conversationId;
      if (!id) {
        const { data } = await fetchConversations();
        const list = Array.isArray(data) ? data : data.data ?? [];
        const open = list.find((c) => !c.fin_conversation) ?? list[0];
        if (!open) return; // pas encore de conversation : elle sera créée au 1er message
        id = open.id_conversation;
        setConversationId(id);
      }
      const { data } = await fetchMessages(id);
      // getMessages renvoie la CONVERSATION avec ses messages imbriqués —
      // c'est pour ça que les bulles ne s'affichaient pas.
      const conv = data.data ?? data;
      setMessages(Array.isArray(conv) ? conv : conv.messages ?? []);
    } catch { /* rafraîchi au prochain tick */ }
  }, [conversationId]);
  usePolling(load, 5000);

  const send = async (text) => {
    setSending(true);
    try {
      let id = conversationId;
      if (!id) {
        const { data } = await startConversation();
        id = (data.data ?? data).id_conversation;
        setConversationId(id);
      }
      await sendMessage(id, text);
      await load();
    } catch (e) {
      toastError(apiErrorMessage(e, "Message non envoyé."));
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Messagerie"
        title="Discuter avec la réception"
        subtitle="Une question sur une réservation, un tarif, un justificatif ? Écrivez-nous ici."
      />
      <ChatWindow
        messages={messages}
        onSend={send}
        sending={sending}
        isOwn={(m) => m.expediteur === "client"}
      />
    </>
  );
}
