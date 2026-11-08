"use client";

import { useSyncExternalStore } from "react";

function suscribirAVisibilidad(callback: () => void): () => void {
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
}

function estaVisible(): boolean {
  return document.visibilityState === "visible";
}

function estaVisibleEnServidor(): boolean {
  return false;
}

// Indica si la pestaña está visible. En SSR devuelve false para no acceder a
// `document`; al hidratar refleja el estado real.
export function useDocumentoVisible(): boolean {
  return useSyncExternalStore(
    suscribirAVisibilidad,
    estaVisible,
    estaVisibleEnServidor,
  );
}
