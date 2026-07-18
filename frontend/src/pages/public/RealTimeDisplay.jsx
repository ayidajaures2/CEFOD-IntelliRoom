import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchOccupation, fetchRooms } from "../../api/roomApi";
import { usePolling } from "../../hooks/usePolling";
import { POLLING_INTERVAL, STATUT_SALLE_LABELS } from "../../utils/constants";
import { extractList } from "../../utils/extract";

/**
 * Écran plein écran à projeter à l'accueil du CEFOD.
 * Polling toutes les 5 s ; repli sur /rooms si /rooms/occupation indisponible.
 */
const TILE = {
  libre: "bg-paper text-ink",
  reservee: "bg-paper text-ink ring-4 ring-inset ring-accent",
  occupee: "bg-accent text-paper rt-pulse",
};
const DOT = { libre: "bg-ink/25", reservee: "bg-accent", occupee: "bg-paper" };

export default function RealTimeDisplay() {
  const [rooms, setRooms] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [online, setOnline] = useState(true);
  const [clock, setClock] = useState(new Date());

  const load = useCallback(async () => {
    setClock(new Date());
    try {
      let list;
      try {
        const { data } = await fetchOccupation();
        list = extractList(data);
      } catch {
        const { data } = await fetchRooms(); // repli : catalogue complet
        list = extractList(data);
      }
      setRooms(list);
      setUpdatedAt(new Date());
      setOnline(true);
    } catch {
      setOnline(false);
    }
  }, []);
  usePolling(load, POLLING_INTERVAL);

  const counts = useMemo(() => {
    const c = { libre: 0, reservee: 0, occupee: 0 };
    rooms.forEach((r) => { c[r.statut_effectif ?? r.statut] = (c[r.statut_effectif ?? r.statut] ?? 0) + 1; });
    return c;
  }, [rooms]);

  const fmtTime = (d) => d?.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex min-h-screen flex-col bg-ink text-paper">
      {/* Bandeau haut */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-paper/10 px-6 py-4 sm:px-10">
        <Link to="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 grid-cols-2 gap-1 rounded-lg bg-paper/10 p-1.5">
            <span className="rounded-sm bg-paper" /><span className="rounded-sm bg-accent" />
            <span className="rounded-sm bg-accent" /><span className="rounded-sm bg-paper/40" />
          </span>
          <span>
            <span className="block font-display text-lg font-black leading-none">CEFOD <span className="text-accent">IntelliRoom</span></span>
            <span className="text-xs text-paper/50">Disponibilité des salles en direct</span>
          </span>
        </Link>

        <div className="flex items-center gap-6">
          {/* Compteurs */}
          <div className="hidden items-center gap-3 sm:flex">
            {["libre", "reservee", "occupee"].map((k) => (
              <span key={k} className="flex items-center gap-2 rounded-full border border-paper/15 px-3 py-1.5 text-sm">
                <span className={`h-2.5 w-2.5 rounded-full ${DOT[k]}`} />
                <strong className="font-display">{counts[k] ?? 0}</strong>
                <span className="text-paper/60">{STATUT_SALLE_LABELS[k]}</span>
              </span>
            ))}
          </div>
          {/* Horloge */}
          <div className="text-right">
            <p className="font-display text-3xl font-black tabular-nums leading-none">{fmtTime(clock)}</p>
            <p className="text-xs capitalize text-paper/50">
              {clock.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
        </div>
      </header>

      {/* Grille des salles */}
      <main className="flex-1 px-6 py-8 sm:px-10">
        {rooms.length === 0 ? (
          <p className="mt-24 text-center text-lg text-paper/50">
            {online ? "Aucune salle enregistrée pour le moment." : "Connexion au serveur perdue — nouvelle tentative automatique…"}
          </p>
        ) : (
          <ul className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
            {rooms.map((room) => {
              const s = room.statut_effectif ?? room.statut ?? "libre";
              return (
                <li key={room.id_salle}
                  className={`flex min-h-[170px] flex-col rounded-2xl p-5 shadow-lg transition-colors duration-500 ${TILE[s] ?? "bg-paper/10"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-display text-2xl font-black leading-tight">{room.nom_salle}</h2>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${
                      s === "occupee" ? "bg-paper/20" : s === "reservee" ? "bg-accent text-paper" : "bg-ink/5 text-ink/60"
                    }`}>
                      {STATUT_SALLE_LABELS[s] ?? s}
                    </span>
                  </div>
                  {(room.type_salle || room.capacite) && (
                    <p className={`mt-1 text-sm ${s === "occupee" ? "text-paper/75" : "text-ink/55"}`}>
                      {[room.type_salle, room.capacite ? `${room.capacite} places` : null].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  <div className="mt-auto pt-4">
                    {room.prochaine_reservation ? (
                      <p className={`text-sm font-medium ${s === "occupee" ? "text-paper/85" : "text-accent-dark"}`}>
                        ◷ Prochaine occupation : {room.prochaine_reservation}
                      </p>
                    ) : s === "libre" ? (
                      <p className="text-sm font-medium text-ink/45">Disponible dès maintenant</p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      {/* Pied de page */}
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-paper/10 px-6 py-3 text-xs text-paper/50 sm:px-10">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-paper ring-1 ring-paper/40" /> Libre</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full ring-4 ring-inset ring-accent bg-paper" /> Réservée</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-accent" /> Occupée</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${online ? "bg-accent" : "bg-paper/30"} ${online ? "rt-blink" : ""}`} />
          {online
            ? `Actualisé toutes les ${POLLING_INTERVAL / 1000} s${updatedAt ? ` — dernière mise à jour ${fmtTime(updatedAt)}` : ""}`
            : "Hors ligne — reconnexion en cours"}
        </div>
      </footer>
    </div>
  );
}
