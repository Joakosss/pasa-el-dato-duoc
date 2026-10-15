"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/config/constants";
import { selectEstaAutenticado, useSesionStore } from "@/stores/sesion-store";

export function FloatingPublish() {
  const pathname = usePathname();
  const estaAutenticado = useSesionStore(selectEstaAutenticado);
  // Solo cliente: evita flash/mismatch SSR antes de rehidratar zustand persist.
  const hidratado = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!hidratado || !estaAutenticado) return null;
  if (pathname?.startsWith(ROUTES.publish)) return null;

  return (
    <Link
      href={ROUTES.publish}
      aria-label="Crear publicación"
      className="fixed bottom-24 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-gold text-navy shadow-lg transition hover:bg-gold-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:hidden"
    >
      <svg
        className="h-8 w-8"
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
    </Link>
  );
}
