"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface ModalProps {
  abierto: boolean;
  titulo: string;
  onCerrar: () => void;
  children: ReactNode;
  pie?: ReactNode;
}

export function Modal({ abierto, titulo, onCerrar, children, pie }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    panelRef.current?.focus();
    const alTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", alTeclar);
    return () => window.removeEventListener("keydown", alTeclar);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4"
      onClick={onCerrar}
      aria-hidden={false}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl border border-gray-200 bg-card shadow-lg",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold",
        )}
      >
        <h2 className="border-b border-gray-200 px-6 py-4 text-lg font-bold text-navy">{titulo}</h2>
        <div className="overflow-y-auto px-6 py-4">{children}</div>
        {pie ? <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">{pie}</div> : null}
      </div>
    </div>
  );
}
