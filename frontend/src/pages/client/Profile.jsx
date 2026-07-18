import PageHeader from "../../components/common/PageHeader";
import ProfileForm from "../../components/forms/ProfileForm";

export default function ClientProfile() {
  return (
    <>
      <PageHeader eyebrow="Compte" title="Mon profil" />
      <ProfileForm />
    </>
  );
}
