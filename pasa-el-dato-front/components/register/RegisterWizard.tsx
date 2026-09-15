"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/config";
import { Stepper } from "./Stepper";
import { StepCuenta } from "./StepCuenta";
import { StepDatos } from "./StepDatos";
import { StepClave } from "./StepClave";
import { DATOS_REGISTRO_INICIALES, type DatosRegistro } from "./types";
import type { SnapshotVerificacion as SnapshotRun } from "@/hooks/use-verificar-run";
import type { SnapshotVerificacion as SnapshotCorreo } from "@/hooks/use-verificar-correo";

export function RegisterWizard() {
  const [paso, setPaso] = useState(0);
  const [maxVisitado, setMaxVisitado] = useState(0);
  const [datos, setDatos] = useState<DatosRegistro>(DATOS_REGISTRO_INICIALES);
  const [runSnapshot, setRunSnapshot] = useState<SnapshotRun | null>(null);
  const [correoSnapshot, setCorreoSnapshot] = useState<SnapshotCorreo | null>(null);
  const [cuentaValida, setCuentaValida] = useState(false);
  const [datosValidos, setDatosValidos] = useState(false);
  const [claveValida, setClaveValida] = useState(false);
  const [creada, setCreada] = useState(false);

  const actualizar = useCallback((parcial: Partial<DatosRegistro>) => {
    setDatos((prev) => ({ ...prev, ...parcial }));
  }, []);

  const onCuentaValidez = useCallback((valido: boolean) => setCuentaValida(valido), []);
  const onRunSnapshot = useCallback((snapshot: SnapshotRun | null) => setRunSnapshot(snapshot), []);
  const onCorreoSnapshot = useCallback(
    (snapshot: SnapshotCorreo | null) => setCorreoSnapshot(snapshot),
    [],
  );
  const onDatosValidez = useCallback((valido: boolean) => setDatosValidos(valido), []);
  const onClaveValidez = useCallback((valido: boolean) => setClaveValida(valido), []);

  const avanzar = () => {
    const siguiente = Math.min(paso + 1, 2);
    setPaso(siguiente);
    setMaxVisitado((prev) => Math.max(prev, siguiente));
  };
  const retroceder = () => setPaso((prev) => Math.max(prev - 1, 0));
  const irAPaso = (destino: number) => {
    if (destino <= maxVisitado) setPaso(destino);
  };

  const continuarDeshabilitado =
    (paso === 0 && !cuentaValida) || (paso === 1 && !datosValidos);

  if (creada) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-navy">
          <span className="text-lg font-bold text-gold">✓</span>
        </div>
        <h1 className="text-xl font-bold text-navy">Cuenta lista (simulado)</h1>
        <p className="mt-1 text-sm text-gray-400" aria-live="polite">
          {datos.correo || "Tu correo"} quedó pre-registrado en esta carcasa. Sin envío al back.
        </p>
        <Link
          href={ROUTES.home}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-8 py-3 text-sm font-semibold text-navy shadow-sm transition-colors hover:bg-gold-hover focus:outline-none focus:ring-2 focus:ring-gold"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-card p-8 shadow-sm">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-navy">
          <span className="text-lg font-bold text-gold">PD</span>
        </div>
        <h1 className="text-xl font-bold text-navy">Crear cuenta</h1>
        <p className="mt-1 text-sm text-gray-400">Únete al marketplace universitario</p>
      </div>

      <Stepper
        actual={paso}
        maxVisitado={maxVisitado}
        respondidos={[cuentaValida, datosValidos, claveValida]}
        onIr={irAPaso}
      />

      {paso === 0 ? (
        <StepCuenta
          run={datos.run}
          correo={datos.correo}
          runSnapshot={runSnapshot}
          correoSnapshot={correoSnapshot}
          onRunChange={(run) => actualizar({ run })}
          onCorreoChange={(correo) => actualizar({ correo })}
          onRunSnapshot={onRunSnapshot}
          onCorreoSnapshot={onCorreoSnapshot}
          onValidez={onCuentaValidez}
        />
      ) : null}
      {paso === 1 ? <StepDatos datos={datos} onChange={actualizar} onValidez={onDatosValidez} /> : null}
      {paso === 2 ? <StepClave datos={datos} onChange={actualizar} onValidez={onClaveValidez} /> : null}

      <div className={`mt-6 flex items-center gap-3 ${paso === 0 ? "justify-end" : "justify-between"}`}>
        {paso > 0 ? (
          <Button variant="secondary" size="lg" onClick={retroceder}>
            Atrás
          </Button>
        ) : null}
        {paso < 2 ? (
          <Button variant="primary" size="lg" disabled={continuarDeshabilitado} onClick={avanzar}>
            Continuar
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            disabled={!claveValida}
            onClick={() => setCreada(true)}
          >
            Crear cuenta
          </Button>
        )}
      </div>

      <div className="mt-6 text-center text-sm">
        <span className="text-gray-400">¿Ya tienes cuenta? </span>
        <Link href={ROUTES.login} className="font-semibold text-navy">
          Inicia sesión
        </Link>
      </div>
    </div>
  );
}
