import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  LuDoorOpen, LuClock, LuUsers, LuWifi, LuWifiOff, LuCircle,
} from "react-icons/lu";
import { fetchOccupation, fetchRooms } from "../../api/roomApi";
import { usePolling } from "../../hooks/usePolling";
import { POLLING_INTERVAL, STATUT_SALLE_LABELS } from "../../utils/constants";
import { extractList } from "../../utils/extract";

/**
 * Écran plein écran à projeter à l'accueil du CEFOD.
 * TOUJOURS sombre (indépendant du thème clair/sombre de l'app).
 * Polling 5 s ; repli sur /rooms si /rooms/occupation indisponible.
 *
 * Code couleur imposé par le cahier des charges : vert = libre,
 * jaune = réservée, rouge = occupée. Appliqué UNIQUEMENT au point de
 * statut, au badge et aux stats de synthèse (icône + barre) — le fond
 * de chaque carte reste neutre, identique quel que soit le statut.
 */
const TILE = {
  libre:    "border-emerald-400/60 bg-white/[0.04]",
  reservee: "border-amber-400/70 bg-amber-500/25 text-white",
  occupee:  "border-transparent bg-gradient-to-br from-red-500 to-accent-dark text-white rt-pulse",
};
const STATUT_DOT = { libre: "text-emerald-400", reservee: "text-white", occupee: "text-red-400" };
const STATUT_BADGE = {
  libre: "bg-emerald-500 text-white",
  reservee: "bg-amber-500 text-black",
  occupee: "bg-red-500 text-white",
};
const SUMMARY_TONE = { libre: "text-emerald-400", reservee: "text-amber-400", occupee: "text-red-400" };
const SUMMARY_ICON_BG = { libre: "bg-emerald-500/15", reservee: "bg-amber-400/15", occupee: "bg-red-500/15" };
const SUMMARY_BAR = { libre: "bg-emerald-400", reservee: "bg-amber-400", occupee: "bg-red-500" };

