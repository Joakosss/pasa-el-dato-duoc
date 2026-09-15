"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { normalizarRun, validarRun } from "@/lib/validators/rut";

export type EstadoVerificacion = "vacio" | "revisando" | "libre" | "ocupado";

export interface SnapshotVerificacion {
  normalizado: string;
  mensaje: string;
}

// Carcasa: simula POST /api/usuarios/verificar-run -> { disponible: boolean }.
// TODO: reemplazar mock por fetch real con misma firma.
// Solo el éxito (libre) se hidrata desde snapshot: ocupado siempre revalida.
const RUNS_OCUPADOS_MOCK = new Set(["12345678-5", "19683417-6"]);
const DEMORA_MOCK_MS = 900;

export function useVerificarRun(opciones?: { snapshot?: SnapshotVerificacion | null }) {
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
    const validacion = validarRun(valor);
    if (!validacion.ok) {
      setEstado("vacio");
      setMensaje(validacion.error ?? "RUT inválido.");
      setNormalizado(null);
      return;
    }
    const runNormalizado = validacion.normalizado ?? normalizarRun(valor);
    setNormalizado(runNormalizado);
    setEstado("revisando");
    setMensaje("Revisando RUT…");
    timer.current = setTimeout(() => {
      const disponible = !RUNS_OCUPADOS_MOCK.has(runNormalizado);
      if (disponible) {
        setEstado("libre");
        setMensaje("RUT disponible.");
      } else {
        setEstado("ocupado");
        setMensaje("Este RUT ya está registrado.");
      }
    }, DEMORA_MOCK_MS);
  }, []);

  return { estado, mensaje, normalizado, verificar, resetear };
}
