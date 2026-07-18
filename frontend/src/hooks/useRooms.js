import { useCallback, useEffect, useState } from "react";
import { fetchRooms } from "../api/roomApi";

/** Charge le catalogue de salles (avec tarif de la catégorie du client si connecté). */
export function useRooms(params) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await fetchRooms(params);
      setRooms(Array.isArray(data) ? data : data.data ?? []);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  return { rooms, loading, error, reload: load };
}
