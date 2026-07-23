import { useEffect, useState } from "react";
import { fetchInvoices, downloadInvoicePdf } from "../../api/invoiceApi";
import { extractList } from "../../utils/extract";
import { useNotify } from "../../contexts/NotificationContext";
import PageHeader from "../../components/common/PageHeader";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import { formatDate } from "../../utils/formatDate";
import { formatMoney } from "../../utils/formatMoney";
import { MODE_PAIEMENT_LABELS } from "../../utils/constants";

/** ✅ AJOUT — Consultation des factures émises (caissier). */
export default function CashierInvoices() {
  const { error: toastError } = useNotify();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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
      <PageHeader eyebrow="Caisse" title="Factures" />
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
                <th className="text-right">PDF</th>
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
                        onClick={() => downloadInvoicePdf(f.id_facture, f.numero_facture).catch(() => toastError("Téléchargement impossible."))}
                        className="btn-dark px-3 py-1.5 text-xs"
                      >
                        Télécharger
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}