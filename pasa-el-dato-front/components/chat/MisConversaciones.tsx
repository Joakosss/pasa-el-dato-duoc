"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/config/constants";
import { useConversaciones } from "@/hooks/use-conversaciones";
import { useRolesConversaciones } from "@/hooks/use-roles-conversaciones";
import { selectSesion, useSesionStore } from "@/stores/sesion-store";
import { ChatEmptyState } from "./ChatEmptyState";
import { ChatList } from "./ChatList";
import { ChatListSkeleton } from "./ChatListSkeleton";

export function MisConversaciones() {
  const router = useRouter();
  const sesion = useSesionStore(selectSesion);
  const idCuenta = sesion?.idCuenta ?? null;
  const conversaciones = useConversaciones(idCuenta);
  const rolPorConversacion = useRolesConversaciones(conversaciones.conversaciones);

  useEffect(() => {
    if (conversaciones.esSesionInvalida) {
      toast.error("Tu sesión expiró. Inicia sesión nuevamente.");
      router.replace(ROUTES.login);
    }
  }, [conversaciones.esSesionInvalida, router]);

  if (conversaciones.esSesionInvalida) {
    return <ChatListSkeleton count={4} />;
  }

  if (conversaciones.isCargando) {
    return <ChatListSkeleton count={4} />;
  }

  if (conversaciones.errorInicial) {
    return (
      <div
        role="alert"
        className="mx-auto w-full max-w-md rounded-2xl border border-gray-200 bg-card p-8 text-center"
      >
        <p className="text-sm text-gray-500">{conversaciones.error}</p>
        <Button
          variant="primary"
          className="mt-4"
          onClick={() => void conversaciones.reintentar()}
        >
          Reintentar
        </Button>
      </div>
    );
  }

  if (conversaciones.conversaciones.length === 0) {
    return <ChatEmptyState />;
  }

  return (
    <div className="space-y-4">
      <ChatList
        conversaciones={conversaciones.conversaciones}
        idCuentaActual={sesion?.idCuenta}
        rolPorConversacion={rolPorConversacion}
      />
      {conversaciones.errorPaginaSiguiente ? (
        <div className="flex flex-col items-center gap-2">
          <p role="alert" className="text-sm text-gray-500">
            No pudimos cargar más conversaciones. Reintenta.
          </p>
          <Button
            variant="secondary"
            onClick={() => void conversaciones.reintentarPaginaSiguiente()}
          >
            Reintentar
          </Button>
        </div>
      ) : conversaciones.tieneMas ? (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            disabled={conversaciones.isCargandoMas}
            aria-disabled={conversaciones.isCargandoMas}
            onClick={() => void conversaciones.cargarMas()}
          >
            {conversaciones.isCargandoMas
              ? "Cargando…"
              : "Cargar más conversaciones"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
