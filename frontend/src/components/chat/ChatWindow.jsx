import { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";

/**
 * Fenêtre de discussion générique, utilisée par le chatbot FAQ
 * et par la messagerie humaine client ↔ réceptionniste.
 */
export default function ChatWindow({ messages, onSend, isOwn, placeholder = "Écrire un message…", sending = false, header = null }) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const submit = () => {
    const text = draft.trim();
    if (!text || sending) return;
    onSend(text);
    setDraft("");
  };

  return (
    <div className="card flex h-[65vh] flex-col overflow-hidden">
      {header}
      <div className="flex-1 space-y-3 overflow-y-auto bg-ink/[0.02] p-4">
        {messages.length === 0 && (
          <p className="pt-10 text-center text-sm text-ink/40">Aucun message pour l'instant. Écrivez le premier.</p>
        )}
        {messages.map((m, i) => (
          <MessageBubble key={m.id_message ?? i} message={m} own={isOwn(m)} />
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 border-t border-ink/10 p-3">
        <input
          className="field"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={placeholder}
          aria-label="Message"
        />
        <button onClick={submit} disabled={sending || !draft.trim()} className="btn-primary shrink-0">
          Envoyer
        </button>
      </div>
    </div>
  );
}
