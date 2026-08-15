/**
 * Construit un lien wa.me à partir d'un numéro de téléphone.
 * Indicatif Tchad (+235) ajouté automatiquement si absent — les numéros
 * en base sont généralement saisis en format local (8 chiffres).
 */
export function whatsappLink(telephone) {
  if (!telephone) return null;
  const digits = String(telephone).replace(/\D/g, "");
  const withCountryCode = digits.startsWith("235") ? digits : `235${digits}`;
  return `https://wa.me/${withCountryCode}`;
}