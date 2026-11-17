"use client";

import { useState } from "react";
import Link from "next/link";
import { ROUTES } from "@/config/constants";
import { resolverUrlApi } from "@/lib/api/urls";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { Badge, Button } from "@/components/ui";
import { useBannersMarca } from "@/hooks/use-banners-marca";
import type { EstadoBannerDTO } from "@/domain/dtos/banner.dto";

const FILTROS: Array<{
  valor: EstadoBannerDTO | undefined;
  etiqueta: string;
}> = [
  { valor: undefined, etiqueta: "Todos" },
  { valor: "PENDIENTE", etiqueta: "Pendientes" },
  { valor: "APROBADO", etiqueta: "Aprobados" },
  { valor: "RECHAZADO", etiqueta: "Rechazados" },
];

const ETIQUETA_ESTADO: Record<
  EstadoBannerDTO,
  { texto: string; variante: "review" | "active" | "reported" }
> = {
  PENDIENTE: { texto: "Pendiente", variante: "review" },
  APROBADO: { texto: "Aprobado", variante: "active" },
  RECHAZADO: { texto: "Rechazado", variante: "reported" },
};

// "Mis publicidades": listado de los banners de la marca con filtro de
// estado y paginación por cursor (GET /publicidad/banners).
export function MisPublicidades() {
  const [estado, setEstado] = useState<EstadoBannerDTO | undefined>(undefined);
  const listado = useBannersMarca(estado);

  const { banners, isCargando, error, tieneMas, isCargandoMas } = listado;

  const cambiarFiltro = (siguiente: EstadoBannerDTO | undefined) => {
    setEstado(siguiente);
  };

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-navy">Mis publicidades</h1>
          <p className="mt-1 text-sm text-gray-500">
            Estado de tus banners y su proceso de aprobación.
          </p>
        </div>
        <Link
          href={ROUTES.marcaCrear}
          className="inline-flex items-center justify-center rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy transition hover:bg-gold-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          Crear publicidad
        </Link>
      </header>

      <div
        role="group"
        aria-label="Filtrar banners por estado"
        className="flex flex-wrap gap-2"
      >
        {FILTROS.map((filtro) => (
          <button
            key={filtro.etiqueta}
            type="button"
            aria-pressed={estado === filtro.valor}
            onClick={() => cambiarFiltro(filtro.valor)}
            className={cn(
              "cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gold",
              estado === filtro.valor
                ? "bg-gold text-navy"
                : "border border-gray-200 bg-white text-navy hover:border-gold hover:bg-gold/10",
            )}
          >
            {filtro.etiqueta}
          </button>
        ))}
      </div>

      {isCargando ? (
        <div className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((indice) => (
            <div key={indice} className="h-32 rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : null}
      {isCargando ? (
        <p role="status" className="sr-only">
          Cargando publicidades…
        </p>
      ) : null}

      {!isCargando && error ? (
        <div className="rounded-2xl border border-gray-200 bg-card p-10 text-center">
          <p className="text-sm text-red-500">{error}</p>
          <Button
            variant="secondary"
            className="mt-3"
            onClick={() => listado.reintentar()}
          >
            Reintentar
          </Button>
        </div>
      ) : null}

      {!isCargando && !error && banners.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-card p-10 text-center">
          <h2 className="text-sm font-semibold text-navy">Sin publicidades</h2>
          <p className="mt-1 text-sm text-gray-500">
            {estado
              ? "No tienes banners con este estado."
              : "Todavía no hay publicidades para mostrar."}
          </p>
          <Link
            href={ROUTES.marcaCrear}
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy transition hover:bg-gold-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            Crear publicidad
          </Link>
        </div>
      ) : null}

      {!isCargando && !error && banners.length > 0 ? (
        <ul className="space-y-3">
          {banners.map((banner) => (
            <li
              key={banner.id}
              className="rounded-2xl border border-gray-200 bg-card p-4"
            >
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-100 sm:w-48">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolverUrlApi(banner.imagen)}
                    alt=""
                    className="h-32 w-full object-cover sm:h-full"
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p
                      className="text-sm font-medium text-navy"
                      title={banner.mensaje}
                    >
                      {banner.mensaje}
                    </p>
                    <Badge variant={ETIQUETA_ESTADO[banner.estado].variante}>
                      {ETIQUETA_ESTADO[banner.estado].texto}
                    </Badge>
                  </div>
                  <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-gray-500">Vigencia</dt>
                      <dd className="font-medium text-navy">
                        {formatDate(banner.fechaInicio)} →{" "}
                        {formatDate(banner.fechaFin)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Sedes</dt>
                      <dd className="font-medium text-navy">
                        {banner.sedes.map((sede) => sede.nombre).join(", ")}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {listado.errorPaginaSiguiente ? (
        <p className="text-center text-sm text-red-500">
          No pudimos cargar más banners.{" "}
          <button
            type="button"
            onClick={() => listado.reintentarPaginaSiguiente()}
            className="font-semibold text-navy underline"
          >
            Reintentar
          </button>
        </p>
      ) : null}

      {!isCargando && tieneMas ? (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            onClick={() => listado.cargarMas()}
            disabled={isCargandoMas}
          >
            {isCargandoMas ? "Cargando…" : "Cargar más"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
