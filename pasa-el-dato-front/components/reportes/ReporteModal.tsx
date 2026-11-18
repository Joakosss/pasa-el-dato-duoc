"use client";

import { useState } from "react";
import { Button, Modal, Select, Textarea } from "@/components/ui";
import type { MotivoReporteDTO } from "@/domain/dtos/reporte.dto";
import { REPORTE_COMENTARIO_MAX_LEN } from "@/domain/dtos/reporte.dto";

interface ReporteModalProps {
  abierto: boolean;
  titulo: string;
  descripcion: string;
  motivos: MotivoReporteDTO[];
  isCargandoMotivos: boolean;
  errorMotivos: string | null;
  onReintentarMotivos: () => void;
  isEnviando: boolean;
  errorServidor: string | null;
  onCerrar: () => void;
  onConfirmar: (motivoId: number, comentarios?: string) => void;
}

function validarMotivo(valor: string): string | null {
  if (!valor) return "Selecciona un motivo.";
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero < 1)
    return "Selecciona un motivo válido.";
  return null;
}

function validarComentarios(valor: string): string | null {
  if (valor.trim().length > REPORTE_COMENTARIO_MAX_LEN)
    return `Los comentarios no pueden exceder ${REPORTE_COMENTARIO_MAX_LEN} caracteres.`;
  return null;
}

// HU-REP-01/02 (FE02): formulario reutilizable entre publicación y usuario.
export function ReporteModal({
  abierto,
  titulo,
  descripcion,
  motivos,
  isCargandoMotivos,
  errorMotivos,
  onReintentarMotivos,
  isEnviando,
  errorServidor,
  onCerrar,
  onConfirmar,
}: ReporteModalProps) {
  const [motivoId, setMotivoId] = useState("");
  const [comentarios, setComentarios] = useState("");
  const [errorMotivo, setErrorMotivo] = useState<string | null>(null);
  const [errorComentarios, setErrorComentarios] = useState<string | null>(null);

  const cerrar = () => {
    if (isEnviando) return;
    setErrorMotivo(null);
    setErrorComentarios(null);
    onCerrar();
  };

  const confirmar = () => {
    if (isEnviando) return;
    const eMotivo = validarMotivo(motivoId);
    const eComentarios = validarComentarios(comentarios);
    setErrorMotivo(eMotivo);
    setErrorComentarios(eComentarios);
    if (eMotivo || eComentarios) return;
    const normalizados = comentarios.trim();
    onConfirmar(
      Number(motivoId),
      normalizados === "" ? undefined : normalizados,
    );
  };

  return (
    <Modal
      abierto={abierto}
      titulo={titulo}
      onCerrar={cerrar}
      pie={
        <>
          <Button
            variant="secondary"
            onClick={cerrar}
            disabled={isEnviando}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={confirmar}
            disabled={isEnviando || isCargandoMotivos}
          >
            {isEnviando ? "Enviando…" : "Confirmar reporte"}
          </Button>
        </>
      }
    >
      <p className="mb-4 text-sm text-gray-500">{descripcion}</p>
      <div className="space-y-4">
        {errorMotivos ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3">
            <p className="text-sm font-medium text-red-600">{errorMotivos}</p>
            <button
              type="button"
              onClick={onReintentarMotivos}
              className="mt-1 text-sm font-semibold text-navy underline"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <Select
            label="Motivo"
            name="motivo"
            value={motivoId}
            onChange={(e) => {
              setMotivoId(e.target.value);
              setErrorMotivo(null);
            }}
            error={errorMotivo ?? undefined}
            disabled={isEnviando || isCargandoMotivos}
          >
            <option value="">
              {isCargandoMotivos ? "Cargando motivos…" : "Selecciona un motivo"}
            </option>
            {motivos.map((motivo) => (
              <option key={motivo.id} value={motivo.id}>
                {motivo.nombre}
              </option>
            ))}
          </Select>
        )}
        <div>
          <Textarea
            label="Comentarios (opcional)"
            name="comentarios"
            placeholder="Agrega contexto para la revisión…"
            value={comentarios}
            maxLength={REPORTE_COMENTARIO_MAX_LEN + 1}
            onChange={(e) => {
              setComentarios(e.target.value);
              setErrorComentarios(null);
            }}
            error={errorComentarios ?? undefined}
            disabled={isEnviando}
          />
          <p className="mt-1 text-right text-xs text-gray-400">
            {comentarios.trim().length}/{REPORTE_COMENTARIO_MAX_LEN}
          </p>
        </div>
      </div>
      {errorServidor ? (
        <p role="alert" className="mt-2 text-sm font-medium text-red-600">
          {errorServidor}
        </p>
      ) : null}
    </Modal>
  );
}
