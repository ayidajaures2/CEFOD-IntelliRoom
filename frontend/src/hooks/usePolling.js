import { useEffect, useRef } from "react";
import { POLLING_INTERVAL } from "../utils/constants";

/**
 * Exécute `callback` immédiatement puis toutes les `interval` ms.
 * Support de l'affichage temps réel (cahier des charges : polling AJAX 5 s).
 * Le polling se met en pause quand l'onglet est masqué.
 */
export function usePolling(callback, interval = POLLING_INTERVAL, enabled = true) {
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
  }, [interval, enabled]);
}
