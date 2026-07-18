import { useMemo, useState } from "react";
import { useRooms } from "../../hooks/useRooms";
import RoomCard from "../../components/common/RoomCard";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import PageHeader from "../../components/common/PageHeader";

export default function Rooms() {
  const { rooms, loading, error, reload } = useRooms();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [minCapacity, setMinCapacity] = useState("");

  const types = useMemo(() => [...new Set(rooms.map((r) => r.type_salle).filter(Boolean))], [rooms]);

  const filtered = rooms.filter((r) => {
    const okSearch = !search || `${r.nom_salle} ${r.description}`.toLowerCase().includes(search.toLowerCase());
    const okType = !type || r.type_salle === type;
    const okCap = !minCapacity || Number(r.capacite) >= Number(minCapacity);
    return okSearch && okType && okCap;
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader
        eyebrow="Catalogue"
        title="Nos salles"
        subtitle="Consultable sans compte. Connectez-vous pour voir le tarif de votre catégorie."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <input className="field" placeholder="Rechercher une salle…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Rechercher" />
        <select className="field" value={type} onChange={(e) => setType(e.target.value)} aria-label="Type de salle">
          <option value="">Tous les types</option>
          {types.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <input className="field" type="number" min="1" placeholder="Capacité minimale" value={minCapacity} onChange={(e) => setMinCapacity(e.target.value)} aria-label="Capacité minimale" />
      </div>

      {loading && <Loader />}
      {error && !loading && (
        <EmptyState
          title="Impossible de charger les salles"
          hint="Vérifiez que le serveur est démarré, puis réessayez."
          action={<button className="btn-primary" onClick={reload}>Réessayer</button>}
        />
      )}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState title="Aucune salle ne correspond" hint="Élargissez vos filtres pour voir plus de résultats." />
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((room) => <RoomCard key={room.id_salle} room={room} />)}
      </div>
    </div>
  );
}
