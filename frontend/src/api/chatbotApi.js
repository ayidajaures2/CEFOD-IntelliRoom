import api from "./client";
import { ENDPOINTS } from "./endpoints";

/** Chatbot FAQ — utilisable sans authentification (orientation des visiteurs). */
export const fetchFaq = () => api.get(ENDPOINTS.chatbot.faq);
export const sendChatbotMessage = (message, conversationId = null) =>
  api.post(ENDPOINTS.chatbot.ask, { message, id_conversation: conversationId });
