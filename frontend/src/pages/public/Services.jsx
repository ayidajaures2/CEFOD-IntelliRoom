import { useEffect, useState } from "react";
import { fetchServices } from "../../api/serviceApi";
import { extractList } from "../../utils/extract";
import { formatMoney } from "../../utils/formatMoney";
import { CATEGORIES_CLIENT } from "../../utils/constants";
import PageHeader from "../../components/common/PageHeader";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import { LuProjector, LuVolume2, LuCoffee, LuUtensils, LuRadio, LuPackage } from "react-icons/lu";

const UNITE_LABELS = { jour: "/ jour", heure: "/ heure", personne: "/ personne" };

const ICONS = {
  "Vidéoprojecteur": LuProjector,
  "Sonorisation": LuVolume2,
  "Pause-café matin": LuCoffee,
  "Pause-café après-midi": LuCoffee,
  "Pause-déjeuner": LuUtensils,
  "Retransmission radio": LuRadio,
};

/**
 * Catalogue public des services annexes (vidéoprojecteur, sonorisation,
 * restauration, retransmission radio...) — consultable sans compte, comme
 * le catalogue des salles. La retransmission radio y figure normalement :
 * ce n'est que dans le formulaire de réservation qu'elle est exclue de la
 * liste cochable (voir BookingForm.jsx).
 */
export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchServices()
      .then(({ data }) => setServices(extractList(data)))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageHeader
        eyebrow="Catalogue"
        title="Services annexes"
        subtitle="À ajouter à votre réservation de salle : équipement, sonorisation, restauration."
      />

      {loading && <Loader />}
      {error && !loading && (
        <EmptyState title="Impossible de charger les services" hint="Vérifiez que le serveur est démarré, puis réessayez." />
      )}
      {!loading && !error && services.length === 0 && (
        <EmptyState title="Aucun service disponible pour le moment" />
      )}

      {services.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => {
            const Icon = ICONS[s.nom] ?? LuPackage;
            const tarifs = s.tarifs ?? [];
            const tarifUnique = tarifs.find((t) => t.categorie_client === null);

            return (
              <article key={s.id_service} className="card flex flex-col hover:border-accent p-5">
                <span className="stat-icon mb-3 self-start">
                  <Icon className="h-6 w-6" strokeWidth={2} />
                </span>
                <h2 className="font-display text-lg font-bold">{s.nom}</h2>
                {s.description && (
                  <p className="mt-1.5 flex-1 text-sm text-ink/60">{s.description}</p>
                )}

                <div className="mt-4 border-t border-ink/5 pt-3">
                  {tarifUnique ? (
                    <p className="font-display text-xl font-black text-accent-dark">
                      {formatMoney(tarifUnique.prix)}
                      <span className="ml-1 text-sm font-medium text-ink/45">{UNITE_LABELS[s.unite]}</span>
                    </p>
                  ) : tarifs.length > 0 ? (
                    <ul className="space-y-1 text-sm">
                      {tarifs.map((t) => (
                        <li key={t.id_tarif_service} className="flex items-center justify-between">
                          <span className="text-ink/60">
                            {CATEGORIES_CLIENT.find((c) => c.value === t.categorie_client)?.label ?? t.categorie_client}
                          </span>
                          <span className="font-semibold">
                            {formatMoney(t.prix)} <span className="text-xs font-normal text-ink/45">{UNITE_LABELS[s.unite]}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-ink/45">Tarif communiqué à la réservation.</p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="mt-8 text-center text-sm text-ink/50">
        Ces services s'ajoutent à votre réservation de salle depuis votre espace client, au moment de la demande.
      </p>
    </div>
  );
}