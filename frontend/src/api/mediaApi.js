import api from "./client";
import { ENDPOINTS } from "./endpoints";

/** Envoie un fichier en multipart/form-data (Axios met le bon Content-Type). */
const upload = (url, field, file) => {
  const form = new FormData();
  form.append(field, file);
  return api.post(url, form, { headers: { "Content-Type": "multipart/form-data" } });
};

// Avatar utilisateur
export const uploadAvatar = (file) => upload(ENDPOINTS.profile.photo, "photo", file);
export const deleteAvatar = () => api.delete(ENDPOINTS.profile.photo);

// Photo de salle (admin)
export const uploadRoomImage = (id, file) => upload(ENDPOINTS.rooms.image(id), "image", file);
export const deleteRoomImage = (id) => api.delete(ENDPOINTS.rooms.image(id));
