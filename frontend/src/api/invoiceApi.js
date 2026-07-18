import api from "./client";
import { ENDPOINTS, rolePrefix } from "./endpoints";

export const fetchInvoices = () => api.get(ENDPOINTS.invoices.list());

/**
 * Détail d'une facture : seul l'admin dispose d'une route show ;
 * pour le client on retrouve la facture dans sa propre liste.
 */
export const fetchInvoice = async (id) => {
  if (rolePrefix() === "/admin") return api.get(ENDPOINTS.invoices.adminDetail(id));
  const { data } = await api.get(ENDPOINTS.invoices.list());
  const list = Array.isArray(data) ? data : data.data ?? [];
  const found = list.find((f) => String(f.id_facture ?? f.id) === String(id));
  return { data: found ?? null };
};

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
