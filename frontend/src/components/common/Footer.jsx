import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm">
          <p className="font-display text-lg font-bold">CEFOD <span className="text-accent">IntelliRoom</span></p>
          <p className="mt-2 text-sm text-ink/55">
            Réservation de salles du CEFOD, disponibilités en temps réel et assistant d'orientation. N'Djaména, Tchad.
          </p>
        </div>
        <nav aria-label="Liens du pied de page" className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
          <Link className="text-ink/70 hover:text-accent" to="/salles">Catalogue des salles</Link>
          <Link className="text-ink/70 hover:text-accent" to="/affichage">Disponibilités</Link>
          <Link className="text-ink/70 hover:text-accent" to="/chatbot">Assistant</Link>
          <Link className="text-ink/70 hover:text-accent" to="/register">Créer un compte</Link>
        </nav>
      </div>
      <div className="border-t border-ink/5 py-4 text-center text-xs text-ink/40">
        © {new Date().getFullYear()} CEFOD — Application de gestion des réservations de salles.
      </div>
    </footer>
  );
}
