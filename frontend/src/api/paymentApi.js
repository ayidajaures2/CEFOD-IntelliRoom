import api from "./client";
import { ENDPOINTS } from "./endpoints";

// Caisse
export const fetchPendingPayments = () => api.get(ENDPOINTS.payments.list);
export const recordPayment = (payload) => api.post(ENDPOINTS.payments.store, payload);
export const validatePayment = (id) => api.put(ENDPOINTS.payments.validate(id));
export const cancelPayment = (id) => api.put(ENDPOINTS.payments.cancel(id));
export const fetchPaymentHistory = () => api.get(ENDPOINTS.payments.history);

// Client — paiement en ligne (Moov / Airtel)
export const initiateOnlinePayment = (payload) => api.post(ENDPOINTS.payments.initiate, payload);
export const checkPaymentStatus = (tx) => api.get(ENDPOINTS.payments.status(tx));
