import { Link } from "react-router-dom";
import { useCallback, useState } from "react";
import { usePolling } from "../../hooks/usePolling";
import { fetchOccupation } from "../../api/roomApi";
import { STATUT_SALLE_LABELS } from "../../utils/constants";

/**
 * Accueil public.
 * ▸ Colonne GAUCHE : identité CEFOD (logo mis en avant + baseline).
 * ▸ Colonne DROITE : tableau des salles en temps réel (polling 5 s),
 *   argument central du mémoire.
 */
export default function Home() {
  const [rooms, setRooms] = useState([]);

  const load = useCallback(async () => {
    try {
      const { data } = await fetchOccupation();
      setRooms(Array.isArray(data) ? data : data.data ?? []);
    } catch { /* le hero reste utilisable sans API */ }
  }, []);
  usePolling(load);

  const counts = rooms.reduce((acc, r) => {
    const s = r.statut_effectif ?? r.statut;
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      {/* ==================== Héros ==================== */}
      <section className="bg-surface text-ink">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-2 lg:items-center lg:py-24">

          {/* Colonne GAUCHE : logo + identité + boutons */}
          <div>
            <div className="mb-6 flex items-center gap-4">
              <div className="relative">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 -m-4 rounded-full bg-accent/15 blur-2xl"
                />
                <img
                  src="/cefod-logo.jpeg"
                  alt="Logo du CEFOD"
                  className="relative h-24 w-24 rounded-2xl shadow-2xl sm:h-28 sm:w-28"
                />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
                  CEFOD · N'Djaména
                </p>
                <p className="mt-1 text-sm text-ink/60">
                  Centre d'Étude et de Formation<br />pour le Développement
                </p>
              </div>
            </div>

            <h1 className="font-display text-4xl font-black leading-tight sm:text-5xl">
              La bonne salle,
              <br />au bon moment,
              <br /><span className="text-accent">sans conflit.</span>
            </h1>
            <p className="mt-5 max-w-md text-ink/70">
              Consultez les disponibilités en temps réel, réservez en ligne et suivez
              vos demandes jusqu'au paiement — fini les cahiers et les doubles réservations.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/salles" className="btn-primary px-6 py-3">Voir les salles</Link>
              <Link to="/chatbot" className="btn-outline px-6 py-3">
                Demander à l'assistant
              </Link>
            </div>
          </div>

          {/* Colonne DROITE : tableau vivant */}
          <div className="card border-ink/10 bg-ink/5 p-5 backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-display text-sm font-bold uppercase tracking-wider text-ink/80">État des salles</p>
              <span className="flex items-center gap-2 text-xs text-ink/60">
                <span className="h-2 w-2 animate-pulse rounded-full bg-accent" aria-hidden="true" />
                en direct
              </span>
            </div>
            {rooms.length === 0 ? (
              <p className="py-10 text-center text-sm text-ink/45">
                Connexion à l'affichage temps réel…
              </p>
            ) : (
              <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {rooms.map((r) => {
                  const s = r.statut_effectif ?? r.statut;
                  return (
                    <li
                      key={r.id_salle}
                      className={`rounded-xl p-3 ${
                        s === "occupee" ? "bg-accent text-paper"
                        : s === "reservee" ? "border border-accent/50 bg-transparent text-accent"
                        : "bg-paper text-ink"
                      }`}
                    >
                      <p className="truncate font-display text-sm font-bold">{r.nom_salle}</p>
                      <p className="text-xs opacity-70">{STATUT_SALLE_LABELS[s] ?? s}</p>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="mt-4 flex gap-4 text-xs text-ink/60">
              <span>{counts.libre ?? 0} libre(s)</span>
              <span>{counts.reservee ?? 0} réservée(s)</span>
              <span>{counts.occupee ?? 0} occupée(s)</span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== Comment ça marche ==================== */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-display text-2xl font-bold sm:text-3xl">Comment réserver ?</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Choisir", "Parcourez le catalogue : capacité, équipements et tarif selon votre catégorie."],
            ["Demander", "Envoyez votre demande de réservation avec les dates et le motif — sans payer."],
            ["Valider", "Le secrétariat général confirme la disponibilité ; vous voyez le prix final avant de payer."],
            ["Payer", "En espèces à la caisse, ou en ligne via Moov Money / Airtel Money. Facture PDF incluse."],
          ].map(([title, text], i) => (
            <article key={title} className="card p-5">
              <p className="font-display text-3xl font-black text-accent">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="mt-2 font-display text-lg font-bold">{title}</h3>
              <p className="mt-1.5 text-sm text-ink/60">{text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ==================== Bandeau affichage ==================== */}
      <section className="border-y border-ink/10 bg-accent-soft">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8">
          <div>
            <h2 className="font-display text-xl font-bold">Écran d'affichage temps réel</h2>
            <p className="text-sm text-ink/60">Pensé pour un écran à l'accueil : l'occupation de toutes les salles, actualisée toutes les 5 secondes.</p>
          </div>
          <Link to="/affichage" className="btn-dark">Ouvrir l'affichage</Link>
        </div>
      </section>
    </>
  );
}