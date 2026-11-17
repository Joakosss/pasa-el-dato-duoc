"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { resolverUrlApi } from "@/lib/api/urls";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { Badge, Button, Modal, Textarea } from "@/components/ui";
import {
  useAprobarBanner,
  useBannersAdmin,
  useRechazarBanner,
} from "@/hooks/use-banners-admin";
import type { BannerAdminDTO, EstadoBannerDTO } from "@/domain/dtos/banner.dto";

const PAGE_SIZE = 10;

const FILTROS: Array<{ valor: EstadoBannerDTO; etiqueta: string }> = [
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

// Panel admin de banners (HU-PU-02): lista por estado, aprueba y rechaza
// con motivo. Solo PENDIENTE admite acciones; el back responde 409/422
// cuando la resolución ya no es posible y el listado se refresca.
export function BannersAdmin() {
  const [estado, setEstado] = useState<EstadoBannerDTO>("PENDIENTE");
  const [page, setPage] = useState(1);
  const [resolviendoId, setResolviendoId] = useState<string | null>(null);
  const [bannerARechazar, setBannerARechazar] = useState<BannerAdminDTO | null>(
    null,
  );
  const [motivo, setMotivo] = useState("");
  const [errorMotivo, setErrorMotivo] = useState<string | undefined>();

  const listado = useBannersAdmin(estado, page, PAGE_SIZE);
  const aprobar = useAprobarBanner();
  const rechazar = useRechazarBanner();

  const pagina = listado.pagina;
  const items = pagina?.items ?? [];
  const total = pagina?.pagination.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Tras resolver, el item sale de PENDIENTE: si queda vacía la última
  // página visible, se retrocede para no mostrar una página en blanco.
  const retrocederSiPaginaVacia = () => {
    if (items.length <= 1 && page > 1) setPage(page - 1);
  };

  const manejarErrorResolucion = (error: unknown) => {
    if (error instanceof ApiError) {
      if (error.status === 401) {
        toast.error("Tu sesión expiró. Inicia sesión nuevamente.");
        return;
      }
      if (error.status === 403) {
        toast.error("Tu sesión no tiene permisos para resolver banners.");
        return;
      }
      if (error.status === 404 || error.status === 409 || error.status === 422) {
        // 409: ya resuelto por otro admin o límite de 3 activos.
        // 422: el periodo de vigencia ya terminó.
        toast.error(error.message || "Este banner ya no se puede resolver.");
        void listado.reintentar();
        return;
      }
    }
    toast.error("No pudimos resolver el banner. Reintenta.");
  };

  const alAprobar = (banner: BannerAdminDTO) => {
    setResolviendoId(banner.id);
    aprobar.mutate(banner.id, {
      onSuccess: () => {
        toast.success("Banner aprobado.");
        retrocederSiPaginaVacia();
      },
      onError: manejarErrorResolucion,
      onSettled: () => setResolviendoId(null),
    });
  };

  const abrirRechazo = (banner: BannerAdminDTO) => {
    setBannerARechazar(banner);
    setMotivo("");
    setErrorMotivo(undefined);
  };

  const cerrarRechazo = () => {
    if (rechazar.isPending) return;
    setBannerARechazar(null);
    setMotivo("");
    setErrorMotivo(undefined);
  };

  const alConfirmarRechazo = () => {
    if (!bannerARechazar) return;

    const limpio = motivo.trim();
    if (limpio.length < 5) {
      setErrorMotivo("El motivo debe tener al menos 5 caracteres.");
      return;
    }
    if (limpio.length > 500) {
      setErrorMotivo("El motivo no puede exceder 500 caracteres.");
      return;
    }

    setErrorMotivo(undefined);
    rechazar.mutate(
      { id: bannerARechazar.id, motivo: limpio },
      {
        onSuccess: () => {
          setBannerARechazar(null);
          setMotivo("");
          setErrorMotivo(undefined);
          toast.success("Banner rechazado. La marca recibió el motivo.");
          retrocederSiPaginaVacia();
        },
        onError: (error: unknown) => {
          // 400 = motivo fuera de los 5..500 que exige el back: se muestra
          // en el modal y este queda abierto para corregirlo.
          if (error instanceof ApiError && error.status === 400) {
            setErrorMotivo(error.message || "Revisa el motivo ingresado.");
            return;
          }
          manejarErrorResolucion(error);
        },
      },
    );
  };

  const cambiarFiltro = (siguiente: EstadoBannerDTO) => {
    setEstado(siguiente);
    setPage(1);
  };

  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-navy">
            Banners{total > 0 ? ` (${total})` : ""}
          </h2>
          <div
            role="group"
            aria-label="Filtrar banners por estado"
            className="flex flex-wrap gap-2"
          >
            {FILTROS.map((filtro) => (
              <button
                key={filtro.valor}
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
        </div>

        {listado.isCargando ? (
          <div className="space-y-3 px-5 py-6" aria-hidden="true">
            {[0, 1, 2].map((indice) => (
              <div key={indice} className="h-12 rounded bg-gray-100" />
            ))}
          </div>
        ) : null}
        {listado.isCargando ? (
          <p role="status" className="sr-only">
            Cargando banners…
          </p>
        ) : null}

        {!listado.isCargando && listado.error ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-red-500">{listado.error}</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => listado.reintentar()}
            >
              Reintentar
            </Button>
          </div>
        ) : null}

        {!listado.isCargando && !listado.error && items.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-gray-500">
            {estado === "PENDIENTE"
              ? "No hay banners pendientes de aprobación."
              : `No hay banners ${
                  FILTROS.find((filtro) => filtro.valor === estado)?.etiqueta.toLowerCase() ?? ""
                }.`}
          </p>
        ) : null}

        {!listado.isCargando && !listado.error && items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem]">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase text-gray-400">
                  <th className="px-5 py-3">Banner</th>
                  <th className="px-5 py-3">Marca</th>
                  <th className="px-5 py-3">Vigencia</th>
                  <th className="px-5 py-3">Sedes</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((banner) => {
                  const pendiente = banner.estado === "PENDIENTE";
                  const ocupado = resolviendoId === banner.id;

                  return (
                    <tr key={banner.id} className="transition hover:bg-surface">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={resolverUrlApi(banner.imagen)}
                            alt=""
                            className="h-12 w-20 shrink-0 rounded-md border border-gray-200 bg-gray-100 object-cover"
                          />
                          <p
                            className="max-w-[18rem] truncate text-sm text-navy"
                            title={banner.mensaje}
                          >
                            {banner.mensaje}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-navy">
                        {banner.marca.nombre}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-sm text-gray-500">
                        {formatDate(banner.fechaInicio)} →{" "}
                        {formatDate(banner.fechaFin)}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">
                        {banner.sedes.map((sede) => sede.nombre).join(", ")}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={ETIQUETA_ESTADO[banner.estado].variante}>
                          {ETIQUETA_ESTADO[banner.estado].texto}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        {pendiente ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => alAprobar(banner)}
                              disabled={ocupado || aprobar.isPending}
                            >
                              {ocupado ? "Aprobando…" : "Aprobar"}
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => abrirRechazo(banner)}
                              disabled={ocupado || rechazar.isPending}
                            >
                              Rechazar
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400" aria-label="Sin acciones">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      {total > 0 ? (
        <nav
          aria-label="Paginación de banners"
          className="flex flex-wrap items-center justify-between gap-3 px-1"
        >
          <span className="text-xs text-gray-500">
            Página {page} de {totalPaginas} · {total} resultado
            {total === 1 ? "" : "s"}
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1 || listado.isCargando}
              onClick={() => setPage((anterior) => Math.max(1, anterior - 1))}
            >
              ← Anterior
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPaginas || listado.isCargando}
              onClick={() => setPage((anterior) => anterior + 1)}
            >
              Siguiente →
            </Button>
          </div>
        </nav>
      ) : null}

      <Modal
        abierto={bannerARechazar !== null}
        titulo="Rechazar banner"
        onCerrar={cerrarRechazo}
        pie={
          <>
            <Button variant="secondary" onClick={cerrarRechazo} disabled={rechazar.isPending}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={alConfirmarRechazo}
              disabled={rechazar.isPending}
            >
              {rechazar.isPending ? "Rechazando…" : "Rechazar banner"}
            </Button>
          </>
        }
      >
        {bannerARechazar ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-navy">
                {bannerARechazar.marca.nombre}
              </p>
              <p className="text-sm text-gray-500">{bannerARechazar.mensaje}</p>
              <p className="text-xs text-gray-400">
                {formatDate(bannerARechazar.fechaInicio)} →{" "}
                {formatDate(bannerARechazar.fechaFin)}
              </p>
            </div>
            <Textarea
              label="Motivo del rechazo"
              name="motivo"
              placeholder="El banner no cumple con las normativas institucionales."
              value={motivo}
              error={errorMotivo}
              maxLength={500}
              onChange={(evento) => {
                setErrorMotivo(undefined);
                setMotivo(evento.target.value);
              }}
            />
            <p className="text-xs text-gray-500">
              Entre 5 y 500 caracteres. La marca recibirá este motivo.
            </p>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
