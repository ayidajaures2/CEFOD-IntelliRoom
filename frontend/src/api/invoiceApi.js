import api from "./client";
import { ENDPOINTS } from "./endpoints";

export const fetchInvoices = () => api.get(ENDPOINTS.invoices.list());

/** Détail d'une facture (avec ses lignes) — même route pour tous les rôles ayant accès. */
export const fetchInvoice = (id) => api.get(ENDPOINTS.invoices.detail(id));

/** Télécharge le PDF DomPDF en conservant l'en-tête d'authentification. */
export const downloadInvoicePdf = async (id, numero) => {
  const { data } = await api.get(ENDPOINTS.invoices.download(id), { responseType: "blob" });
  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = `facture-${numero || id}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};

export const sendInvoiceByEmail = (id) => api.post(ENDPOINTS.invoices.sendEmail(id));