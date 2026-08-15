import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchInvoice, downloadInvoicePdf } from "../../api/invoiceApi";
import { useNotify } from "../../contexts/NotificationContext";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import StatutBadge from "../../components/common/StatutBadge";
import { formatDate, formatDateTime } from "../../utils/formatDate";
import { formatMoney } from "../../utils/formatMoney";
import { MODE_PAIEMENT_LABELS } from "../../utils/constants";

export default function InvoiceDetail() {
  const { id } = useParams();
  const { error: toastError } = useNotify();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoice(id)
      .then(({ data }) => setInvoice(data.data ?? data))
      .catch(() => setInvoice(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader full />;
  if (!invoice) {
    return <EmptyState title="Facture introuvable" action={<Link to="/client/factures" className="btn-primary">Mes factures</Link>} />;
  }

  const paiement = invoice.paiement ?? {};
  const reservation = paiement.reservation ?? invoice.reservation ?? {};

  const download = async () => {
    try { await downloadInvoicePdf(invoice.id_facture, invoice.numero_facture); }
    catch { toastError("Le PDF n'a pas pu être téléchargé."); }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/client/factures" className="text-sm text-ink/55 hover:text-accent">← Mes factures</Link>
      <div className="card mt-4 overflow-hidden">
        <div className="flex items-center justify-between bg-ink px-6 py-5 text-paper">
          <div>
            <p className="text-xs uppercase tracking-widest text-paper/50">Facture</p>
            <p className="font-display text-2xl font-black">{invoice.numero_facture}</p>
          </div>
          <p className="text-sm text-paper/70">Émise le {formatDate(invoice.date_emission)}</p>
        </div>
        <dl className="space-y-3 px-6 py-5 text-sm">
          <div className="flex justify-between"><dt className="text-ink/55">Salle</dt><dd className="font-medium">{reservation.salle?.nom_salle ?? "—"}</dd></div>
          <div className="flex justify-between"><dt className="text-ink/55">Période</dt><dd>{formatDateTime(reservation.date_debut)} → {formatDateTime(reservation.date_fin)}</dd></div>
          <div className="flex justify-between"><dt className="text-ink/55">Moyen de paiement</dt><dd>{MODE_PAIEMENT_LABELS[paiement.mode_paiement] ?? "—"}</dd></div>
          <div className="flex justify-between"><dt className="text-ink/55">Référence</dt><dd className="font-mono">{paiement.reference ?? "—"}</dd></div>
          <div className="flex justify-between"><dt className="text-ink/55">Statut du paiement</dt><dd><StatutBadge statut={paiement.statut} /></dd></div>
        </dl>

        {invoice.lignes?.length > 0 && (
          <div className="border-t border-ink/5 px-6 py-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/45">Détail</p>
            <table className="w-full text-sm">
              <tbody>
                {invoice.lignes.map((l) => (
                  <tr key={l.id_ligne} className="border-b border-ink/5 last:border-0">
                    <td className="py-1.5 text-ink/70">
                      {l.description}{Number(l.quantite) > 1 ? ` × ${l.quantite}` : ""}
                    </td>
                    <td className="py-1.5 text-right font-medium">{formatMoney(l.montant)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-ink/10 px-6 py-4">
          <div className="flex justify-between font-display text-lg font-bold">
            <span>Total</span><span className="text-accent-dark">{formatMoney(invoice.total_ttc ?? paiement.montant)}</span>
          </div>
        </div>
        <div className="border-t border-ink/5 px-6 py-4">
          <button onClick={download} className="btn-dark w-full">Télécharger le PDF</button>
        </div>
      </div>
    </div>
  );
}