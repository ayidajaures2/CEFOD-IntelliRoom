import api from "./client";
import { ENDPOINTS } from "./endpoints";

// Caisse — espèces UNIQUEMENT, référence obligatoire (voir store() backend)
export const fetchPendingPayments = () => api.get(ENDPOINTS.payments.list);
export const recordPayment = (payload) => api.post(ENDPOINTS.payments.store, payload);
export const cancelPayment = (id) => api.put(ENDPOINTS.payments.cancel(id));
export const fetchPaymentHistory = () => api.get(ENDPOINTS.payments.history);

// Comptabilité — enregistre chèque/virement elle-même, valide TOUS les
// paiements manuels (espèces encaissées par le caissier comprises)
export const fetchAccountingPayments = (params) => api.get(ENDPOINTS.payments.accountingList, { params });
export const recordManualPayment = (payload) => api.post(ENDPOINTS.payments.storeManual, payload);
export const validatePayment = (id) => api.put(ENDPOINTS.payments.validate(id));
export const cancelAccountingPayment = (id) => api.put(ENDPOINTS.payments.accountingCancel(id));
export const fetchAccountingHistory = () => api.get(ENDPOINTS.payments.accountingHistory);

// Client — paiement en ligne (Moov / Airtel)
export const initiateOnlinePayment = (payload) => api.post(ENDPOINTS.payments.initiate, payload);
export const simulatePayment = (payload) => api.post(ENDPOINTS.payments.simulate, payload);
export const checkPaymentStatus = (tx) => api.get(ENDPOINTS.payments.status(tx));