"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ROUTES } from "@/config/constants";
import { cn } from "@/lib/utils/cn";
import { selectSesion, useSesionStore } from "@/stores/sesion-store";

const NAV = [
  { label: "Mis publicidades", href: ROUTES.marca },
  { label: "Crear publicidad", href: ROUTES.marcaCrear },
];

function AccesoDenegado() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <div className="rounded-2xl border border-gray-200 bg-card p-8 text-center">
        <h1 className="text-lg font-bold text-navy">Acceso restringido</h1>
        <p className="mt-1 text-sm text-gray-500">
          Este panel es solo para cuentas de marca.
        </p>
        <Link
          href={ROUTES.home}
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy transition hover:bg-gold-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

// Layout del portal de marca: cabecera, navegación y guardia de rol.
export function MarcaShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const sesion = useSesionStore(selectSesion);
  const cerrarSesion = useSesionStore((estado) => estado.cerrarSesion);

  const esMarca =
    sesion?.rol.descripcion.trim().toLowerCase() === "marca";

  if (!sesion || !esMarca) {
    return <AccesoDenegado />;
  }

  const salir = () => {
    cerrarSesion();
    router.replace(ROUTES.loginMarca);
  };

  const claseNavEscritorio = (activo: boolean) =>
    cn(
      "block w-full rounded-lg px-3 py-2 text-sm font-medium transition",
      activo
        ? "bg-gold text-navy"
        : "text-navy/70 hover:bg-gold/10 hover:text-navy",
    );

  const claseNavMovil = (activo: boolean) =>
    cn(
      "inline-flex shrink-0 items-center rounded-lg border px-3 py-2 text-sm font-medium transition",
      activo
        ? "border-gold bg-gold text-navy"
        : "border-gray-200 bg-white text-navy hover:border-gold hover:bg-gold/10",
    );

  const renderItemNav = (
    item: (typeof NAV)[number],
    estilo: (activo: boolean) => string,
  ) => {
    const activo = pathname === item.href;
    return (
      <Link
        key={item.label}
        href={item.href}
        aria-current={activo ? "page" : undefined}
        className={estilo(activo)}
      >
        {item.label}
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy">
              <span className="text-sm font-bold text-gold">PD</span>
            </div>
            <span className="text-lg font-bold text-navy">Pasa el Dato</span>
            <span className="hidden rounded-full bg-gold/20 px-2 py-0.5 text-xs font-semibold text-navy sm:inline">
              Panel de marca
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-medium text-navy sm:inline">
              {sesion.nombreCompleto}
            </span>
            <button
              type="button"
              onClick={salir}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-navy transition hover:border-gold hover:bg-gold/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <aside className="hidden w-56 shrink-0 md:block">
          <nav
            className="space-y-1 rounded-2xl border border-gray-200 bg-card p-3"
            aria-label="Panel de marca"
          >
            {NAV.map((item) => renderItemNav(item, claseNavEscritorio))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <nav
            className="mb-4 flex gap-2 overflow-x-auto pb-1 md:hidden"
            aria-label="Panel de marca móvil"
          >
            {NAV.map((item) => renderItemNav(item, claseNavMovil))}
          </nav>
          {children}
        </main>
      </div>
    </div>
  );
}
