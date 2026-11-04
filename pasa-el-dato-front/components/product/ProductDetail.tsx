"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/config/constants";
import { AccionesPublicacion } from "./AccionesPublicacion";
import { usePublicacion } from "@/hooks/use-publicacion";
import { usePublicacionParaEdicion } from "@/hooks/use-publicacion-para-edicion";
import { formatearPrecioCLP } from "@/lib/utils/format";
import { ProductGallery } from "./ProductGallery";
import { RelatedProducts } from "./RelatedProducts";

interface ProductDetailProps {
  id: string;
}

function DetalleSkeleton() {
  return (
    <div className="mb-10" aria-hidden="true">
      <div className="mb-6 flex h-72 gap-3 sm:h-[70vh]">
        <div className="h-full w-full rounded-xl bg-gray-200 sm:w-4/5" />
        <div className="hidden h-full w-1/5 flex-col gap-2 sm:flex">
          {[0, 1, 2, 3].map((indice) => (
            <div key={indice} className="flex-1 rounded-lg bg-gray-200" />
          ))}
        </div>
      </div>
      <div className="mb-2 h-5 w-24 rounded bg-gray-100" />
      <div className="mb-2 h-7 w-2/3 rounded bg-gray-100" />
      <div className="mb-4 h-8 w-32 rounded bg-gray-100" />
      <div className="mb-5 flex gap-3">
        <div className="h-4 w-28 rounded bg-gray-100" />
        <div className="h-4 w-20 rounded bg-gray-100" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-gray-100" />
        <div className="h-3 w-5/6 rounded bg-gray-100" />
        <div className="h-3 w-2/3 rounded bg-gray-100" />
      </div>
    </div>
  );
}

export function ProductDetail({ id }: ProductDetailProps) {
  const {
    publicacion: publicacionPublica,
    isCargando: isCargandoPublica,
    esNoEncontrada: noEncontradaPublica,
    error: errorPublico,
    reintentar: reintentarPublico,
  } = usePublicacion(id);
  // El detalle público solo existe en estado "En curso". Si da 404 y hay
  // sesión, se intenta la vista de propietario (/edicion), que responde en
  // cualquier estado no eliminado. Así el dueño siempre puede abrir y
  // gestionar sus Pausadas/Vendidas.
  const {
    publicacion: publicacionPropia,
    isCargando: isCargandoPropia,
    esNoEncontrada: noEncontradaPropia,
    esSesionInvalida: sesionInvalidaPropia,
    consultaActiva: edicionActiva,
    error: errorPropio,
    reintentar: reintentarPropio,
  } = usePublicacionParaEdicion(id, { enabled: noEncontradaPublica });

  const publicacion = publicacionPublica ?? publicacionPropia;
  const isCargando =
    isCargandoPublica || (noEncontradaPublica && isCargandoPropia);
  // Sin sesión la consulta de propietario nunca se activa: el 404 público
  // es definitivo. Con sesión, solo es "no encontrada" si el propietario
  // tampoco la ve (ajena, eliminada o sesión inválida).
  const esNoEncontrada =
    noEncontradaPublica &&
    publicacion === null &&
    !isCargandoPropia &&
    (!edicionActiva ||
      noEncontradaPropia ||
      errorPropio !== null ||
      sesionInvalidaPropia);
  const error =
    !esNoEncontrada && (errorPublico ?? errorPropio)
      ? (errorPublico ?? errorPropio)
      : null;
  const reintentar = () => {
    void reintentarPublico();
    void reintentarPropio();
  };

  if (isCargando && !publicacion) {
    return <DetalleSkeleton />;
  }

  if (esNoEncontrada) {
    return (
      <div className="mx-auto w-full max-w-md rounded-2xl border border-gray-200 bg-card p-8 text-center">
        <h1 className="text-lg font-bold text-navy">Publicación no encontrada</h1>
        <p className="mt-1 text-sm text-gray-500">
          Puede que se haya eliminado o que el enlace no sea válido.
        </p>
        <Link
          href={ROUTES.home}
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy transition hover:bg-gold-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          Ir al inicio
        </Link>
      </div>
    );
  }

  if (error || !publicacion) {
    return (
      <div
        role="alert"
        className="mx-auto w-full max-w-md rounded-2xl border border-gray-200 bg-card p-8 text-center"
      >
        <p className="text-sm text-gray-500">
          {error ?? "No pudimos cargar la publicación. Reintenta."}
        </p>
        <Button
          variant="secondary"
          size="md"
          className="mt-4"
          onClick={() => reintentar()}
        >
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-10">
        <ProductGallery
          imagenes={publicacion.imagenes}
          titulo={publicacion.titulo}
        />

        <div>
          <div className="mb-2">
            <Badge variant="category">{publicacion.categoria.nombre}</Badge>
          </div>
          <h1 className="text-xl font-bold leading-tight text-navy sm:text-2xl">
            {publicacion.titulo}
          </h1>
          <p className="mt-2 text-2xl font-bold text-navy">
            {formatearPrecioCLP(publicacion.precio)}
          </p>

          <div className="mb-5 mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <span>{publicacion.sede.nombre}</span>
            <span className="text-gray-300">|</span>
            <span>{publicacion.tipoVenta.nombre}</span>
          </div>

          <div className="mb-6">
            <h2 className="mb-2 text-sm font-semibold text-navy">Descripción</h2>
            <p className="whitespace-pre-line text-sm text-navy">
              {publicacion.descripcion}
            </p>
          </div>

          <div className="mb-6 rounded-xl bg-surface p-4">
            <h2 className="mb-3 text-sm font-semibold text-navy">
              Detalles del producto
            </h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <dt className="text-gray-400">Categoría</dt>
                <dd className="font-medium text-navy">
                  {publicacion.categoria.nombre}
                </dd>
              </div>
              <div>
                <dt className="text-gray-400">Tipo</dt>
                <dd className="font-medium text-navy">
                  {publicacion.tipoVenta.nombre}
                </dd>
              </div>
              <div>
                <dt className="text-gray-400">Sede</dt>
                <dd className="font-medium text-navy">
                  {publicacion.sede.nombre}
                </dd>
              </div>
            </dl>
          </div>

          <AccionesPublicacion id={publicacion.id} />
        </div>
      </div>

      <RelatedProducts
        idActual={publicacion.id}
        categoriaId={publicacion.categoria.id}
      />
    </>
  );
}
