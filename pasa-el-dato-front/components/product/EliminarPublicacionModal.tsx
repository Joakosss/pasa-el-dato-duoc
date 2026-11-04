"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button, Modal } from "@/components/ui";
import { ROUTES } from "@/config/constants";
import { ApiError } from "@/lib/api";
import { eliminarPublicacion } from "@/lib/api/publicaciones";

interface EliminarPublicacionModalProps {
  abierto: boolean;
  onCerrar: () => void;
  publicacionId: string;
}

export function EliminarPublicacionModal({
  abierto,
  onCerrar,
  publicacionId,
}: EliminarPublicacionModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const eliminarMutation = useMutation({
    mutationFn: () => eliminarPublicacion(publicacionId),
    onSuccess: () => {
      queryClient.removeQueries({
        queryKey: ["publicacion", publicacionId],
      });
      queryClient.removeQueries({
        queryKey: ["publicacion-edicion", publicacionId],
      });
      queryClient.invalidateQueries({ queryKey: ["publicaciones"] });
      setError(null);
      onCerrar();
      toast.success("Publicación eliminada");
      router.replace(ROUTES.home);
      router.refresh();
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) {
        onCerrar();
        toast.error("Tu sesión expiró. Inicia sesión nuevamente.");
        router.replace(ROUTES.login);
        return;
      }

      if (err instanceof ApiError && err.status === 404) {
        onCerrar();
        toast.error("La publicación ya no está disponible.");
        router.replace(ROUTES.home);
        return;
      }

      const mensaje =
        err instanceof ApiError && err.message
          ? err.message
          : "No pudimos eliminar la publicación. Reintenta.";
      setError(mensaje);
      toast.error(mensaje);
    },
  });

  const cerrar = () => {
    if (eliminarMutation.isPending) return;
    setError(null);
    onCerrar();
  };

  return (
    <Modal
      abierto={abierto}
      titulo="Eliminar publicación"
      onCerrar={cerrar}
      pie={
        <>
          <Button
            variant="secondary"
            onClick={cerrar}
            disabled={eliminarMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => eliminarMutation.mutate()}
            disabled={eliminarMutation.isPending}
          >
            {eliminarMutation.isPending ? "Eliminando…" : "Sí, eliminar"}
          </Button>
        </>
      }
    >
      <p className="text-sm text-navy">
        La publicación dejará de aparecer en el marketplace. Esta acción no se
        puede deshacer desde tu cuenta.
      </p>
      {error ? (
        <p role="alert" className="mt-2 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : null}
    </Modal>
  );
}
