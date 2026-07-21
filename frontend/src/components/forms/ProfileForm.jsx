import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNotify } from "../../contexts/NotificationContext";
import { updateProfile, updatePassword } from "../../api/authApi";
import { uploadAvatar, deleteAvatar } from "../../api/mediaApi";
import ImageUploader from "../common/ImageUploader";
import { CATEGORIE_CLIENT_LABELS, ROLE_LABELS } from "../../utils/constants";
import { apiErrorMessage } from "../../utils/apiError";

/**
 * Profil partagé (client & admin). La `categorie_client` est affichée en
 * lecture seule : seul l'administrateur peut la corriger (CLAUDE.md §3).
 */
export default function ProfileForm() {
  const { user, refreshUser } = useAuth();
  const { success, error: toastError } = useNotify();
  const [form, setForm] = useState({
    nom: user?.nom ?? "",
    prenom: user?.prenom ?? "",
    email: user?.email ?? "",
    telephone: user?.telephone ?? "",
  });
  const [pwd, setPwd] = useState({ current_password: "", password: "", password_confirmation: "" });
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  const set = (setter) => (k) => (e) => setter((f) => ({ ...f, [k]: e.target.value }));
  const setInfo = set(setForm);
  const setPass = set(setPwd);

  const saveInfo = async () => {
    setSavingInfo(true);
    try {
      await updateProfile(form);
      await refreshUser();
      success("Profil mis à jour.");
    } catch (e) {
      toastError(apiErrorMessage(e, "Mise à jour impossible."));
    } finally {
      setSavingInfo(false);
    }
  };

  const savePwd = async () => {
    setSavingPwd(true);
    try {
      await updatePassword(pwd);
      setPwd({ current_password: "", password: "", password_confirmation: "" });
      success("Mot de passe modifié.");
    } catch (e) {
      toastError(apiErrorMessage(e, "Changement de mot de passe impossible."));
    } finally {
      setSavingPwd(false);
    }
  };

  const changeAvatar = async (file) => {
    try {
      await uploadAvatar(file);
      await refreshUser();
      success("Photo de profil mise à jour.");
    } catch (e) {
      toastError(apiErrorMessage(e, "Envoi de la photo impossible."));
    }
  };

  const removeAvatar = async () => {
    try {
      await deleteAvatar();
      await refreshUser();
      success("Photo de profil retirée.");
    } catch (e) {
      toastError(apiErrorMessage(e, "Suppression impossible."));
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="card space-y-4 p-6 lg:col-span-2">
        <h2 className="font-display text-lg font-bold">Photo de profil</h2>
        <ImageUploader
          shape="circle"
          label="Votre avatar"
          hint="JPG, PNG ou WebP — 2 Mo max"
          currentUrl={user?.photo_url}
          onUpload={changeAvatar}
          onDelete={user?.photo_url ? removeAvatar : undefined}
        />
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="font-display text-lg font-bold">Informations personnelles</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="p-nom">Nom</label>
            <input id="p-nom" className="field" value={form.nom} onChange={setInfo("nom")} />
          </div>
          <div>
            <label className="field-label" htmlFor="p-prenom">Prénom</label>
            <input id="p-prenom" className="field" value={form.prenom} onChange={setInfo("prenom")} />
          </div>
        </div>
        <div>
          <label className="field-label" htmlFor="p-email">Adresse e-mail</label>
          <input id="p-email" type="email" className="field" value={form.email} onChange={setInfo("email")} />
        </div>
        <div>
          <label className="field-label" htmlFor="p-tel">Téléphone</label>
          <input id="p-tel" type="tel" className="field" value={form.telephone} onChange={setInfo("telephone")} />
        </div>
        <div className="rounded-xl bg-ink/[0.03] p-4 text-sm">
          <p><span className="text-ink/55">Rôle :</span> <strong>{ROLE_LABELS[user?.role] ?? user?.role}</strong></p>
          {user?.categorie_client && (
            <p className="mt-1">
              <span className="text-ink/55">Catégorie tarifaire :</span>{" "}
              <strong>{CATEGORIE_CLIENT_LABELS[user.categorie_client]}</strong>
              <span className="block pt-1 text-xs text-ink/45">
                Modifiable uniquement par l'administration, sur présentation d'un justificatif.
              </span>
            </p>
          )}
        </div>
        <button className="btn-primary" onClick={saveInfo} disabled={savingInfo}>
          {savingInfo ? "Enregistrement…" : "Enregistrer les modifications"}
        </button>
      </section>

      <section className="card h-fit space-y-4 p-6">
        <h2 className="font-display text-lg font-bold">Mot de passe</h2>
        <div>
          <label className="field-label" htmlFor="pw-cur">Mot de passe actuel</label>
          <input id="pw-cur" type="password" className="field" value={pwd.current_password} onChange={setPass("current_password")} autoComplete="current-password" />
        </div>
        <div>
          <label className="field-label" htmlFor="pw-new">Nouveau mot de passe</label>
          <input id="pw-new" type="password" className="field" value={pwd.password} onChange={setPass("password")} autoComplete="new-password" />
        </div>
        <div>
          <label className="field-label" htmlFor="pw-conf">Confirmation</label>
          <input id="pw-conf" type="password" className="field" value={pwd.password_confirmation} onChange={setPass("password_confirmation")} autoComplete="new-password" />
        </div>
        <button
          className="btn-dark"
          onClick={savePwd}
          disabled={savingPwd || !pwd.current_password || pwd.password.length < 8 || pwd.password !== pwd.password_confirmation}
        >
          {savingPwd ? "Modification…" : "Changer le mot de passe"}
        </button>
      </section>
    </div>
  );
}
