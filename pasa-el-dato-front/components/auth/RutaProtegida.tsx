"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/config/constants";
import { selectEstaAutenticado, useSesionStore } from "@/stores/sesion-store";

// Envuelve rutas que exigen sesión: sin sesión redirige a login.
// Solo cliente: evita flash/mismatch SSR antes de rehidratar zustand persist.
export function RutaProtegida({ children }: { children: ReactNode }) {
  const estaAutenticado = useSesionStore(selectEstaAutenticado);
  const hidratado = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const router = useRouter();

  useEffect(() => {
    if (hidratado && !estaAutenticado) {
      router.replace(ROUTES.login);
    }
  }, [hidratado, estaAutenticado, router]);

  if (!hidratado || !estaAutenticado) {
    return (
      <div
        aria-hidden="true"
        className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
      >
        <div className="h-6 w-48 rounded bg-gray-100" />
        <div className="mt-2 h-4 w-72 max-w-full rounded bg-gray-100" />
        <div className="mt-4 h-40 rounded-xl bg-gray-100" />
      </div>
    );
  }

  return <>{children}</>;
}
