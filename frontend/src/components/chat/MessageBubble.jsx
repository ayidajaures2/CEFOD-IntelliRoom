import { formatTime } from "../../utils/formatDate";

/**
 * Bulle de message. `own` = message envoyé par l'utilisateur courant.
 * `expediteur` ∈ client | receptionniste | caissier | admin | chatbot.
 */
export default function MessageBubble({ message, own }) {
  return (
    <div className={`flex ${own ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
          own
            ? "rounded-br-sm bg-ink text-paper"
            : message.expediteur === "chatbot"
              ? "rounded-bl-sm border border-accent/30 bg-accent-soft text-ink"
              : "rounded-bl-sm border border-ink/10 bg-paper text-ink"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.contenu_mess ?? message.contenu}</p>
        <p className={`mt-1 text-right text-[10px] ${own ? "text-paper/50" : "text-ink/40"}`}>
          {formatTime(message.date_envoi)}
        </p>
      </div>
    </div>
  );
}
