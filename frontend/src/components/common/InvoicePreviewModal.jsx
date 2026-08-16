import { useEffect, useState } from "react";
import { fetchInvoice } from "../../api/invoiceApi";
import { formatMoney } from "../../utils/formatMoney";
import { formatDate } from "../../utils/formatDate";
import { MODE_PAIEMENT_LABELS, MODE_GENERATION_FACTURE_LABELS } from "../../utils/constants";
import StatutBadge from "./StatutBadge";
import Loader from "./Loader";

/**
 * Aperçu d'une facture (numéro, client, lignes, totaux) avant tout
 * téléchargement — décision actée : la consultation doit être possible
 * indépendamment du téléchargement, pour tous les rôles ayant accès aux
 * factures (client, réception, caisse, comptabilité, admin).
 *
 * `invoiceId` déclenche le chargement ; passer `null` pour fermer.
 */
export default function InvoicePreviewModal({ invoiceId, onClose, actions }) {
  const [facture, setFacture] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!invoiceId) {
      setFacture(null);
      return;
    }
    setLoading(true);
    fetchInvoice(invoiceId)
      .then(({ data }) => setFacture(data?.data ?? data))
      .catch(() => setFacture(null))
      .finally(() => setLoading(false));
  }, [invoiceId]);

  if (!invoiceId) return null;

  const paiement = facture?.paiement;
  const reservation = paiement?.reservation;
  const client = reservation?.client;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div className="card max-h-[85vh] w-full max-w-lg overflow-y-auto bg-surface p-6" onClick={(e) => e.stopPropagation()}>
        {loading && <Loader />}

        {!loading && !facture && (
          <p className="py-8 text-center text-sm text-ink/50">Facture introuvable ou inaccessible.</p>
        )}

        {!loading && facture && (
          <>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold">Facture {facture.numero_facture}</h2>
                <p className="text-sm text-ink/55">Émise le {formatDate(facture.date_emission)}</p>
              </div>
              <span className="rounded-full bg-ink/5 px-2.5 py-1 text-xs font-semibold text-ink/60">
                {MODE_GENERATION_FACTURE_LABELS[facture.mode_generation] ?? facture.mode_generation}
              </span>
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg bg-ink/[0.03] p-3 text-sm">
              <div>
                <dt className="text-xs text-ink/45">Client</dt>
                <dd className="font-medium">{client ? `${client.prenom} ${client.nom}` : "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink/45">Salle</dt>
                <dd className="font-medium">{reservation?.salle?.nom_salle ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink/45">Mode de paiement</dt>
                <dd>{MODE_PAIEMENT_LABELS[paiement?.mode_paiement] ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink/45">Statut du paiement</dt>
                <dd><StatutBadge statut={paiement?.statut} /></dd>
              </div>
            </dl>

            {facture.lignes?.length > 0 && (
              <table className="mt-4 w-full text-sm">
                <thead>
                  <tr className="border-b border-ink/10 text-left text-xs uppercase tracking-wide text-ink/45">
                    <th className="py-1.5 font-semibold">Description</th>
                    <th className="py-1.5 text-right font-semibold">Qté</th>
                    <th className="py-1.5 text-right font-semibold">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {facture.lignes.map((l) => (
                    <tr key={l.id_ligne} className="border-b border-ink/5 last:border-0">
                      <td className="py-1.5">{l.description}</td>
                      <td className="py-1.5 text-right text-ink/60">{l.quantite}</td>
                      <td className="py-1.5 text-right font-medium">{formatMoney(l.montant)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="mt-4 space-y-1.5 border-t border-ink/10 pt-3 text-sm">
              <p className="flex justify-between"><span className="text-ink/55">Net à payer</span><span>{formatMoney(facture.net_a_payer)}</span></p>
              {Number(facture.frais_livraison) > 0 && (
                <p className="flex justify-between"><span className="text-ink/55">Frais de livraison</span><span>{formatMoney(facture.frais_livraison)}</span></p>
              )}
              {Number(facture.taux_remise) > 0 && (
                <p className="flex justify-between"><span className="text-ink/55">Remise</span><span>{facture.taux_remise}%</span></p>
              )}
              <p className="flex justify-between border-t border-ink/10 pt-1.5 font-display text-lg font-bold">
                <span>Total TTC</span><span className="text-accent-dark">{formatMoney(facture.total_ttc)}</span>
              </p>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              {actions}
              <button className="btn-outline px-3 py-1.5 text-sm" onClick={onClose}>Fermer</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}