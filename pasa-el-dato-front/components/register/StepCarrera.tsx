"use client";

import { useEffect } from "react";
import { Select } from "@/components/ui/Select";
import { esCarreraDeEscuela } from "@/domain/mappers/cuenta.mapper";
import { useSedes } from "@/hooks/use-sedes";
import { useEscuelas } from "@/hooks/use-escuelas";
import { useCarreras } from "@/hooks/use-carreras";
import type { RegistroUsuarioBorrador } from "@/domain/dtos/registro.dto";

interface StepCarreraProps {
  datos: RegistroUsuarioBorrador;
  onChange: (parcial: Partial<RegistroUsuarioBorrador>) => void;
  onValidez: (valido: boolean) => void;
}

// El <select> HTML solo habla string: null (sin selección) se muestra como "".
function aSelect(id: number | null): string {
  return id === null ? "" : String(id);
}

function aNumero(valor: string): number | null {
  return valor === "" ? null : Number(valor);
}

export function StepCarrera({ datos, onChange, onValidez }: StepCarreraProps) {
  // Cargamos los selects
  const { sedes, isCargando: sedesIsCargando, error: sedesError, reintentar: sedesReintentar } = useSedes();
  const { escuelas, isCargando: escuelasIsCargando, error: escuelasError, reintentar: escuelasReintentar } = useEscuelas();
  const { carreras, isCargando: carrerasIsCargando, error: carrerasError, reintentar: carrerasReintentar } = useCarreras(datos.escuelaId);

  const valido =
    datos.sedeId !== null &&
    datos.escuelaId !== null &&
    datos.carreraId !== null &&
    esCarreraDeEscuela(carreras, datos.carreraId, datos.escuelaId);

  useEffect(() => {
    onValidez(valido);
  }, [valido, onValidez]);

  return (
    <div className="grid grid-cols-1 gap-4">
      <Select
        label="Sede *"
        name="sedeId"
        value={aSelect(datos.sedeId)}
        disabled={sedesIsCargando}
        onChange={(e) => onChange({ sedeId: aNumero(e.target.value) })}
      >
        <option value="">
          {sedesIsCargando
            ? "Cargando sedes…"
            : sedes.length === 0
              ? "Sin sedes disponibles"
              : "Selecciona tu sede"}
        </option>
        {sedes.map((sede) => (
          <option key={sede.id} value={sede.id}>
            {sede.nombre}
          </option>
        ))}
      </Select>
      {sedesError ? (
        <p className="text-sm text-red-600">
          {sedesError}{" "}
          <button
            type="button"
            className="underline"
            onClick={() => {
              void sedesReintentar();
            }}
          >
            Reintentar
          </button>
        </p>
      ) : null}
      <Select
        label="Escuela *"
        name="escuelaId"
        value={aSelect(datos.escuelaId)}
        disabled={escuelasIsCargando}
        onChange={(e) => onChange({ escuelaId: aNumero(e.target.value), carreraId: null })}
      >
        <option value="">
          {escuelasIsCargando
            ? "Cargando escuelas…"
            : escuelas.length === 0
              ? "Sin escuelas disponibles"
              : "Selecciona tu escuela"}
        </option>
        {escuelas.map((escuela) => (
          <option key={escuela.id} value={escuela.id}>
            {escuela.nombre}
          </option>
        ))}
      </Select>
      {escuelasError ? (
        <p className="text-sm text-red-600">
          {escuelasError}{" "}
          <button
            type="button"
            className="underline"
            onClick={() => {
              void escuelasReintentar();
            }}
          >
            Reintentar
          </button>
        </p>
      ) : null}
      <Select
        label="Carrera *"
        name="carreraId"
        value={aSelect(datos.carreraId)}
        disabled={datos.escuelaId === null || carrerasIsCargando}
        onChange={(e) => onChange({ carreraId: aNumero(e.target.value) })}
      >
        <option value="">
          {datos.escuelaId === null
            ? "Primero elige escuela"
            : carrerasIsCargando
              ? "Cargando carreras…"
              : carreras.length === 0
                ? "Sin carreras disponibles"
                : "Selecciona tu carrera"}
        </option>
        {carreras.map((carrera) => (
          <option key={carrera.id} value={carrera.id}>
            {carrera.nombre}
          </option>
        ))}
      </Select>
      {carrerasError ? (
        <p className="text-sm text-red-600">
          {carrerasError}{" "}
          <button
            type="button"
            className="underline"
            onClick={() => {
              void carrerasReintentar();
            }}
          >
            Reintentar
          </button>
        </p>
      ) : null}
    </div>
  );
}
