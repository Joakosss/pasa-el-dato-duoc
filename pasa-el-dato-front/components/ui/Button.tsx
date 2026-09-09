import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "destructive" | "text" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-gold text-navy hover:bg-gold-hover shadow-sm",
  secondary:
    "bg-white text-navy border border-gray-200 hover:border-gold hover:bg-gold/10",
  destructive: "bg-red-600 text-white hover:bg-red-700",
  text: "bg-transparent text-navy hover:text-gold",
  ghost: "bg-transparent text-navy hover:text-gold",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-8 py-3 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "cursor-pointer inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gold",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
}
