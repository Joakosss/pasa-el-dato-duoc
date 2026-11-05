"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface EnvioMensajeFormProps {
  enviando: boolean;
  deshabilitado?: boolean;
  onEnviar: (texto: string) => Promise<void>;
}

export function EnvioMensajeForm({
  enviando,
  deshabilitado = false,
  onEnviar,
}: EnvioMensajeFormProps) {
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recortado = texto.trim();
  const puedeEnviar =
    !deshabilitado && !enviando && recortado.length > 0 && texto.length <= 2000;

  const enviar = async () => {
    if (!puedeEnviar) return;
    setError(null);
    try {
      await onEnviar(recortado);
      setTexto("");
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "No pudimos enviar el mensaje. Reintenta.",
      );
    }
  };

  return (
    <form
      aria-label="Enviar mensaje"
      className="border-t border-gray-200 bg-card p-3"
      onSubmit={(e) => {
        e.preventDefault();
        void enviar();
      }}
    >
      <label htmlFor="chat-mensaje" className="sr-only">
        Escribe un mensaje
      </label>
      <div className="flex items-end gap-2">
        <textarea
          id="chat-mensaje"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={2}
          maxLength={2001}
          placeholder="Escribe un mensaje…"
          disabled={deshabilitado || enviando}
          className="max-h-32 min-h-10 flex-1 resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-navy placeholder:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-60"
        />
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={!puedeEnviar}
          aria-disabled={!puedeEnviar}
        >
          {enviando ? "Enviando…" : "Enviar"}
        </Button>
      </div>
      {texto.length > 2000 ? (
        <p role="alert" className="mt-1 text-xs font-medium text-red-600">
          El mensaje no puede superar los 2000 caracteres.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-1 text-xs font-medium text-red-600">
          {error}
        </p>
      ) : null}
    </form>
  );
}
