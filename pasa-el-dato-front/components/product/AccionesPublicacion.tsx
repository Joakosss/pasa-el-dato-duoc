"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui";
import { ROUTES } from "@/config/constants";
import { ApiError } from "@/lib/api";
import { useIniciarConversacion } from "@/hooks/use-iniciar-conversacion";
import { useMisPublicaciones } from "@/hooks/use-mis-publicaciones";
import { usePropiedadPublicacion } from "@/hooks/use-propiedad-publicacion";
import { selectEstaAutenticado, useSesionStore } from "@/stores/sesion-store";
import { EliminarPublicacionModal } from "./EliminarPublicacionModal";
import { EstadoPublicacionBotonera } from "./EstadoPublicacionBotonera";
import { ActivarCalificacionBoton } from "./ActivarCalificacionBoton";
import { AccionCalificar } from "./AccionCalificar";

interface AccionesPublicacionProps {
  id: string;
  // Descripción del estado actual (GET /publicaciones/me). Si se omite, la
  // botonera resuelve el estado por sí misma.
  estadoInicial?: string;
}

const CLASE_ENLACE_SECUNDARIO =
  "inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-8 py-3 text-sm font-semibold text-navy transition-colors hover:border-gold hover:bg-gold/10 focus:outline-none focus:ring-2 focus:ring-gold";

export function AccionesPublicacion({ id, estadoInicial }: AccionesPublicacionProps) {
  const router = useRouter();
  const { esPropia, verificando } = usePropiedadPublicacion(id);
  const estaAutenticado = useSesionStore(selectEstaAutenticado);
  // GET /me sí expone `estado` (el detalle /edicion no lo incluye), así se
  // inicializa la botonera con el estado real en vez del "En curso" por
  // defecto. Solo se consulta cuando ya se sabe que es propia.
  const { publicaciones } = useMisPublicaciones({ enabled: esPropia });
  const estadoReal =
    estadoInicial ??
    publicaciones.find((publicacion) => publicacion.id === id)?.estado
      .descripcion;
  // HU-COM-01: el cierre de venta vive solo en el chat con el comprador.
  // Aquí solo se resuelve el estado real para la botonera En curso/Pausada.
  const [modalAbierto, setModalAbierto] = useState(false);
  const [errorContacto, setErrorContacto] = useState<string | null>(null);
  const iniciarConversacion = useIniciarConversacion();

  if (verificando) {
    return (
      <div
        aria-hidden="true"
        className="h-12 w-full animate-pulse rounded-lg bg-gray-100"
      />
    );
  }

  if (esPropia) {
    return (
      <>
        {/* key fuerza remontaje cuando resuelve el estado real (GET /me),
        evitando sincronizar estado inicial asíncrono con efectos. */}
        <EstadoPublicacionBotonera
          key={estadoReal ?? "cargando"}
          publicacionId={id}
          estadoInicial={estadoReal}
        />

        {/* HU-CAL-03/01: solo visibles en venta cerrada según transacción. */}
        <ActivarCalificacionBoton publicacionId={id} />
        <AccionCalificar publicacionId={id} />

        <div className="flex gap-3">
          <Link href={`/product/${id}/editar`} className={CLASE_ENLACE_SECUNDARIO}>
            Editar
          </Link>
          <Button
            variant="destructive"
            size="lg"
            className="flex-1"
            onClick={() => setModalAbierto(true)}
          >
            Eliminar
          </Button>
        </div>

        <EliminarPublicacionModal
          abierto={modalAbierto}
          onCerrar={() => setModalAbierto(false)}
          publicacionId={id}
        />
      </>
    );
  }

  const contactar = () => {
    if (iniciarConversacion.isPending) return;

    if (!estaAutenticado) {
      toast.error("Debes iniciar sesión para contactar al vendedor.");
      router.replace(ROUTES.login);
      return;
    }

    setErrorContacto(null);
    iniciarConversacion.mutate(id, {
      onSuccess: (respuesta) => {
        router.push(`/chats/${respuesta.conversacionId}`);
      },
      onError: (err: unknown) => {
        if (err instanceof ApiError && err.status === 401) {
          toast.error("Tu sesión expiró. Inicia sesión nuevamente.");
          router.replace(ROUTES.login);
          return;
        }

        const mensaje =
          err instanceof ApiError && err.message
            ? err.message
            : "No pudimos abrir el chat. Reintenta.";
        setErrorContacto(mensaje);
        toast.error(mensaje);
      },
    });
  };

  const enCurso = iniciarConversacion.isPending;

  return (
    <>
      <Button
        variant="primary"
        size="lg"
        className="w-full py-3.5"
        disabled={enCurso}
        aria-disabled={enCurso}
        onClick={contactar}
      >
        {enCurso ? "Abriendo chat…" : "Contactar vendedor"}
      </Button>
      {errorContacto ? (
        <p role="alert" className="mt-2 text-center text-sm font-medium text-red-600">
          {errorContacto}
        </p>
      ) : null}
    </>
  );
}
