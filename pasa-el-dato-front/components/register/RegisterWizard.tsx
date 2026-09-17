"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/config";
import { ApiError } from "@/lib/api";
import { registrarUsuario } from "@/lib/api/usuarios";
import { Stepper } from "./Stepper";
import { StepCuenta } from "./StepCuenta";
import { StepDatos } from "./StepDatos";
import { StepCarrera } from "./StepCarrera";
import { StepClave } from "./StepClave";
import {
  REGISTRO_USUARIO_INICIAL,
  type RegistroUsuarioBorrador,
} from "@/domain/dtos/registro.dto";
import type { SnapshotVerificacion as SnapshotRun } from "@/hooks/use-verificar-run"; // valida y hace una seudo validacion de disponibilidad 
import type { SnapshotVerificacion as SnapshotCorreo } from "@/hooks/use-verificar-correo"; // valida y hace una seudo validacion de disponibilidad
import { CARRERAS_MOMENTANEO } from "@/domain/catalogo.data.momentaneo"; // esto debe migrarse a algun endpoint que traiga las escuelas y colegios
import type { RegistrarUsuarioRequestDTO } from "@/domain/dtos/cuenta.dto";
import {
  CuentaMapper,
  validarBorradorParaCrear,
} from "@/domain/mappers/cuenta.mapper";

export function RegisterWizard() {
  const router = useRouter();
  const [paso, setPaso] = useState(0);
  const [maxVisitado, setMaxVisitado] = useState(0);
  const [datos, setDatos] = useState<RegistroUsuarioBorrador>(REGISTRO_USUARIO_INICIAL);
  const [runSnapshot, setRunSnapshot] = useState<SnapshotRun | null>(null);
  const [correoSnapshot, setCorreoSnapshot] = useState<SnapshotCorreo | null>(null);
  const [cuentaValida, setCuentaValida] = useState(false);
  const [datosValidos, setDatosValidos] = useState(false);
  const [carreraValida, setCarreraValida] = useState(false);
  const [claveValida, setClaveValida] = useState(false);
  const [errorCrear, setErrorCrear] = useState<string | null>(null);
  const redireccion = useRef<ReturnType<typeof setTimeout> | null>(null);

  const actualizar = useCallback((parcial: Partial<RegistroUsuarioBorrador>) => {
    setDatos((prev) => ({ ...prev, ...parcial }));
  }, []);

  //validaciones para ver distintas consultas SQL al Back
  const onCuentaValidez = useCallback((valido: boolean) => setCuentaValida(valido), []);
  const onRunSnapshot = useCallback((snapshot: SnapshotRun | null) => setRunSnapshot(snapshot), []);
  const onCorreoSnapshot = useCallback((snapshot: SnapshotCorreo | null) => setCorreoSnapshot(snapshot), []);
  const onDatosValidez = useCallback((valido: boolean) => setDatosValidos(valido), []);
  const onCarreraValidez = useCallback((valido: boolean) => setCarreraValida(valido), []);
  const onClaveValidez = useCallback((valido: boolean) => setClaveValida(valido), []);

  useEffect(() => {
    return () => {
      if (redireccion.current) clearTimeout(redireccion.current);
    };
  }, []);

  const avanzar = () => {
    const siguiente = Math.min(paso + 1, 3);
    setPaso(siguiente);
    setMaxVisitado((prev) => Math.max(prev, siguiente));
  };
  const retroceder = () => setPaso((prev) => Math.max(prev - 1, 0));
  const irAPaso = (destino: number) => {
    if (destino <= maxVisitado) setPaso(destino);
  };

  const continuarDeshabilitado =
    (paso === 0 && !cuentaValida) ||
    (paso === 1 && !datosValidos) ||
    (paso === 2 && !carreraValida);

  // Envío real a POST /usuario/registro. 201 -> mensaje breve y salto a login.
  const crearMutation = useMutation({
    mutationFn: (payload: RegistrarUsuarioRequestDTO) => registrarUsuario(payload),
    onSuccess: () => {
      if (redireccion.current) clearTimeout(redireccion.current);
      redireccion.current = setTimeout(() => {
        router.push(`${ROUTES.login}?registrado=1`);
      }, 1500);
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.status === 409) {
        setErrorCrear("El correo o RUT ya están registrados. Vuelve al paso Cuenta y revísalos.");
        return;
      }
      if (error instanceof ApiError && error.status === 400) {
        setErrorCrear(error.message || "El back rechazó los datos. Revisa el formulario.");
        return;
      }
      setErrorCrear("No pudimos crear tu cuenta. Reintenta.");
    },
  });

  const crearCuenta = () => {
    if (crearMutation.isPending) return;
    setErrorCrear(null);
    const validacion = validarBorradorParaCrear(
      datos,
      {
        runNormalizado: runSnapshot?.normalizado ?? null,
        correoNormalizado: correoSnapshot?.normalizado ?? null,
      },
      CARRERAS_MOMENTANEO,
    );
    if (!validacion.ok) {
      setErrorCrear(validacion.error ?? "Revisa los datos ingresados.");
      return;
    }
    crearMutation.mutate(
      CuentaMapper.toRegistrarUsuarioRequest(datos, {
        runNormalizado: runSnapshot?.normalizado ?? null,
        correoNormalizado: correoSnapshot?.normalizado ?? null,
      }),
    );
  };

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
        respondidos={[cuentaValida, datosValidos, carreraValida, claveValida]}
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
      {paso === 2 ? <StepCarrera datos={datos} onChange={actualizar} onValidez={onCarreraValidez} /> : null}
      {paso === 3 ? <StepClave datos={datos} onChange={actualizar} onValidez={onClaveValidez} /> : null}

      {errorCrear ? (
        <p role="alert" className="mt-4 text-sm font-medium text-red-500">
          {errorCrear}
        </p>
      ) : null}

      <div className={`mt-6 flex items-center gap-3 ${paso === 0 ? "justify-end" : "justify-between"}`}>
        {paso > 0 ? (
          <Button variant="secondary" size="lg" onClick={retroceder}>
            Atrás
          </Button>
        ) : null}
        {paso < 3 ? (
          <Button variant="primary" size="lg" disabled={continuarDeshabilitado} onClick={avanzar}>
            Continuar
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            disabled={!claveValida || crearMutation.isPending}
            onClick={crearCuenta}
          >
            {crearMutation.isPending ? "Creando cuenta…" : "Crear cuenta"}
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
