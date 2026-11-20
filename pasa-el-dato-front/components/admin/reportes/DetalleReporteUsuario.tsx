"use client";

import { formatDate } from "@/lib/utils/format";
import { Button } from "@/components/ui";
import { useReporteUsuarioDetalle } from "@/hooks/use-reportes-admin-usuarios";
import { AccionesReporteUsuario, EstadoBadge } from "./AccionesReporteUsuario";

// HU-ADM-01-FE02/FE05/FE06: detalle con historial disponible en el contrato.
export function DetalleReporteUsuario({ id }: { id: string }) {
  const detalle = useReporteUsuarioDetalle(id);
  const reporte = detalle.reporte;

  if (detalle.isCargando) {
    return (
      <>
        <div className="space-y-3 rounded-xl border border-gray-200 bg-card px-5 py-6" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded bg-gray-100" />
          ))}
        </div>
        <p role="status" className="sr-only">
          Cargando reporte…
        </p>
      </>
    );
  }

  if (detalle.error || !reporte) {
    return (
      <div className="rounded-xl border border-gray-200 bg-card px-5 py-10 text-center">
        <p className="text-sm text-red-500">
          {detalle.error ?? "Reporte no encontrado."}
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-3"
          onClick={() => detalle.reintentar()}
        >
          Reintentar
        </Button>
      </div>
    );
  }

  const u = reporte.reportado.usuario;
  const nombre = u
    ? [u.pNombre, u.sNombre, u.pApellido, u.sApellido]
        .filter((p): p is string => Boolean(p?.trim()))
        .join(" ")
    : reporte.reportado.correo;

  const reintentarDetalle = () => detalle.reintentar();

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-card px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase text-gray-400">Reporte</p>
            <p className="text-sm font-semibold text-navy">{reporte.id}</p>
          </div>
          <EstadoBadge estado={reporte.estado} />
        </div>
        <p className="mt-3 text-sm text-navy">
          {reporte.descripcion || "Sin descripción"}
        </p>
        <div className="mt-2 grid gap-1 text-xs text-gray-500 sm:grid-cols-2">
          <p>Creado: {formatDate(reporte.fechaCreacion)}</p>
          <p>
            Resolución:{" "}
            {reporte.fechaResolucion
              ? formatDate(reporte.fechaResolucion)
              : "—"}
            {reporte.resolucion ? ` · ${reporte.resolucion}` : ""}
          </p>
          {reporte.mensajeAdvertencia ? (
            <p className="sm:col-span-2">
              Advertencia: {reporte.mensajeAdvertencia}
            </p>
          ) : null}
          {reporte.motivoBloqueo ? (
            <p className="sm:col-span-2">Motivo bloqueo: {reporte.motivoBloqueo}</p>
          ) : null}
          <p>
            Administrador: {reporte.adminAsignado?.correo ?? "Sin asignar"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-card px-5 py-4">
        <h2 className="text-sm font-semibold text-navy">
          Usuario reportado
        </h2>
        <div className="mt-2 grid gap-1 text-sm text-gray-600 sm:grid-cols-2">
          <p>
            <span className="font-semibold text-navy">{nombre}</span>
          </p>
          <p>{reporte.reportado.correo}</p>
          <p>Rol: {u?.rol_usuario.descripcion ?? "—"}</p>
          <p>Sede: {u?.sede.nombre ?? "—"}</p>
          <p>Carrera: {u?.carrera.nombre ?? "—"}</p>
          <p>Bloqueado: {reporte.reportado.bloqueado ? "Sí" : "No"}</p>
          <p>Eliminado: {reporte.reportado.eliminado ? "Sí" : "No"}</p>
          <p>Aprobada: {reporte.reportado.aprobada ? "Sí" : "No"}</p>
          <p>
            Fecha bloqueo:{" "}
            {reporte.reportado.fechaBloqueo
              ? formatDate(reporte.reportado.fechaBloqueo)
              : "—"}
          </p>
          {reporte.reportado.motivoBloqueo ? (
            <p className="sm:col-span-2">
              Motivo bloqueo cuenta: {reporte.reportado.motivoBloqueo}
            </p>
          ) : null}
        </div>
        <p className="mt-3 text-xs text-gray-400">
          Historial disponible en esta HU: datos de la cuenta reportada
          entregados por el back (sede, carrera, rol, bloqueo). Advertir solo
          deja constancia, no envía notificación.
        </p>
      </div>

      <AccionesReporteUsuario
        id={reporte.id}
        estado={reporte.estado}
        nombreReportado={nombre}
        onCambioEstado={reintentarDetalle}
      />
    </section>
  );
}
