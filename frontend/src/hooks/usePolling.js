import { useEffect, useRef } from "react";
import { POLLING_INTERVAL } from "../utils/constants";

/**
 * Exécute `callback` immédiatement puis toutes les `interval` ms.
 * Support de l'affichage temps réel (cahier des charges : polling AJAX 5 s).
 *
 * `pauseWhenHidden` (true par défaut) : met le polling en pause quand
 * l'onglet est masqué — économise des requêtes pour les tableaux de bord
 * internes, où personne ne regarde. À mettre à `false` pour un écran
 * kiosque projeté en continu (ex. RealTimeDisplay) : sinon toute perte de
 * visibilité (veille d'écran, changement de focus) gèle l'affichage
 * jusqu'à ce que la page redevienne visible.
 */
export function usePolling(callback, interval = POLLING_INTERVAL, enabled = true, pauseWhenHidden = true) {
  const savedCallback = useRef(callback);
  useEffect(() => { savedCallback.current = callback; }, [callback]);

  useEffect(() => {
    if (!enabled) return undefined;
    let timer = null;

    const tick = () => savedCallback.current();
    const start = () => {
      tick();
      timer = setInterval(tick, interval);
    };
    const stop = () => timer && clearInterval(timer);

    if (!pauseWhenHidden) {
      start();
      return stop;
    }

    const onVisibility = () => {
      stop();
      if (!document.hidden) start();
    };

    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [interval, enabled, pauseWhenHidden]);
}