/** Extrait un message lisible d'une erreur Axios (validation Laravel incluse). */
export const apiErrorMessage = (error, fallback = "Une erreur est survenue.") => {
  const data = error?.response?.data;
  if (!data) return error?.message || fallback;
  if (data.errors) {
    const first = Object.values(data.errors).flat()[0];
    if (first) return first;
  }
  return data.message || fallback;
};
