"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Button, Modal } from "@/components/ui";
import { cerrarSesionApi } from "@/lib/api/auth";
import { useSesionStore } from "@/stores/sesion-store";
import { ROUTES } from "@/config/constants";

interface LogoutConfirmModalProps {
  abierto: boolean;
  onCerrar: () => void;
}

// Confirma el cierre de sesión: llama POST /auth/logout, siempre limpia
// la memoria local (zustand persist) y redirige a home.
export function LogoutConfirmModal({ abierto, onCerrar }: LogoutConfirmModalProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const logoutMutation = useMutation({ mutationFn: cerrarSesionApi });

  const irHome = () => {
    setError(null);
    onCerrar();
    router.push(ROUTES.home);
    router.refresh();
  };

  const cancelar = () => {
    if (logoutMutation.isPending) return;
    // Si ya falló el servidor, la sesión local ya se limpió; cerrar lleva a home.
    if (error) {
      irHome();
      return;
    }
    setError(null);
    onCerrar();
  };

  const confirmar = async () => {
    if (logoutMutation.isPending) return;
    setError(null);
    try {
      await logoutMutation.mutateAsync();
      useSesionStore.getState().cerrarSesion();
      irHome();
    } catch {
      // Logout idempotente: aunque falle la red, se limpia la sesión local
      // y se informa; el modal queda abierto para que el usuario lo vea.
      useSesionStore.getState().cerrarSesion();
      setError(
        "No pudimos cerrar la sesión en el servidor, pero se limpió tu sesión local.",
      );
    }
  };

  return (
    <Modal
      abierto={abierto}
      titulo="¿Estás seguro?"
      onCerrar={cancelar}
      pie={
        error ? (
          <Button variant="secondary" onClick={irHome}>
            Aceptar
          </Button>
        ) : (
          <>
            <Button
              variant="secondary"
              onClick={cancelar}
              disabled={logoutMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmar}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? "Cerrando…" : "Sí, cerrar sesión"}
            </Button>
          </>
        )
      }
    >
      <p className="text-sm text-navy">
        Se cerrará tu sesión en este dispositivo.
      </p>
      {error ? (
        <p role="alert" className="mt-2 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : null}
    </Modal>
  );
}
