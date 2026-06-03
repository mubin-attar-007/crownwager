"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "./api";

interface State<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/** Minimal GET hook with loading/error state. `deps` re-fetches when changed. */
export function useApi<T>(path: string | null, deps: unknown[] = []): State<T> {
  const [state, setState] = useState<State<T>>({ data: null, loading: true, error: null });

  useEffect(() => {
    if (!path) return;
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    api
      .get<T>(path)
      .then((data) => active && setState({ data, loading: false, error: null }))
      .catch((e: unknown) =>
        active &&
        setState({
          data: null,
          loading: false,
          error: e instanceof ApiError ? e.message : "Network error",
        }),
      );
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
