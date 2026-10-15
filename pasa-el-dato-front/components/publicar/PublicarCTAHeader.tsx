"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ROUTES } from "@/config/constants";
import { selectEstaAutenticado, useSesionStore } from "@/stores/sesion-store";

// CTA desktop junto a "Sugerencias para ti": solo visible con sesión.
// Solo cliente: evita flash/mismatch SSR antes de rehidratar zustand persist.
export function PublicarCTAHeader() {
  const estaAutenticado = useSesionStore(selectEstaAutenticado);
  const hidratado = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!hidratado || !estaAutenticado) return null;

  return (
    <Link
      href={ROUTES.publish}
      className="hidden items-center gap-1.5 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy transition hover:bg-gold-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:inline-flex"
    >
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.5"
          d="M12 4v16m8-8H4"
        />
      </svg>
      Publicar
    </Link>
  );
}
