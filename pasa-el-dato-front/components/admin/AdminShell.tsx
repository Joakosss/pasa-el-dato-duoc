"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/config/constants";
import { cn } from "@/lib/utils/cn";
import { selectRol, useSesionStore } from "@/stores/sesion-store";

type TabAdmin =
  | "dashboard"
  | "marcas"
  | "publicidad"
  | "reportes-usuarios"
  | "reportes-publicaciones"
  | "palabras-bloqueadas";

interface ItemNav {
  label: string;
  href: string;
  tab?: TabAdmin;
}

const NAV: ItemNav[] = [
  { label: "Dashboard", href: ROUTES.dashboard, tab: "dashboard" },
  { label: "Marcas", href: ROUTES.dashboardMarca, tab: "marcas" },
  { label: "Publicidad", href: ROUTES.dashboardPublicidad, tab: "publicidad" },
  {
    label: "Reportes usuarios",
    href: ROUTES.dashboardReportesUsuarios,
    tab: "reportes-usuarios",
  },
  {
    label: "Reportes publicaciones",
    href: ROUTES.dashboardReportesPublicaciones,
    tab: "reportes-publicaciones",
  },
  {
    label: "Palabras bloqueadas",
    href: ROUTES.dashboardPalabrasBloqueadas,
    tab: "palabras-bloqueadas",
  }
];

const ENCABEZADO: Record<TabAdmin, { titulo: string; descripcion: string }> = {
  dashboard: {
    titulo: "Panel de Administración",
    descripcion: "Resumen general de la plataforma.",
  },
  marcas: {
    titulo: "Gestión de marcas",
    descripcion: "Crea y autoriza cuentas de marca para publicidad.",
  },
  publicidad: {
    titulo: "Publicidad",
    descripcion: "Revisa los banners pendientes y resuélvelos.",
  },
  "reportes-usuarios": {
    titulo: "Reportes de usuarios",
    descripcion:
      "Revisa los reportes contra usuarios pendientes y resuélvelos.",
  },
  "reportes-publicaciones": {
    titulo: "Reportes de publicaciones",
    descripcion:
      "Revisa los reportes contra publicaciones pendientes y resuélvelos.",
  },
  "palabras-bloqueadas": {
    titulo: "Palabras bloqueadas",
    descripcion:
      "Gestiona la lista global del filtro automático de moderación.",
  },
};

interface AdminShellProps {
  tab: TabAdmin;
  children: ReactNode;
}

function AccesoDenegado() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <div className="rounded-2xl border border-gray-200 bg-card p-8 text-center">
        <h1 className="text-lg font-bold text-navy">Acceso restringido</h1>
        <p className="mt-1 text-sm text-gray-500">
          Solo los administradores pueden acceder a este panel.
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

export function AdminShell({ tab, children }: AdminShellProps) {
  const rol = useSesionStore(selectRol);
  const pathname = usePathname();

  const esAdministrador =
    rol?.descripcion.trim().toLowerCase() === "administrador";

  if (!esAdministrador) {
    return <AccesoDenegado />;
  }

  const esActivo = (item: ItemNav) => {
    if (item.tab === "dashboard") return pathname === ROUTES.dashboard;
    if (item.tab === "marcas") return pathname.startsWith(ROUTES.dashboardMarca);
    if (item.tab === "publicidad")
      return pathname.startsWith(ROUTES.dashboardPublicidad);
    if (item.tab === "reportes-usuarios")
      return pathname.startsWith(ROUTES.dashboardReportesUsuarios);
    if (item.tab === "reportes-publicaciones")
      return pathname.startsWith(ROUTES.dashboardReportesPublicaciones);
    if (item.tab === "palabras-bloqueadas")
      return pathname.startsWith(ROUTES.dashboardPalabrasBloqueadas);
    return false;
  };

  const encabezado = ENCABEZADO[tab];

  const claseNavEscritorio = (activo: boolean) =>
    cn(
      "block w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition",
      activo
        ? "bg-gold text-navy"
        : "text-white/80 hover:bg-white/10 hover:text-white",
    );

  const claseNavMovil = (activo: boolean) =>
    cn(
      "inline-flex shrink-0 items-center rounded-lg border px-3 py-2 text-sm font-medium transition",
      activo
        ? "border-gold bg-gold text-navy"
        : "border-gray-200 bg-white text-navy hover:border-gold hover:bg-gold/10",
    );

  const renderItemNav = (
    item: ItemNav,
    estilo: (activo: boolean) => string,
  ) => {
    const activo = esActivo(item);
    const clase = estilo(activo);

    if (item.href === "#") {
      return (
        <a key={item.label} href="#" className={clase}>
          {item.label}
        </a>
      );
    }

    return (
      <Link
        key={item.label}
        href={item.href}
        aria-current={activo ? "page" : undefined}
        className={clase}
      >
        {item.label}
      </Link>
    );
  };

  return (
    <div className="flex min-h-[calc(100vh-16rem)]">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-navy text-white md:flex">
        <div className="border-b border-white/10 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
            Administración
          </p>
          <p className="mt-1 text-sm font-bold text-gold">Pasa el Dato</p>
        </div>
        <nav
          className="flex-1 space-y-1 overflow-y-auto px-3 py-4"
          aria-label="Administración"
        >
          {NAV.map((item) => renderItemNav(item, claseNavEscritorio))}
        </nav>
      </aside>

      <main className="flex-1 px-4 py-6 sm:px-6">
        <nav
          className="mb-4 flex gap-2 overflow-x-auto pb-1 md:hidden"
          aria-label="Administración móvil"
        >
          {NAV.map((item) => renderItemNav(item, claseNavMovil))}
        </nav>

        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-navy">{encabezado.titulo}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {encabezado.descripcion}
            </p>
          </div>
          {tab === "dashboard" ? (
            <Link
              href={ROUTES.dashboardMarca}
              className="inline-flex items-center justify-center rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy shadow-sm transition hover:bg-gold-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              Crear cuenta de marca
            </Link>
          ) : (
            <Link
              href={ROUTES.dashboard}
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-navy transition hover:border-gold hover:bg-gold/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              Volver al resumen
            </Link>
          )}
        </div>

        {children}
      </main>
    </div>
  );
}
