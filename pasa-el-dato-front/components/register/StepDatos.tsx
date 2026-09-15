"use client";

import { useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { DatosRegistro } from "./types";

// TODO[TEMPORAL]: reemplazar por IDs reales de SEDE cuando exista la tabla.
const SEDES_MOCK = [
  { id: "sede-centro", nombre: "Sede Centro (temporal)" },
  { id: "sede-norte", nombre: "Sede Norte (temporal)" },
  { id: "sede-sur", nombre: "Sede Sur (temporal)" },
];

interface StepDatosProps {
  datos: DatosRegistro;
  onChange: (parcial: Partial<DatosRegistro>) => void;
  onValidez: (valido: boolean) => void;
}

export function StepDatos({ datos, onChange, onValidez }: StepDatosProps) {
  const valido =
    datos.pNombre.trim().length > 0 &&
    datos.pApellido.trim().length > 0 &&
    datos.sedeId.length > 0;

  useEffect(() => {
    onValidez(valido);
  }, [valido, onValidez]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Primer nombre *"
          name="pNombre"
          placeholder="Camila"
          value={datos.pNombre}
          autoComplete="given-name"
          onChange={(e) => onChange({ pNombre: e.target.value })}
        />
        <Input
          label="Segundo nombre"
          name="sNombre"
          placeholder="Andrea (opcional)"
          value={datos.sNombre}
          autoComplete="additional-name"
          onChange={(e) => onChange({ sNombre: e.target.value })}
        />
        <Input
          label="Apellido paterno *"
          name="pApellido"
          placeholder="Rojas"
          value={datos.pApellido}
          autoComplete="family-name"
          onChange={(e) => onChange({ pApellido: e.target.value })}
        />
        <Input
          label="Apellido materno"
          name="sApellido"
          placeholder="Paredes (opcional)"
          value={datos.sApellido}
          onChange={(e) => onChange({ sApellido: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Teléfono (opcional)"
          type="tel"
          name="telefono"
          placeholder="+569 1234 5678"
          value={datos.telefono}
          autoComplete="tel"
          onChange={(e) => onChange({ telefono: e.target.value })}
        />
        <Select
          label="Sede *"
          name="sedeId"
          value={datos.sedeId}
          onChange={(e) => onChange({ sedeId: e.target.value })}
        >
          <option value="">Selecciona tu sede</option>
          {SEDES_MOCK.map((sede) => (
            <option key={sede.id} value={sede.id}>
              {sede.nombre}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
