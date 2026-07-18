import { ROLES } from "./constants";

/** Page d'accueil de chaque rôle après connexion. */
export const homePathForRole = (role) => {
  switch (role) {
    case ROLES.ADMIN: return "/admin";
    case ROLES.RECEPTIONNISTE: return "/reception";
    case ROLES.CAISSIER: return "/caisse";
    case ROLES.CLIENT: return "/client";
    default: return "/";
  }
};

export const isStaff = (role) =>
  [ROLES.ADMIN, ROLES.RECEPTIONNISTE, ROLES.CAISSIER].includes(role);
