"use client";

import { useEffect } from "react";
import { Input } from "@/components/ui/Input";
import type { RegistroUsuarioBorrador } from "@/domain/dtos/registro.dto";
import { validarTelefono } from "@/lib/validators/telefono";

interface StepDatosProps {
  datos: RegistroUsuarioBorrador;
  onChange: (parcial: Partial<RegistroUsuarioBorrador>) => void;
  onValidez: (valido: boolean) => void;
}

export function StepDatos({ datos, onChange, onValidez }: StepDatosProps) {
  const validacionTelefono = validarTelefono(datos.telefono);
  const valido =
    datos.pNombre.trim().length > 0 &&
    datos.pApellido.trim().length > 0 &&
    datos.sApellido.trim().length > 0 &&
    validacionTelefono.ok;

  useEffect(() => {
    onValidez(valido);
  }, [valido, onValidez]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
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
          label="Apellido materno *"
          name="sApellido"
          placeholder="Paredes"
          value={datos.sApellido}
          onChange={(e) => onChange({ sApellido: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-1 gap-4">
        <Input
          label="Teléfono *"
          type="tel"
          name="telefono"
          placeholder="12345678"
          value={datos.telefono}
          autoComplete="tel"
          inputMode="tel"
          error={
            datos.telefono.length > 0 && !validacionTelefono.ok
              ? (validacionTelefono.error ?? undefined)
              : undefined
          }
          onChange={(e) => onChange({ telefono: e.target.value })}
        />
      </div>
    </div>
  );
}
