"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ProductCardSkeleton } from "@/components/product";
import { ROUTES } from "@/config/constants";
import { useFavoritos } from "@/hooks/use-favoritos";
import { useSesionStore } from "@/stores/sesion-store";
import { FavoritoCard } from "./FavoritoCard";

const CANTIDAD_SKELETON = 8;

function ListaSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {Array.from({ length: CANTIDAD_SKELETON }, (_, indice) => (
        <ProductCardSkeleton key={indice} />
      ))}
    </div>
  );
}

// S9.x: listado de mis favoritos con paginación incremental (nextPage del
// back) y estados vacío / error / sesión inválida.
export function FavoritosContenido() {
  const router = useRouter();
  const cerrarSesion = useSesionStore((estado) => estado.cerrarSesion);
  const {
    favoritos,
    total,
    isCargando,
    isCargandoMas,
    tieneMas,
    cargarMas,
    esSesionInvalida,
    error,
    errorPaginaSiguiente,
    reintentar,
    reintentarPaginaSiguiente,
  } = useFavoritos();

  useEffect(() => {
    if (!esSesionInvalida) return;
    cerrarSesion();
    router.replace(ROUTES.login);
  }, [esSesionInvalida, cerrarSesion, router]);

  if (esSesionInvalida) {
    return <ListaSkeleton />;
  }

  if (isCargando && favoritos.length === 0) {
    return <ListaSkeleton />;
  }

  if (error && favoritos.length === 0) {
    return (
      <div
        role="alert"
        className="mx-auto w-full max-w-md rounded-2xl border border-gray-200 bg-card p-8 text-center shadow-sm"
      >
        <h2 className="text-lg font-bold text-navy">
          No pudimos cargar tus favoritos
        </h2>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <Button
          variant="primary"
          size="md"
          className="mt-6"
          onClick={() => {
            void reintentar();
          }}
        >
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-bold text-navy sm:text-2xl">
          Mis favoritos
        </h1>
        {favoritos.length > 0 ? (
          <p className="mt-1 text-sm text-gray-500">
            {total}{" "}
            {total === 1 ? "publicación guardada" : "publicaciones guardadas"}.
          </p>
        ) : null}
      </header>

      {favoritos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-card p-10 text-center">
          <h2 className="text-lg font-bold text-navy">
            Aún no tienes favoritos
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Guarda publicaciones para verlas aquí.
          </p>
          <Link
            href={ROUTES.home}
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy transition hover:bg-gold-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            Explorar publicaciones
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {favoritos.map((favorito) => (
            <FavoritoCard key={favorito.id} favorito={favorito} />
          ))}
        </div>
      )}

      {errorPaginaSiguiente ? (
        <div className="flex flex-col items-center gap-2">
          <p role="alert" className="text-sm text-gray-500">
            No pudimos cargar más favoritos. Reintenta.
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              void reintentarPaginaSiguiente();
            }}
          >
            Reintentar
          </Button>
        </div>
      ) : tieneMas ? (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            disabled={isCargandoMas}
            aria-disabled={isCargandoMas}
            onClick={() => {
              void cargarMas();
            }}
          >
            {isCargandoMas ? "Cargando…" : "Cargar más favoritos"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
