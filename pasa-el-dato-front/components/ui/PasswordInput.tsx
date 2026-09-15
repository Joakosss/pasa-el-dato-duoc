"use client";

import { useEffect, useRef, useState, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
  /** Milisegundos que la clave queda visible tras pulsar el ojo. Default 5000. */
  duracionVisibleMs?: number;
}

function IconoOjo({ tachado }: { tachado: boolean }) {
  return (
    <svg
      aria-hidden
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
      {tachado ? <line x1="3" y1="3" x2="21" y2="21" /> : null}
    </svg>
  );
}

export function PasswordInput({
  label,
  error,
  id,
  duracionVisibleMs = 5000,
  className,
  name,
  ...props
}: PasswordInputProps) {
  const inputId = id ?? name;
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const ocultar = () => {
    if (timer.current) clearTimeout(timer.current);
    setVisible(false);
  };

  const alternar = () => {
    if (visible) {
      ocultar();
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    setVisible(true);
    timer.current = setTimeout(() => setVisible(false), duracionVisibleMs);
  };

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-navy">
          {label}
        </label>
      ) : null}
      <div className="relative w-full">
        <input
          id={inputId}
          name={name}
          type={visible ? "text" : "password"}
          className={cn(
            "w-full rounded-xl border border-gray-200 bg-white py-2.5 pr-11 pl-3.5 text-sm text-navy outline-none transition placeholder:text-gray-300 focus:border-transparent focus:ring-2 focus:ring-gold",
            error && "border-red-500",
            className,
          )}
          {...props}
        />
        <button
          type="button"
          onClick={alternar}
          aria-pressed={visible}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          title={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 transition-colors hover:text-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          <IconoOjo tachado={!visible} />
        </button>
      </div>
      {error ? <span className="text-sm text-red-500">{error}</span> : null}
    </div>
  );
}
