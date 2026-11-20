"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/config/constants";
import { cn } from "@/lib/utils/cn";

export function ReportesTabs() {
  const pathname = usePathname();
  const enUsuarios = pathname.startsWith(ROUTES.dashboardReportesUsuarios);
  const enPublicaciones = pathname.startsWith(
    ROUTES.dashboardReportesPublicaciones,
  );

  const clase = (activo: boolean) =>
    cn(
      "inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gold",
      activo
        ? "bg-gold text-navy"
        : "border border-gray-200 bg-white text-navy hover:border-gold hover:bg-gold/10",
    );

  return (
    <nav
      aria-label="Reportes administrativos"
      className="flex flex-wrap gap-2"
    >
      <Link
        href={ROUTES.dashboardReportesUsuarios}
        aria-current={enUsuarios ? "page" : undefined}
        className={clase(enUsuarios)}
      >
        Usuarios
      </Link>
      <Link
        href={ROUTES.dashboardReportesPublicaciones}
        aria-current={enPublicaciones ? "page" : undefined}
        className={clase(enPublicaciones)}
      >
        Publicaciones
      </Link>
    </nav>
  );
}
