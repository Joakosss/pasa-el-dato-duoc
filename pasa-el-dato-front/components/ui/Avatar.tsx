import { cn } from "@/lib/utils/cn";

type AvatarSize = "sm" | "md" | "lg" | "xl";

const SIZES: Record<AvatarSize, string> = {
  sm: "w-5 h-5 text-[10px] sm:w-6 sm:h-6 sm:text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-11 h-11 text-sm",
  xl: "w-14 h-14 text-base",
};

// "perfil": variante con acento gold (hero del perfil, espejo del mobile).
// No usar en feed/chat: ahí sigue la variante neutra por defecto.
const VARIANTES = {
  default: "bg-gray-200 text-navy",
  perfil: "bg-navy text-gold ring-2 ring-gold",
} as const;

type AvatarVariant = keyof typeof VARIANTES;

interface AvatarProps {
  name?: string;
  size?: AvatarSize;
  variant?: AvatarVariant;
  className?: string;
}

function initials(name?: string): string {
  if (!name?.trim()) return "PD";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("");
}

export function Avatar({
  name,
  size = "md",
  variant = "default",
  className,
}: AvatarProps) {
  return (
    <div
      aria-label={name ? `Avatar de ${name}` : "Avatar placeholder"}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold",
        SIZES[size],
        VARIANTES[variant],
        className,
      )}
    >
      {initials(name)}
    </div>
  );
}
