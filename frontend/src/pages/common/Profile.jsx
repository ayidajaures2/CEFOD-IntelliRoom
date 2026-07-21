import PageHeader from "../../components/common/PageHeader";
import ProfileForm from "../../components/forms/ProfileForm";

/**
 * Page « Mon profil » commune à tous les rôles (client, réception,
 * caisse, admin). ProfileForm gère l'avatar, les infos et le mot de passe ;
 * la catégorie tarifaire n'est modifiable que par l'admin (règle métier).
 */
export default function Profile() {
  return (
    <>
      <PageHeader eyebrow="Compte" title="Mon profil" />
      <ProfileForm />
    </>
  );
}
