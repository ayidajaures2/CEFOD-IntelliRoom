/**
 * Les contrôleurs renvoient tantôt un tableau brut, tantôt un paginator
 * Laravel ({ data: [...] }), tantôt un paginator ENVELOPPÉ
 * ({ data: { data: [...] }, stats/summary }). Cet utilitaire couvre les
 * trois cas — c'est lui qui corrige la page blanche du caissier
 * (« payments.filter is not a function »).
 */
export const extractList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};