export default function RealTimeDisplay() {
  const [rooms, setRooms] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [online, setOnline] = useState(true);
  const [clock, setClock] = useState(new Date());

  const load = useCallback(async () => {
    try {
      let list;
      try {
        const { data } = await fetchOccupation();
        list = extractList(data);
      } catch {
        const { data } = await fetchRooms();
        list = extractList(data);
      }
      setRooms(list);
      setUpdatedAt(new Date());
      setOnline(true);
    } catch {
      setOnline(false);
    }
  }, []);
  // pauseWhenHidden=false : cet écran est un kiosque projeté en continu à
  // l'accueil, pas un tableau de bord interne — il ne doit JAMAIS geler,
  // même si le navigateur considère la page "masquée" (veille, focus perdu).
  usePolling(load, POLLING_INTERVAL, true, false);

  // Horloge découplée du polling de données : sinon les secondes ne
  // défilaient que par paquets de 5 (au rythme du polling), donnant une
  // fausse impression de gel même quand tout fonctionnait normalement.
  useEffect(() => {
    const tick = () => setClock(new Date());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const counts = useMemo(() => {
    const c = { libre: 0, reservee: 0, occupee: 0 };
    rooms.forEach((r) => { const s = r.statut_effectif ?? r.statut; c[s] = (c[s] ?? 0) + 1; });
    return c;
  }, [rooms]);

  const total = rooms.length || 1;
  const fmtTime = (d) => d?.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const fmtSec = clock.toLocaleTimeString("fr-FR", { second: "2-digit" }).padStart(2, "0");

  return (
    <div className="flex min-h-screen flex-col bg-[#0b0b10] text-white">
      {/* ===== Bandeau supérieur ===== */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-5 sm:px-10">
        <Link to="/" className="flex items-center gap-3">
          <img
              src="/cefod-logo.jpeg"
              alt="Logo CEFOD"
              className="h-9 w-9 rounded-lg object-cover"
            />
          <span>
            <span className="block font-display text-xl font-black leading-none">
              CEFOD <span className="text-accent">IntelliRoom</span>
            </span>
            <span className="text-xs text-white/50">Disponibilité des salles en direct</span>
          </span>
        </Link>

        <div className="text-right">
          <p className="font-display text-4xl font-black tabular-nums leading-none">
            {fmtTime(clock)}<span className="text-accent">:{fmtSec}</span>
          </p>
          <p className="text-xs capitalize text-white/50">
            {clock.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </header>

      {/* ===== Barre de synthèse (compteurs + jauge) ===== */}
      <div className="grid gap-4 border-b border-white/10 px-6 py-5 sm:grid-cols-3 sm:px-10">
        <SummaryTile icon={<LuDoorOpen className="h-6 w-6" />} label="Libres" value={counts.libre}
          ratio={counts.libre / total} statut="libre" />
        <SummaryTile icon={<LuClock className="h-6 w-6" />} label="Réservées" value={counts.reservee}
          ratio={counts.reservee / total} statut="reservee" />
        <SummaryTile icon={<LuUsers className="h-6 w-6" />} label="Occupées" value={counts.occupee}
          ratio={counts.occupee / total} statut="occupee" />
      </div>

      {/* ===== Grille des salles ===== */}
      <main className="flex-1 px-6 py-8 sm:px-10">
        {rooms.length === 0 ? (
          <p className="mt-24 text-center text-lg text-white/50">
            {online ? "Aucune salle enregistrée pour le moment." : "Connexion au serveur perdue — nouvelle tentative…"}
          </p>
        ) : (
          <ul className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
            {rooms.map((room) => {
              const s = room.statut_effectif ?? room.statut ?? "libre";
              const occupied = s === "occupee";
              const highlighted = s !== "libre";
              return (
                <li key={room.id_salle}
                  className={`flex min-h-[168px] flex-col rounded-2xl border p-5 shadow-lg ${TILE[s] ?? TILE.libre}`}>
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-display text-2xl font-black leading-tight">{room.nom_salle}</h2>
                    <LuCircle className={`h-3.5 w-3.5 shrink-0 ${highlighted ? "text-white" : (STATUT_DOT[s] ?? STATUT_DOT.libre)}`} fill="currentColor" />
                  </div>

                  {(room.type_salle || room.capacite) && (
                    <p className={`mt-1 flex items-center gap-1.5 text-sm ${highlighted ? "text-white/80" : "text-white/50"}`}>
                      {room.capacite ? <><LuUsers className="h-4 w-4" /> {room.capacite} places</> : null}
                      {room.type_salle ? <span className="opacity-60">· {room.type_salle}</span> : null}
                    </p>
                  )}

                  <div className="mt-auto flex items-end justify-between pt-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${occupied ? "bg-white/20 text-white" : (STATUT_BADGE[s] ?? STATUT_BADGE.libre)}`}>
                      {STATUT_SALLE_LABELS[s] ?? s}
                    </span>
                    {room.prochaine_reservation && (
                      <span className="flex items-center gap-1 text-xs font-medium text-white/85">
                        <LuClock className="h-3.5 w-3.5" /> {room.prochaine_reservation}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      {/* ===== Pied de page ===== */}
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-6 py-3 text-xs text-white/50 sm:px-10">
        <div className="flex items-center gap-4">
          <Legend dotClass="text-emerald-400" label="Libre" />
          <Legend dotClass="text-amber-400" label="Réservée" />
          <Legend dotClass="text-red-400" label="Occupée" filled />
        </div>
        <div className="flex items-center gap-2">
          {online ? <LuWifi className="h-4 w-4 text-accent rt-blink" /> : <LuWifiOff className="h-4 w-4 text-white/40" />}
          {online
            ? `Actualisé toutes les ${POLLING_INTERVAL / 1000}s${updatedAt ? ` — ${fmtTime(updatedAt)}` : ""}`
            : "Hors ligne — reconnexion en cours"}
        </div>
      </footer>
    </div>
  );
}

function SummaryTile({ icon, label, value, ratio, statut }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${SUMMARY_ICON_BG[statut]} ${SUMMARY_TONE[statut]}`}>
        {icon}
      </span>
      <div className="flex-1">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-white/60">{label}</span>
          <span className={`font-display text-2xl font-black ${SUMMARY_TONE[statut]}`}>{value}</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className={`h-full rounded-full ${SUMMARY_BAR[statut]}`}
            style={{ width: `${Math.round((ratio || 0) * 100)}%` }} />
        </div>
      </div>
    </div>
  );
}

function Legend({ dotClass, label, filled = false }) {
  return (
    <span className="flex items-center gap-1.5">
      <LuCircle className={`h-2.5 w-2.5 ${dotClass}`} fill={filled ? "currentColor" : "none"} />
      {label}
    </span>
  );
}