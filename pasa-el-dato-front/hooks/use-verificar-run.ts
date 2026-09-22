"use client";

import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { validarRun } from "@/lib/validators/rut";
import { validarRunDisponible } from "@/lib/api/usuarios";

export type EstadoVerificacion = "vacio" | "revisando" | "libre" | "ocupado";

export interface SnapshotVerificacion {
  normalizado: string;
  mensaje: string;
}

// Solo el éxito (libre) se hidrata desde snapshot: ocupado siempre revalida.
export function useVerificarRun(opciones?: { snapshot?: SnapshotVerificacion | null }) {
  const snapshot = opciones?.snapshot;
  const [consulta, setConsulta] = useState<string | null>(null);
  const [errorFormato, setErrorFormato] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["validar-run", consulta],
    queryFn: () => validarRunDisponible(consulta as string),
    enabled: consulta !== null && errorFormato === null,
    staleTime: 30_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const resetear = useCallback(() => {
    setConsulta(null);
    setErrorFormato(null);
  }, []);

  const verificar = useCallback((valor: string) => {
    const validacion = validarRun(valor);
    if (!validacion.ok) {
      setConsulta(null);
      setErrorFormato(validacion.error ?? "RUT inválido.");
      return;
    }
    setErrorFormato(null);
    setConsulta(validacion.normalizado as string);
  }, []);

  let estado: EstadoVerificacion = "vacio";
  let mensaje: string | null = null;
  let normalizado: string | null = null;

  if (errorFormato !== null) {
    estado = "vacio";
    mensaje = errorFormato;
  } else if (consulta === null) {
    if (snapshot) {
      estado = "libre";
      mensaje = snapshot.mensaje;
      normalizado = snapshot.normalizado;
    }
  } else if (query.isPending || query.isFetching) {
    estado = "revisando";
    mensaje = "Revisando RUT…";
    normalizado = consulta;
  } else if (query.isError) {
    estado = "vacio";
    mensaje = "No pudimos validar. Reintenta.";
  } else if (query.data === true) {
    estado = "libre";
    mensaje = "RUT disponible.";
    normalizado = consulta;
  } else if (query.data === false) {
    estado = "ocupado";
    mensaje = "Este RUT ya está registrado.";
    normalizado = consulta;
  }


  return { estado, mensaje, normalizado, verificar, resetear };
}
