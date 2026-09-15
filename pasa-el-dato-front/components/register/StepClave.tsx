"use client";

import { useEffect, useState } from "react";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TermsContent } from "@/components/legal/terms-content";
import { validarClave } from "@/lib/validators/clave";
import { cn } from "@/lib/utils/cn";
import type { DatosRegistro } from "./types";

interface StepClaveProps {
  datos: DatosRegistro;
  onChange: (parcial: Partial<DatosRegistro>) => void;
  onValidez: (valido: boolean) => void;
}

export function StepClave({ datos, onChange, onValidez }: StepClaveProps) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const validacion = validarClave(datos.clave, datos.confirmacion);
  const valido = validacion.ok && datos.aceptaTerminos;
  const nombreResumen = [datos.pNombre, datos.pApellido].filter(Boolean).join(" ");

  useEffect(() => {
    onValidez(valido);
  }, [valido, onValidez]);

  const aceptar = () => {
    onChange({ aceptaTerminos: true });
    setModalAbierto(false);
  };

  return (
    <div className="space-y-4">
      <dl className="rounded-xl bg-surface p-4 text-sm">
        <div className="flex justify-between gap-4 py-1">
          <dt className="text-gray-400">RUT</dt>
          <dd className="font-mono font-semibold text-navy">{datos.run || "—"}</dd>
        </div>
        <div className="flex justify-between gap-4 py-1">
          <dt className="text-gray-400">Correo</dt>
          <dd className="font-semibold text-navy">{datos.correo || "—"}</dd>
        </div>
        <div className="flex justify-between gap-4 py-1">
          <dt className="text-gray-400">Nombre</dt>
          <dd className="font-semibold text-navy">{nombreResumen || "—"}</dd>
        </div>
      </dl>

      <PasswordInput
        label="Contraseña"
        name="clave"
        placeholder="Mínimo 8 caracteres"
        value={datos.clave}
        autoComplete="new-password"
        onChange={(e) => onChange({ clave: e.target.value })}
      />
      <PasswordInput
        label="Confirmar contraseña"
        name="confirmacion"
        placeholder="Repite tu contraseña"
        value={datos.confirmacion}
        autoComplete="new-password"
        error={
          datos.confirmacion.length > 0 && !validacion.ok ? (validacion.error ?? undefined) : undefined
        }
        onChange={(e) => onChange({ confirmacion: e.target.value })}
      />

      <div className="space-y-1.5">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="acepta-terminos"
            checked={datos.aceptaTerminos}
            onChange={(e) => {
              if (e.target.checked) {
                setModalAbierto(true);
              } else {
                onChange({ aceptaTerminos: false });
              }
            }}
            className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 accent-[#002b49] focus-visible:ring-2 focus-visible:ring-gold"
          />
          <label htmlFor="cursor-pointer acepta-terminos" className="text-sm text-navy">
            Acepto los{" "}
            <button
              type="button"
              onClick={() => setModalAbierto(true)}
              className="cursor-pointer font-semibold underline focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              términos y condiciones
            </button>
          </label>
        </div>
        {!datos.aceptaTerminos ? (
          <p
            aria-live="polite"
            className={cn(
              "text-xs font-medium",
              validacion.ok ? "text-red-500" : "text-gray-400",
            )}
          >
            Para continuar, abre el documento y pulsa Acepto.
          </p>
        ) : null}
      </div>

      <Modal
        abierto={modalAbierto}
        titulo="Términos y Condiciones"
        onCerrar={() => setModalAbierto(false)}
        pie={
          <>
            <Button variant="secondary" size="md" onClick={() => setModalAbierto(false)}>
              Cerrar
            </Button>
            <Button variant="primary" size="md" onClick={aceptar}>
              Acepto
            </Button>
          </>
        }
      >
        <TermsContent />
      </Modal>
    </div>
  );
}
