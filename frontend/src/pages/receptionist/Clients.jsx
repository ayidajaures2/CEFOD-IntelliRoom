import { useEffect, useState } from "react";
import { fetchClients } from "../../api/receptionistApi";
import { extractList } from "../../utils/extract";
import { useNotify } from "../../contexts/NotificationContext";
import PageHeader from "../../components/common/PageHeader";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import { CATEGORIE_CLIENT_LABELS } from "../../utils/constants";
import { formatDate } from "../../utils/formatDate";

/** Consultation des comptes clients (réception, lecture seule — voir userApi.js pour la gestion admin). */
export default function Clients() {
  const { error: toastError } = useNotify();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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
              <tr><th>Nom</th><th>E-mail</th><th>Téléphone</th><th>Catégorie tarifaire</th><th>Inscrit le</th></tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id_utilisateur}>
                  <td className="font-medium">{c.prenom} {c.nom}</td>
                  <td className="text-ink/60">{c.email}</td>
                  <td className="text-ink/60">{c.telephone ?? "—"}</td>
                  <td className="text-ink/60">{CATEGORIE_CLIENT_LABELS[c.categorie_client] ?? "—"}</td>
                  <td className="text-ink/60">{formatDate(c.date_creation)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}