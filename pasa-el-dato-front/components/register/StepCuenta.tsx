"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { ROUTES } from "@/config";
import { useVerificarRun, type SnapshotVerificacion as SnapshotRun } from "@/hooks/use-verificar-run";
import { useVerificarCorreo, type SnapshotVerificacion as SnapshotCorreo } from "@/hooks/use-verificar-correo";
import { cn } from "@/lib/utils/cn";

// Pausa sin teclear antes de consultar (carcasa, sin fetch).
const PAUSA_DEBOUNCE_MS = 1300;

interface StepCuentaProps {
  run: string;
  correo: string;
  runSnapshot: SnapshotRun | null;
  correoSnapshot: SnapshotCorreo | null;
  onRunChange: (valor: string) => void;
  onCorreoChange: (valor: string) => void;
  onRunSnapshot: (snapshot: SnapshotRun | null) => void;
  onCorreoSnapshot: (snapshot: SnapshotCorreo | null) => void;
  onValidez: (valido: boolean) => void;
}

function LineaEstado({
  estado,
  mensaje,
  nombre,
}: {
  estado: "vacio" | "revisando" | "libre" | "ocupado";
  mensaje: string | null;
  nombre: string;
}) {
  if (estado !== "revisando" && estado !== "libre") return null;
  if (!mensaje) return null;
  return (
    <p
      aria-live="polite"
      aria-label={`Estado de ${nombre}`}
      className={cn(
        "text-xs font-medium",
        estado === "libre" && "text-green-600",
        estado === "revisando" && "animate-pulse text-gray-400",
      )}
    >
      {estado === "libre" ? `✓ ${mensaje}` : mensaje}
    </p>
  );
}

function ErrorOcupado({ mensaje }: { mensaje: string | null }) {
  if (!mensaje) return null;
  return (
    <p className="text-xs text-gray-400">
      {mensaje}{" "}
      <Link href={ROUTES.login} className="font-semibold text-navy underline">
        Inicia sesión
      </Link>
    </p>
  );
}

export function StepCuenta({
  run,
  correo,
  runSnapshot,
  correoSnapshot,
  onRunChange,
  onCorreoChange,
  onRunSnapshot,
  onCorreoSnapshot,
  onValidez,
}: StepCuentaProps) {
  const verRun = useVerificarRun({ snapshot: runSnapshot });
  const verCorreo = useVerificarCorreo({ snapshot: correoSnapshot });
  const debounceRun = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceCorreo = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRun.current) clearTimeout(debounceRun.current);
      if (debounceCorreo.current) clearTimeout(debounceCorreo.current);
    };
  }, []);

  useEffect(() => {
    onValidez(verRun.estado === "libre" && verCorreo.estado === "libre");
  }, [verRun.estado, verCorreo.estado, onValidez]);

  // Solo el éxito persiste en el wizard: ocupado nunca genera snapshot.
  useEffect(() => {
    if (verRun.estado === "libre" && verRun.normalizado && verRun.mensaje) {
      onRunSnapshot({ normalizado: verRun.normalizado, mensaje: verRun.mensaje });
    } else if (verRun.estado !== "libre") {
      onRunSnapshot(null);
    }
  }, [verRun.estado, verRun.normalizado, verRun.mensaje, onRunSnapshot]);

  useEffect(() => {
    if (verCorreo.estado === "libre" && verCorreo.normalizado && verCorreo.mensaje) {
      onCorreoSnapshot({ normalizado: verCorreo.normalizado, mensaje: verCorreo.mensaje });
    } else if (verCorreo.estado !== "libre") {
      onCorreoSnapshot(null);
    }
  }, [verCorreo.estado, verCorreo.normalizado, verCorreo.mensaje, onCorreoSnapshot]);

  const programarRun = (valor: string) => {
    onRunChange(valor);
    verRun.resetear();
    if (debounceRun.current) clearTimeout(debounceRun.current);
    if (valor.trim().length === 0) return;
    debounceRun.current = setTimeout(() => verRun.verificar(valor), PAUSA_DEBOUNCE_MS);
  };

  const programarCorreo = (valor: string) => {
    onCorreoChange(valor);
    verCorreo.resetear();
    if (debounceCorreo.current) clearTimeout(debounceCorreo.current);
    if (valor.trim().length === 0) return;
    debounceCorreo.current = setTimeout(() => verCorreo.verificar(valor), PAUSA_DEBOUNCE_MS);
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Input
          label="RUT"
          name="run"
          placeholder="12.345.678-5"
          value={run}
          autoComplete="off"
          onChange={(e) => programarRun(e.target.value)}
          error={
            verRun.estado === "ocupado" || (verRun.estado === "vacio" && verRun.mensaje)
              ? (verRun.mensaje ?? undefined)
              : undefined
          }
        />
        <LineaEstado estado={verRun.estado} mensaje={verRun.mensaje} nombre="RUT" />
        {verRun.estado === "ocupado" ? <ErrorOcupado mensaje="¿Ya tienes cuenta?" /> : null}
      </div>

      <div className="space-y-1.5">
        <Input
          label="Correo institucional"
          type="email"
          name="correo"
          placeholder="ejemplo@duocuc.cl"
          value={correo}
          autoComplete="email"
          onChange={(e) => programarCorreo(e.target.value)}
          error={
            verCorreo.estado === "ocupado" || (verCorreo.estado === "vacio" && verCorreo.mensaje)
              ? (verCorreo.mensaje ?? undefined)
              : undefined
          }
        />
        <LineaEstado estado={verCorreo.estado} mensaje={verCorreo.mensaje} nombre="correo" />
        {verCorreo.estado === "ocupado" ? <ErrorOcupado mensaje="¿Ya tienes cuenta?" /> : null}
      </div>
    </div>
  );
}
