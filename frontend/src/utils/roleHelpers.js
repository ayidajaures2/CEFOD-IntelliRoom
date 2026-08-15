import { ROLES } from "./constants";

/** Page d'accueil de chaque rôle après connexion. */
export const homePathForRole = (role) => {
  switch (role) {
    case ROLES.ADMIN: return "/admin";
    case ROLES.SG: return "/sg";
    case ROLES.COMPTABILITE: return "/comptabilite";
    case ROLES.RECEPTIONNISTE: return "/reception";
    case ROLES.CAISSIER: return "/caisse";
    case ROLES.CLIENT: return "/client";
    default: return "/";
  }
};

export const isStaff = (role) =>
  [ROLES.ADMIN, ROLES.SG, ROLES.COMPTABILITE, ROLES.RECEPTIONNISTE, ROLES.CAISSIER].includes(role);