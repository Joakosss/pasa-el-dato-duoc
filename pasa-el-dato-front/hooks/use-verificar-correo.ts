"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { normalizarCorreo, validarCorreoDuoc } from "@/lib/validators/correo";

export type EstadoVerificacion = "vacio" | "revisando" | "libre" | "ocupado";

export interface SnapshotVerificacion {
  normalizado: string;
  mensaje: string;
}

// Carcasa: simula POST /api/usuarios/verificar-correo -> { disponible: boolean }.
// TODO: reemplazar mock por fetch real con misma firma.
// Solo el éxito (libre) se hidrata desde snapshot: ocupado siempre revalida.
const CORREOS_OCUPADOS_MOCK = new Set(["ocupado@duocuc.cl"]);
const DEMORA_MOCK_MS = 900;

export function useVerificarCorreo(opciones?: { snapshot?: SnapshotVerificacion | null }) {
  const snapshot = opciones?.snapshot;
  const [estado, setEstado] = useState<EstadoVerificacion>(snapshot ? "libre" : "vacio");
  const [mensaje, setMensaje] = useState<string | null>(snapshot?.mensaje ?? null);
  const [normalizado, setNormalizado] = useState<string | null>(snapshot?.normalizado ?? null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const resetear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setEstado("vacio");
    setMensaje(null);
    setNormalizado(null);
  }, []);

  const verificar = useCallback((valor: string) => {
    if (timer.current) clearTimeout(timer.current);
    const validacion = validarCorreoDuoc(valor);
    if (!validacion.ok) {
      setEstado("vacio");
      setMensaje(validacion.error ?? "Correo inválido.");
      setNormalizado(null);
      return;
    }
    const correoNormalizado = validacion.normalizado ?? normalizarCorreo(valor);
    setNormalizado(correoNormalizado);
    setEstado("revisando");
    setMensaje("Revisando correo…");
    timer.current = setTimeout(() => {
      const disponible = !CORREOS_OCUPADOS_MOCK.has(correoNormalizado);
      if (disponible) {
        setEstado("libre");
        setMensaje("Correo disponible.");
      } else {
        setEstado("ocupado");
        setMensaje("Este correo ya está registrado.");
      }
    }, DEMORA_MOCK_MS);
  }, []);

  return { estado, mensaje, normalizado, verificar, resetear };
}
