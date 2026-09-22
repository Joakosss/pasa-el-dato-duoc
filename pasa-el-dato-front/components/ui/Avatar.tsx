import { cn } from "@/lib/utils/cn";

type AvatarSize = "sm" | "md" | "lg" | "xl";

const SIZES: Record<AvatarSize, string> = {
  sm: "w-5 h-5 text-[10px] sm:w-6 sm:h-6 sm:text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-11 h-11 text-sm",
  xl: "w-14 h-14 text-base",
};

interface AvatarProps {
  name?: string;
  size?: AvatarSize;
  className?: string;
}

function initials(name?: string): string {
  if (!name?.trim()) return "PD";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("");
}

export function Avatar({ name, size = "md", className }: AvatarProps) {
  return (
    <div
      aria-label={name ? `Avatar de ${name}` : "Avatar placeholder"}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-gray-200 font-bold text-navy",
        SIZES[size],
        className,
      )}
    >
      {initials(name)}
    </div>
  );
}
