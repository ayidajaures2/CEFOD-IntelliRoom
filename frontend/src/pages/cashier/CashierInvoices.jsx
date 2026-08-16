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
import { MODE_PAIEMENT_LABELS } from "../../utils/constants";
import { LuEye } from "react-icons/lu";

/**
 * Consultation des factures émises (caissier) — lecture seule.
 * ⚠ Pas de bouton téléchargement : InvoiceController::canDownload() exclut
 * le caissier (seuls admin/comptabilité téléchargent, plus le client pour
 * les siennes).
 */
export default function CashierInvoices() {
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
    const hay = `${f.numero_facture} ${client?.nom ?? ""} ${client?.prenom ?? ""} ${f.paiement?.mode_paiement ?? ""}`.toLowerCase();
    return hay.includes(search.toLowerCase());
  });

  return (
    <>
      <PageHeader
        eyebrow="Caisse"
        title="Factures"
        subtitle="Consultation seule. Le téléchargement est réservé à l'administration et à la comptabilité."
      />
      <input
        className="field mb-4 max-w-sm"
        placeholder="Rechercher (n°, client ou mode)…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Rechercher une facture"
      />
      {loading && <Loader />}
      {!loading && filtered.length === 0 && <EmptyState title="Aucune facture" hint="Les factures apparaissent ici après validation d'un paiement." />}
      {filtered.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>N°</th>
                <th>Client</th>
                <th>Émise le</th>
                <th>Montant</th>
                <th>Mode</th>
                <th className="text-right">Aperçu</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => {
                const client = f.paiement?.reservation?.client;
                const modePaiement = f.paiement?.mode_paiement;
                return (
                  <tr key={f.id_facture}>
                    <td className="font-mono font-medium">{f.numero_facture}</td>
                    <td>{client ? `${client.prenom} ${client.nom}` : "—"}</td>
                    <td>{formatDate(f.date_emission)}</td>
                    <td>{formatMoney(f.paiement?.montant)}</td>
                    <td className="text-ink/60">{MODE_PAIEMENT_LABELS[modePaiement] ?? modePaiement ?? "—"}</td>
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