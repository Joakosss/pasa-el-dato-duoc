import { Avatar } from "@/components/ui/Avatar";

export function SellerCard() {
  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold text-navy">Vendedor</h3>
      <div className="flex items-center gap-3">
        <Avatar size="lg" />
        <div className="min-w-0 flex-1">
          <div className="h-4 w-24 rounded bg-gray-100" aria-hidden="true" />
          <div className="mt-1 h-3 w-32 rounded bg-gray-100" aria-hidden="true" />
        </div>
        <span className="text-sm font-semibold text-navy">—</span>
      </div>
    </div>
  );
}
