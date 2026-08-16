import { useEffect, useState } from "react";
import { fetchInvoices } from "../../api/invoiceApi";
import { extractList } from "../../utils/extract";
import { useNotify } from "../../contexts/NotificationContext";
import PageHeader from "../../components/common/PageHeader";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import InvoicePreviewModal from "../../components/common/InvoicePreviewModal";
import { formatDate } from "../../utils/formatDate";
import { formatMoney } from "../../utils/formatMoney";
import { LuEye } from "react-icons/lu";

/**
 * Consultation des factures émises (réception) — lecture seule.
 *Pas de bouton téléchargement ici : InvoiceController::canDownload()
 * exclut la réceptionniste (seuls admin/comptabilité téléchargent, plus le
 * client pour les siennes). L'exposer renverrait un 403 systématique.
 */
export default function ReceptionistInvoices() {
  const { error: toastError } = useNotify();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [previewId, setPreviewId] = useState(null);

  useEffect(() => {
    fetchInvoices()
      .then(({ data }) => setInvoices(extractList(data)))
      .catch(() => toastError("Impossible de charger les factures."))
      .finally(() => setLoading(false));
  }, [toastError]);

  const filtered = invoices.filter((f) => {
    if (!search) return true;
    const client = f.paiement?.reservation?.client;
    const hay = `${f.numero_facture} ${client?.nom ?? ""} ${client?.prenom ?? ""}`.toLowerCase();
    return hay.includes(search.toLowerCase());
  });

  return (
    <>
      <PageHeader
        eyebrow="Réception"
        title="Factures"
        subtitle="Consultation seule. Le téléchargement est réservé à l'administration et à la comptabilité."
      />
      <input
        className="field mb-4 max-w-sm"
        placeholder="Rechercher (n° ou client)…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Rechercher une facture"
      />
      {loading && <Loader />}
      {!loading && filtered.length === 0 && <EmptyState title="Aucune facture" />}
      {filtered.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr><th>N°</th><th>Client</th><th>Émise le</th><th>Montant</th><th>Mode</th><th className="text-right">Aperçu</th></tr>
            </thead>
            <tbody>
              {filtered.map((f) => {
                const client = f.paiement?.reservation?.client;
                return (
                  <tr key={f.id_facture}>
                    <td className="font-mono font-medium">{f.numero_facture}</td>
                    <td>{client ? `${client.prenom} ${client.nom}` : "—"}</td>
                    <td>{formatDate(f.date_emission)}</td>
                    <td>{formatMoney(f.paiement?.montant)}</td>
                    <td className="text-ink/60">{f.paiement?.mode_paiement ?? "—"}</td>
                    <td className="text-right">
                      <button
                        onClick={() => setPreviewId(f.id_facture)}
                        className="btn-outline px-2.5 py-1.5 text-xs"
                        title="Aperçu"
                      >
                        <LuEye size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <InvoicePreviewModal invoiceId={previewId} onClose={() => setPreviewId(null)} />
    </>
  );
}