"use client";

import { useEffect, useMemo } from "react";
import { Select } from "@/components/ui/Select";
import {
  CARRERAS_MOMENTANEO,
  ESCUELAS_MOMENTANEO,
  SEDES_MOMENTANEO,
} from "@/domain/catalogo.data.momentaneo";
import { esCarreraDeEscuela } from "@/domain/mappers/cuenta.mapper";
import type { RegistroUsuarioBorrador } from "@/domain/dtos/registro.dto";

interface StepCarreraProps {
  datos: RegistroUsuarioBorrador;
  onChange: (parcial: Partial<RegistroUsuarioBorrador>) => void;
  onValidez: (valido: boolean) => void;
}

export function StepCarrera({ datos, onChange, onValidez }: StepCarreraProps) {
  const carrerasFiltradas = useMemo(
    () => CARRERAS_MOMENTANEO.filter((c) => c.escuelaId === datos.escuelaId),
    [datos.escuelaId],
  );
  const valido =
    datos.sedeId.length > 0 &&
    datos.escuelaId.length > 0 &&
    datos.carreraId.length > 0 &&
    esCarreraDeEscuela(CARRERAS_MOMENTANEO, datos.carreraId, datos.escuelaId);

  useEffect(() => {
    onValidez(valido);
  }, [valido, onValidez]);

  return (
    <div className="grid grid-cols-1 gap-4">
      <Select
        label="Sede *"
        name="sedeId"
        value={datos.sedeId}
        onChange={(e) => onChange({ sedeId: e.target.value })}
      >
        <option value="">Selecciona tu sede</option>
        {SEDES_MOMENTANEO.map((sede) => (
          <option key={sede.id} value={sede.id}>
            {sede.nombre}
          </option>
        ))}
      </Select>
      <Select
        label="Escuela *"
        name="escuelaId"
        value={datos.escuelaId}
        onChange={(e) => onChange({ escuelaId: e.target.value, carreraId: "" })}
      >
        <option value="">Selecciona tu escuela</option>
        {ESCUELAS_MOMENTANEO.map((escuela) => (
          <option key={escuela.id} value={escuela.id}>
            {escuela.nombre}
          </option>
        ))}
      </Select>
      <Select
        label="Carrera *"
        name="carreraId"
        value={datos.carreraId}
        disabled={!datos.escuelaId}
        onChange={(e) => onChange({ carreraId: e.target.value })}
      >
        <option value="">
          {datos.escuelaId ? "Selecciona tu carrera" : "Primero elige escuela"}
        </option>
        {carrerasFiltradas.map((carrera) => (
          <option key={carrera.id} value={carrera.id}>
            {carrera.nombre}
          </option>
        ))}
      </Select>
    </div>
  );
}
