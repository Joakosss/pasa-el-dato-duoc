import { cn } from "@/lib/utils/cn";

type BadgeVariant =
  | "category"
  | "sponsored"
  | "promo"
  | "active"
  | "review"
  | "reported";

const VARIANTS: Record<BadgeVariant, string> = {
  category: "bg-navy text-white rounded-md text-xs font-medium",
  sponsored: "bg-gold text-navy rounded text-[10px] font-bold",
  promo: "bg-gold text-navy rounded text-xs font-bold",
  active: "bg-green-100 text-green-700 rounded-full text-xs font-medium",
  review: "bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium",
  reported: "bg-red-100 text-red-700 rounded-full text-xs font-medium",
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "category", children, className }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5", VARIANTS[variant], className)}>
      {children}
    </span>
  );
}
