import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchInvoices, downloadInvoicePdf } from "../../api/invoiceApi";
import { useNotify } from "../../contexts/NotificationContext";
import PageHeader from "../../components/common/PageHeader";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import { formatDate } from "../../utils/formatDate";
import { formatMoney } from "../../utils/formatMoney";

export default function ClientInvoices() {
  const { error: toastError } = useNotify();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices()
      .then(({ data }) => setInvoices(Array.isArray(data) ? data : data.data ?? []))
      .catch(() => toastError("Impossible de charger vos factures."))
      .finally(() => setLoading(false));
  }, [toastError]);

  const download = async (f) => {
    try { await downloadInvoicePdf(f.id_facture, f.numero_facture); }
    catch { toastError("Le PDF n'a pas pu être téléchargé."); }
  };

  return (
    <>
      <PageHeader eyebrow="Facturation" title="Mes factures" subtitle="Une facture est émise pour chaque paiement validé." />
      {loading && <Loader />}
      {!loading && invoices.length === 0 && (
        <EmptyState title="Aucune facture" hint="Vos factures apparaîtront ici après votre premier paiement validé." />
      )}
      {invoices.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr><th>N°</th><th>Date d'émission</th><th>Montant</th><th className="text-right">Actions</th></tr>
            </thead>
            <tbody>
              {invoices.map((f) => (
                <tr key={f.id_facture}>
                  <td className="font-mono font-medium">{f.numero_facture}</td>
                  <td>{formatDate(f.date_emission)}</td>
                  <td>{formatMoney(f.paiement?.montant ?? f.montant)}</td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link to={`/client/factures/${f.id_facture}`} className="btn-outline px-3 py-1.5 text-xs">Détail</Link>
                      <button onClick={() => download(f)} className="btn-dark px-3 py-1.5 text-xs">PDF</button>
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
