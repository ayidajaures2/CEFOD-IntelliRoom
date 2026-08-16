import { useRef, useState } from "react";

/**
 * Conditions réelles de location et d'utilisation des salles du CEFOD
 * (document papier, mise à jour du 07/03/2025). Deux adaptations
 * volontaires par rapport au texte original, pour rester cohérent avec le
 * reste de l'app côté client :
 *   - Point 1 : ne nomme plus le Secrétaire Général (acteur interne jamais
 *     révélé au client, décision actée pour toute l'app).
 *   - Point 13 : horaires reformulés (7j/7 en ligne, cf. BusinessHours.php)
 *     plutôt que "fermé le dimanche" — sinon contradiction directe avec ce
 *     que le formulaire de réservation permet déjà de faire.
 * Le reste est repris tel quel, y compris les règles non techniquement
 * appliquées par le code (pénalité 15%, délai 24h, etc. — voir CLAUDE.md §12).
 */
const CONDITIONS = [
  "Aucune salle ne peut être occupée par un groupe sans une réservation dûment validée par le CEFOD. Seule cette validation marque l'accord du CEFOD pour cette occupation.",
  "Les réservations ne peuvent se faire le jour même de l'occupation des locaux. Un délai de 24 heures est un minimum pour permettre à l'organisation de trouver un autre local en cas de refus.",
  "Le CEFOD ne peut louer ses salles pour les manifestations politiques ou religieuses.",
  "Le CEFOD ne peut autoriser une réservation à un groupe qui a une facture antérieure impayée.",
  "Les organisations non gouvernementales, les entreprises et les petites organisations doivent obligatoirement régler leurs factures 48 heures à l'avance pour occuper la salle. En cas de dépassement, une facture complémentaire leur sera adressée. Si le paiement de l'avance n'est pas effectué dans le délai, la salle pourrait être attribuée à une autre organisation.",
  "Pour les organismes internationaux, un bon de commande dûment signé leur sera demandé.",
  "Le CEFOD décline toute responsabilité en cas de perte d'objets abandonnés dans la salle. De même, les engins volés ne peuvent en aucune façon engager la responsabilité du CEFOD.",
  "La réparation des dégâts éventuels causés par les participants lors de la rencontre (vitres ou tables cassées, détérioration d'appareils pour mauvais usage, objets emportés, mur sali et autres...) sera facturée à l'organisme qui a loué les salles.",
  "Les organisateurs des rencontres sont tenus d'être à l'heure pour orienter les participants. Pendant le week-end, des postes d'affichage seront disposés dans la cour pour indiquer les salles réservées et les noms des groupes.",
  "Toute modification apportée pendant le déroulement de la rencontre (demande de sonorisation, vidéoprojecteur, rétroprojecteur, modification d'horaire) sera notifiée par écrit par le demandeur à la coordinatrice des salles.",
  "En cas d'annulation ou de report de la réservation, l'organisateur est tenu d'en informer le CEFOD 48h à l'avance afin qu'il attribue la salle à d'autres demandeurs. Dans le cas contraire, et en dehors des cas de force majeure avérée, une pénalité de 15% de la valeur de la réservation lui sera appliquée.",
  "Les organisateurs des séminaires et ateliers sont tenus de concevoir des badges pour les participants. Pendant la pause, la porte de la salle occupée doit être fermée pour éviter toute intrusion.",
  "Les salles du CEFOD sont accessibles de 8h à 18h. Les demandes de réservation en ligne sont acceptées tous les jours de la semaine.",
  "Il est interdit de manger dans les salles, de faire des affiches au mur blanc avec du papier collant, de sortir les tables de travail sans autorisation.",
  "Les organisateurs de pause-café doivent s'acquitter de frais de participation à l'entretien du local et de l'espace, selon la taille de la salle occupée, à régler à la caisse du CEFOD.",
  "Les grandes tables destinées aux pauses-café et déjeuners doivent être nettoyées et rangées par le restaurateur après leur utilisation.",
  "Prévoyez les multiprises, rallonges et le papier pour chevalet nécessaires à votre activité.",
  "En cas de doute sur un des points de ces conditions, rapprochez-vous de la réception pour toute clarification.",
  "Les groupes qui désirent occuper l'espace du CEFOD pour une exposition doivent s'adresser à l'administration du CEFOD pour les modalités pratiques avant l'installation.",
  "En cas de coupure de courant, le CEFOD met en marche son groupe électrogène de 8h à 13h et de 14h à 18h (arrêt de 13h à 14h pour refroidissement).",
];

const RADIO_NOTE =
  "La Radio CEFOD est fonctionnelle et peut être louée pour des activités menées au CEFOD. Le coût de location est de 50 000 FCFA/h de retransmission directe.";

/**
 * Gate de consentement type "conditions d'utilisation d'appli mobile" :
 * l'utilisateur doit faire défiler jusqu'au bout du texte avant que la case
 * à cocher ne devienne cliquable. Se réinitialise à chaque montage du
 * composant — donc à chaque nouvelle demande de réservation, jamais
 * mémorisé d'une fois sur l'autre (comportement demandé explicitement).
 */
export default function TermsGate({ accepted, onAcceptedChange }) {
  const [open, setOpen] = useState(false);
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const scrollRef = useRef(null);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const reachedEnd = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
    if (reachedEnd) setHasScrolledToEnd(true);
  };

  const confirm = () => {
    onAcceptedChange(true);
    setOpen(false);
  };

  return (
    <div className="rounded-xl border border-ink/10 bg-ink/[0.02] p-4">
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={accepted}
          disabled
          className="mt-0.5 h-4 w-4 accent-accent"
        />
        <span>
          J'ai lu et j'accepte les{" "}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="font-semibold text-accent underline underline-offset-2 hover:text-accent-dark"
          >
            conditions de location et d'utilisation des salles du CEFOD
          </button>
          {accepted ? (
            <span className="ml-1.5 text-xs font-medium text-emerald-600">✓ Accepté</span>
          ) : (
            <span className="ml-1.5 text-xs text-ink/45">— obligatoire pour envoyer la demande</span>
          )}
        </span>
      </label>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-4" onClick={() => setOpen(false)}>
          <div
            className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-surface shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-ink/10 px-6 py-4">
              <h2 className="font-display text-lg font-bold">Conditions de location et d'utilisation des salles du CEFOD</h2>
              <p className="mt-0.5 text-xs text-ink/45">Mise à jour du 07 mars 2025 — faites défiler jusqu'au bout pour continuer</p>
            </div>

            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-6 py-4"
            >
              <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed text-ink/75">
                {CONDITIONS.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ol>
              <p className="mt-5 rounded-lg bg-accent-soft p-3 text-sm italic text-ink/70">{RADIO_NOTE}</p>
              <div className="h-1" /> {/* marge de détection de fin de défilement */}
            </div>

            <div className="border-t border-ink/10 px-6 py-4">
              {!hasScrolledToEnd && (
                <p className="mb-2 text-center text-xs text-ink/45">Continuez à faire défiler pour pouvoir accepter…</p>
              )}
              <div className="flex justify-end gap-2">
                <button type="button" className="btn-outline px-4 py-2 text-sm" onClick={() => setOpen(false)}>
                  Fermer
                </button>
                <button
                  type="button"
                  className="btn-primary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                  onClick={confirm}
                  disabled={!hasScrolledToEnd}
                >
                  J'ai lu, j'accepte
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}