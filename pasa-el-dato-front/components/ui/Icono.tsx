import { cn } from "@/lib/utils/cn";

// Iconos SVG inline del portal. El front no tiene librería de íconos: se
// usan trazos stroke 24x24 (patrón de PerfilError) para no sumar dependencias.
// Mismos conceptos que MaterialCommunityIcons en la app móvil.
export type IconoNombre =
  | "run"
  | "correo"
  | "telefono"
  | "sede"
  | "carrera"
  | "estrella"
  | "corazon"
  | "publicaciones"
  | "editar"
  | "contrasena"
  | "chevron"
  | "alerta"
  | "check";

const TRAZOS: Record<IconoNombre, React.ReactNode> = {
  run: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <circle cx="8.5" cy="11" r="2" />
      <path d="M5.5 16c.6-1.4 1.7-2.1 3-2.1s2.4.7 3 2.1" />
      <path d="M14 10h5M14 14h5" />
    </>
  ),
  correo: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="m3.5 7 7.5 5.5L18.5 7" />
    </>
  ),
  telefono: (
    <>
      <path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5l1.5-2 4 1.5v3c0 1-.8 1.8-1.8 1.7A16.5 16.5 0 0 1 4.8 5.3 1.7 1.7 0 0 1 6.5 3.5Z" />
    </>
  ),
  sede: (
    <>
      <path d="M12 21s6.5-5.4 6.5-10.4A6.5 6.5 0 0 0 5.5 10.6C5.5 15.6 12 21 12 21Z" />
      <circle cx="12" cy="10.4" r="2.4" />
    </>
  ),
  carrera: (
    <>
      <path d="M12 4 2.5 8.5 12 13l9.5-4.5L12 4Z" />
      <path d="M6.5 10.8V16c0 1.4 2.5 3 5.5 3s5.5-1.6 5.5-3v-5.2" />
      <path d="M21 9v6" />
    </>
  ),
  estrella: (
    <path d="m12 3.6 2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8-4.2-4.1 5.9-.9L12 3.6Z" />
  ),
  corazon: (
    <path d="M12 20s-7.5-4.6-7.5-9.5a4.5 4.5 0 0 1 7.5-3.3 4.5 4.5 0 0 1 7.5 3.3C19.5 15.4 12 20 12 20Z" />
  ),
  publicaciones: (
    <>
      <path d="M4 9.5 5.5 5h13L20 9.5" />
      <path d="M4 9.5h16V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5Z" />
      <path d="M4 9.5c0 1.4 1.2 2.5 2.7 2.5S9.4 10.9 9.4 9.5c0 1.4 1.2 2.5 2.6 2.5s2.6-1.1 2.6-2.5c0 1.4 1.2 2.5 2.7 2.5S20 10.9 20 9.5" />
      <path d="M9.5 20v-5h5v5" />
    </>
  ),
  editar: (
    <>
      <path d="M4 20h4l10-10a2.5 2.5 0 0 0-3.5-3.5L4.5 16.5 4 20Z" />
      <path d="m13.5 7 3.5 3.5" />
    </>
  ),
  contrasena: (
    <>
      <rect x="4.5" y="10.5" width="15" height="9.5" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
      <circle cx="12" cy="15.2" r="1.3" />
    </>
  ),
  chevron: <path d="m9.5 6 6 6-6 6" />,
  alerta: (
    <>
      <path d="M12 4.5 2.8 20h18.4L12 4.5Z" />
      <path d="M12 10v4.5" />
      <path d="M12 17.4h.01" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.2 12.3 2.6 2.6 5-5.2" />
    </>
  ),
};

interface IconoProps {
  nombre: IconoNombre;
  size?: number;
  className?: string;
  // Relleno para los iconos que mobile muestra sólidos (estrella, corazón).
  relleno?: boolean;
}

export function Icono({
  nombre,
  size = 20,
  className,
  relleno = false,
}: IconoProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={relleno ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={relleno ? 0 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0", className)}
    >
      {TRAZOS[nombre]}
    </svg>
  );
}
