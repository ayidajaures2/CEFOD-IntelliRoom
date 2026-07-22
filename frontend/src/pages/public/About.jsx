import { Link } from "react-router-dom";

/**
 * Page publique « À propos du CEFOD ».
 * Contenu tiré du site officiel cefod-tchad.org (vérifié).
 */
export default function About() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <header className="mb-10 text-center">
        <img
          src="/cefod-logo.jpeg"
          alt="Logo CEFOD"
          className="mx-auto mb-6 h-24 w-24 rounded-2xl object-cover shadow-soft"
        />
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">À propos</p>
        <h1 className="mt-1 font-display text-3xl font-black sm:text-4xl">
          Le CEFOD
        </h1>
        <p className="mt-2 text-ink/60">
          Centre d'Étude et de Formation pour le Développement
        </p>
      </header>

      <section className="card p-6 sm:p-8">
        <p className="leading-relaxed text-ink/80">
          Créé en <strong>1967</strong> et reconnu d'utilité publique, le CEFOD est l'une
          des grandes institutions intellectuelles et professionnelles du Tchad, basée à
          N'Djamena. Il œuvre pour une société juste, démocratique et prospère, où chaque
          citoyen est éduqué, impliqué et bénéficie d'un accès équitable aux services
          essentiels.
        </p>

        <h2 className="mt-8 font-display text-xl font-bold">Nos départements</h2>
        <p className="mt-2 leading-relaxed text-ink/80">
          À travers ses quatre départements — le Pôle Universitaire (dont la CEFOD Business
          School), le Pôle Social, la Communication &amp; Médias, et l'Administration —
          l'institution forme, informe, documente et accompagne les acteurs publics, privés
          et associatifs.
        </p>

        <h2 className="mt-8 font-display text-xl font-bold">Nos services</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {[
            "Formations certifiantes et diplômantes",
            "L'une des plus riches bibliothèques du Tchad",
            "Radio CEFOD",
            "Revue Tchad & Culture",
            "Centre d'agroécologie",
            "Location de salles de réunion modernes et équipées",
          ].map((s) => (
            <li key={s} className="flex items-start gap-2 rounded-xl bg-accent-soft px-3 py-2 text-sm text-ink/80">
              <span className="mt-0.5 text-accent">◆</span> {s}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-ink/60">
          Cette application gère précisément le service de <strong>location des salles</strong> du CEFOD.
        </p>

        <h2 className="mt-8 font-display text-xl font-bold">Nos valeurs</h2>
        <p className="mt-2 leading-relaxed text-ink/80">
          Justice, paix, respect des différences, dialogue, équité, compétence, créativité,
          excellence et participation active.
        </p>

        <div className="mt-8 border-t border-ink/10 pt-6 text-sm text-ink/70">
          <p>📍 BP 907, N'Djamena – Tchad</p>
          <p>✉ contact@cefod-tchad.org</p>
          <p>☎ +235 65 59 17 08</p>
          <p>
            🌐{" "}
            <a href="https://cefod-tchad.org/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              cefod-tchad.org
            </a>
          </p>
        </div>
      </section>

      <div className="mt-8 text-center">
        <Link to="/salles" className="btn-primary">Voir les salles disponibles</Link>
      </div>
    </div>
  );
}