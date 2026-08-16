import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchClients } from "../../api/receptionistApi";
import { fetchConversations, startConversationForClient } from "../../api/conversationApi";
import { extractList } from "../../utils/extract";
import { useNotify } from "../../contexts/NotificationContext";
import PageHeader from "../../components/common/PageHeader";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import { CATEGORIE_CLIENT_LABELS, SOUS_CATEGORIE_CLIENT_LABELS } from "../../utils/constants";
import { formatDate } from "../../utils/formatDate";
import { whatsappLink } from "../../utils/whatsapp";
import { apiErrorMessage } from "../../utils/apiError";
import { LuMessageSquare, LuPhone } from "react-icons/lu";

/** Consultation des comptes clients (réception, lecture seule — voir userApi.js pour la gestion admin). */
export default function Clients() {
  const navigate = useNavigate();
  const { error: toastError } = useNotify();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [contactingId, setContactingId] = useState(null);

  useEffect(() => {
    fetchClients()
      .then(({ data }) => setClients(extractList(data)))
      .catch(() => toastError("Impossible de charger les clients."))
      .finally(() => setLoading(false));
  }, [toastError]);

  const filtered = clients.filter((c) => {
    if (!search) return true;
    const hay = `${c.nom} ${c.prenom} ${c.email} ${c.telephone ?? ""}`.toLowerCase();
    return hay.includes(search.toLowerCase());
  });

  /**
   * Ouvre la conversation existante du client si elle existe déjà (recherche
   * dans la liste globale du personnel), sinon en crée une nouvelle — puis
   * redirige directement dedans. Pas de recherche/filtre intermédiaire :
   * un clic, on est dans la discussion.
   */
  const contact = async (client) => {
    setContactingId(client.id_utilisateur);
    try {
      const { data } = await fetchConversations();
      const list = Array.isArray(data) ? data : data.data ?? [];
      const existing = list.find((c) => c.utilisateur?.id_utilisateur === client.id_utilisateur);

      if (existing) {
        navigate(`/reception/conversations/${existing.id_conversation}`);
        return;
      }

      const { data: created } = await startConversationForClient(client.id_utilisateur);
      navigate(`/reception/conversations/${created.id_conversation}`);
    } catch (e) {
      toastError(apiErrorMessage(e, "Impossible d'ouvrir la conversation."));
    } finally {
      setContactingId(null);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Réception"
        title="Clients"
        subtitle="Consultation des comptes clients. La catégorie tarifaire n'est modifiable que par l'administration."
      />
      <input
        className="field mb-4 max-w-sm"
        placeholder="Rechercher (nom, e-mail, téléphone)…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Rechercher un client"
      />
      {loading && <Loader />}
      {!loading && filtered.length === 0 && <EmptyState title="Aucun client" />}
      {filtered.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr><th>Nom</th><th>E-mail</th><th>Téléphone</th><th>Catégorie</th><th>Inscrit le</th><th className="text-right">Contact</th></tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id_utilisateur}>
                  <td className="font-medium">{c.prenom} {c.nom}</td>
                  <td className="text-ink/60">{c.email}</td>
                  <td className="text-ink/60">{c.telephone ?? "—"}</td>
                  <td className="text-ink/60">
                    {SOUS_CATEGORIE_CLIENT_LABELS[c.sous_categorie_client] ?? CATEGORIE_CLIENT_LABELS[c.categorie_client] ?? "—"}
                  </td>
                  <td className="text-ink/60">{formatDate(c.date_creation)}</td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => contact(c)}
                        disabled={contactingId === c.id_utilisateur}
                        className="btn-outline px-2.5 py-1.5 text-xs disabled:opacity-50"
                        title="Ouvrir ou créer la conversation avec ce client"
                      >
                        <LuMessageSquare size={14} />
                      </button>
                      {c.telephone && (
                        <a
                          href={whatsappLink(c.telephone)}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-outline px-2.5 py-1.5 text-xs"
                          title="Contacter sur WhatsApp"
                        >
                          <LuPhone size={14} />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}