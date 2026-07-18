import api from "./client";
import { ENDPOINTS } from "./endpoints";

/** Messagerie client ↔ réception (ChatbotController, auth:sanctum). */
export const fetchConversations = () => api.get(ENDPOINTS.chatbot.conversations);
export const startConversation = () => api.post(ENDPOINTS.chatbot.start);
export const fetchMessages = (id) => api.get(ENDPOINTS.chatbot.messages(id));
export const sendMessage = (id, contenu) =>
  api.post(ENDPOINTS.chatbot.send, {
    id_conversation: id,
    contenu_mess: contenu,
    message: contenu, // clé alternative acceptée selon l'implémentation du contrôleur
  });
export const closeConversation = (id) => api.delete(ENDPOINTS.chatbot.destroy(id));
