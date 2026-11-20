"use client";

/* eslint-disable @next/next/no-img-element */
import { formatDate, formatearPrecioCLP } from "@/lib/utils/format";
import { resolverUrlApi } from "@/lib/api/urls";
import { Button } from "@/components/ui";
import { useReportePublicacionDetalle } from "@/hooks/use-reportes-admin-publicaciones";
import { EstadoBadge } from "./AccionesReporteUsuario";
import { AccionesReportePublicacion } from "./AccionesReportePublicacion";

// HU-ADM-02-FE02/FE05/FE06: detalle publicación + contexto del reporte.
export function DetalleReportePublicacion({ id }: { id: string }) {
  const detalle = useReportePublicacionDetalle(id);
  const reporte = detalle.reporte;

  if (detalle.isCargando) {
    return (
      <>
        <div
          className="space-y-3 rounded-xl border border-gray-200 bg-card px-5 py-6"
          aria-hidden="true"
        >
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

  const pub = reporte.publicacion;
  const vendedor = pub.usuario;
  const nombreVendedor = [
    vendedor.pNombre,
    vendedor.sNombre,
    vendedor.pApellido,
    vendedor.sApellido,
  ]
    .filter((p): p is string => Boolean(p?.trim()))
    .join(" ");

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
        <div className="mt-2 grid gap-1 text-xs text-gray-500 sm:grid-cols-2">
          <p>Motivo: {reporte.motivo}</p>
          <p>Creado: {formatDate(reporte.fechaCreacion)}</p>
          {reporte.comentarios ? (
            <p className="sm:col-span-2">Contexto: {reporte.comentarios}</p>
          ) : null}
          <p>
            Resolución:{" "}
            {reporte.fechaResolucion
              ? formatDate(reporte.fechaResolucion)
              : "—"}
            {reporte.resolucion ? ` · ${reporte.resolucion}` : ""}
          </p>
          <p>
            Aviso vendedor:{" "}
            {reporte.avisoVendedorRegistrado ? "Registrado" : "No registrado"}
            {reporte.avisoVendedorFecha
              ? ` · ${formatDate(reporte.avisoVendedorFecha)}`
              : ""}
          </p>
          {reporte.mensajeAdvertencia ? (
            <p className="sm:col-span-2">
              Advertencia: {reporte.mensajeAdvertencia}
            </p>
          ) : null}
          <p>Reportante: {reporte.reportante.correo}</p>
          <p>Administrador: {reporte.adminAsignado?.correo ?? "Sin asignar"}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-card px-5 py-4">
        <h2 className="text-sm font-semibold text-navy">{pub.titulo}</h2>
        <p className="mt-1 text-sm text-gray-600">{pub.descripcion}</p>
        <div className="mt-2 grid gap-1 text-sm text-gray-600 sm:grid-cols-2">
          <p>Precio: {formatearPrecioCLP(pub.precio)}</p>
          <p>Estado: {pub.estadoPublicacion.descripcion}</p>
          <p>Tipo: {pub.tipoVenta.nombre}</p>
          <p>Categoría: {pub.categoria.nombre}</p>
          <p>Sede: {pub.sede.nombre}</p>
          <p>Eliminada: {pub.eliminado ? "Sí" : "No"}</p>
          <p>Vendedor: {nombreVendedor}</p>
          <p>{vendedor.cuenta.correo}</p>
        </div>
        {pub.imagenes.length > 0 ? (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {pub.imagenes.map((img) => (
              <img
                key={img.idImagen}
                src={resolverUrlApi(img.url)}
                alt=""
                className="h-20 w-32 shrink-0 rounded-md border border-gray-200 bg-gray-100 object-cover"
              />
            ))}
          </div>
        ) : null}
        <p className="mt-3 text-xs text-gray-400">
          El retiro deja la publicación fuera del catálogo. El aviso queda
          registrado; la entrega queda para el futuro módulo notificaciones.
        </p>
      </div>

      <AccionesReportePublicacion
        id={reporte.id}
        estado={reporte.estado}
        tituloPublicacion={pub.titulo}
        onCambioEstado={() => detalle.reintentar()}
      />
    </section>
  );
}
