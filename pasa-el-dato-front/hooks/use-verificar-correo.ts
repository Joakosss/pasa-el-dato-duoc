"use client";

import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { validarCorreoDuoc } from "@/lib/validators/correo";
import { validarCorreoDisponible } from "@/lib/api/usuarios";

export type EstadoVerificacion = "vacio" | "revisando" | "libre" | "ocupado";

export interface SnapshotVerificacion {
  normalizado: string;
  mensaje: string;
}

// Solo el éxito (libre) se hidrata desde snapshot: ocupado siempre revalida.
export function useVerificarCorreo(opciones?: { snapshot?: SnapshotVerificacion | null }) {
  const snapshot = opciones?.snapshot;
  const [consulta, setConsulta] = useState<string | null>(null);
  const [errorFormato, setErrorFormato] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["validar-correo", consulta],
    queryFn: () => validarCorreoDisponible(consulta as string),
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
    const validacion = validarCorreoDuoc(valor);
    if (!validacion.ok) {
      setConsulta(null);
      setErrorFormato(validacion.error ?? "Correo inválido");
      return;
    }
    setErrorFormato(null);
    setConsulta(validacion.normalizado as string);
  }, []);

  let estado: EstadoVerificacion = "vacio";
  let mensaje: string | null = null;
  let normalizado: string | null = null;

  // const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    mensaje = "Revisando correo…";
    normalizado = consulta;
  } else if (query.isError) {
    estado = "vacio";
    mensaje = "No pudimos validar. Reintenta.";
  } else if (query.data === true) {
    estado = "libre";
    mensaje = "Correo disponible.";
    normalizado = consulta;
  } else if (query.data === false) {
    estado = "ocupado";
    mensaje = "Este correo ya está registrado.";
    normalizado = consulta;
  }

  return { estado, mensaje, normalizado, verificar, resetear };
}
