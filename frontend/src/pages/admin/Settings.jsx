import PageHeader from "../../components/common/PageHeader";
import ProfileForm from "../../components/forms/ProfileForm";
import { POLLING_INTERVAL } from "../../utils/constants";

export default function Settings() {
  return (
    <>
      <PageHeader eyebrow="Administration" title="Paramètres" subtitle="Compte administrateur et configuration de l'application." />

      <div className="card mb-6 p-5">
        <h2 className="font-display text-lg font-bold">Configuration technique</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink/55">URL de l'API</dt>
            <dd className="font-mono">{import.meta.env.VITE_API_URL || "http://localhost:8000/api"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink/55">Intervalle du temps réel</dt>
            <dd className="font-mono">{POLLING_INTERVAL} ms</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-ink/45">
          Ces valeurs se modifient dans le fichier <code className="rounded bg-ink/5 px-1">.env</code> du frontend, puis en relançant <code className="rounded bg-ink/5 px-1">npm run dev</code>.
        </p>
      </div>

      <ProfileForm />
    </>
  );
}
