"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "./client";

export function useDebounced<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/** Fetches `url` from the REST API whenever it changes; `url = null` skips the request. */
export function useApi<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  // Key of the last request that settled; loading is derived instead of set inside the effect.
  const [settledKey, setSettledKey] = useState<string | null>(null);
  const key = url ? `${url}#${version}` : null;

  useEffect(() => {
    if (!url || !key) return;
    let cancelled = false;
    api<T>(url)
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setError(null);
      })
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setSettledKey(key));
    return () => {
      cancelled = true;
    };
  }, [url, key]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { data, setData, error, loading: key !== null && settledKey !== key, reload };
}
