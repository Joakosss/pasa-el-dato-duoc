"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/config/constants";
import { selectEstaAutenticado, useSesionStore } from "@/stores/sesion-store";

export function PublicarGate() {
  const estaAutenticado = useSesionStore(selectEstaAutenticado);
  // Solo cliente: evita flash/mismatch SSR antes de rehidratar zustand persist.
  const hidratado = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const router = useRouter();

  useEffect(() => {
    if (hidratado && !estaAutenticado) {
      router.replace(ROUTES.login);
    }
  }, [hidratado, estaAutenticado, router]);

  if (!hidratado || !estaAutenticado) {
    return (
      <div
        aria-hidden="true"
        className="rounded-xl border border-gray-200 bg-card p-6"
      >
        <div className="h-6 w-48 rounded bg-gray-100" />
        <div className="mt-2 h-4 w-72 max-w-full rounded bg-gray-100" />
        <div className="mt-4 h-20 rounded-lg bg-surface" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-card p-6">
      <h1 className="text-lg font-bold text-navy">Crear publicación</h1>
      <p className="mt-1 text-sm text-gray-500">
        Elige qué quieres publicar en la comunidad.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href={ROUTES.publishProducto}
          className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:border-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          <div className="flex h-40 items-center justify-center bg-surface transition group-hover:bg-gold/10">
            <Image
              src="/box-icon.svg"
              alt="Caja de producto"
              width={96}
              height={96}
              className="h-24 w-24"
            />
          </div>
          <div className="p-4">
            <h2 className="text-base font-bold text-navy">Venta Producto</h2>
            <p className="mt-1 text-sm text-gray-500">
              Vende apuntes, libros, electrónica y más de tu carrera.
            </p>
          </div>
        </Link>
        <Link
          href={ROUTES.publishServicio}
          className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:border-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          <div className="flex h-40 items-center justify-center bg-surface transition group-hover:bg-gold/10">
            <Image
              src="/teacher-icon.svg"
              alt="Profesor ofreciendo un servicio"
              width={96}
              height={96}
              className="h-24 w-24"
            />
          </div>
          <div className="p-4">
            <h2 className="text-base font-bold text-navy">Servicio</h2>
            <p className="mt-1 text-sm text-gray-500">
              Ofrece tutorías, diseño, reparaciones y ayuda entre estudiantes.
            </p>
          </div>
        </Link>
      </div>
      <Link
        href={ROUTES.home}
        className="mt-4 inline-block text-sm font-medium text-navy transition hover:text-gold"
      >
        ← Volver al inicio
      </Link>
    </div>
  );
}
