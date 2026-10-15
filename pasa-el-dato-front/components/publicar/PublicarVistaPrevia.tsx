"use client";

import { cn } from "@/lib/utils/cn";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import type { BorradorPublicacionMomentaneo } from "@/lib/publicar/tiposMomentaneo";

interface PublicarVistaPreviaProps {
  borrador: BorradorPublicacionMomentaneo;
  nombreCategoria: string;
  nombreSede: string;
  nombreVendedor: string;
  tipoVentaFijo: string;
  alElegirFoto: (indice: number) => void;
}

function formatearPrecioCLP(valor: string): string | null {
  const numero = Number.parseInt(valor.replace(/\D/g, ""), 10);
  if (!Number.isFinite(numero) || numero <= 0) return null;
  return `$${numero.toLocaleString("es-CL")}`;
}

// TODO[MOMENTANEO]: preview solo visual sin contrato back. Replica estructura /product/[id] con borrador local.
export function PublicarVistaPrevia({
  borrador,
  nombreCategoria,
  nombreSede,
  nombreVendedor,
  tipoVentaFijo,
  alElegirFoto,
}: PublicarVistaPreviaProps) {
  const precio = formatearPrecioCLP(borrador.precio);
  const tieneTitulo = borrador.titulo.trim().length > 0;
  const tienePrecio = precio !== null;
  const tieneDescripcion = borrador.descripcion.trim().length > 0;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-card">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <span className="text-sm font-semibold text-navy">Así se verá tu aviso</span>
        <Badge variant="promo">
          <span className="mr-1.5 inline-block h-2 w-2 animate-pulse rounded-full bg-navy" aria-hidden="true" />
          Vista previa en vivo
        </Badge>
      </div>

      <div className="p-4">
        <div className="mb-3">
          <div
            role="img"
            aria-label={`Foto ${borrador.fotoActivaMomentaneo + 1} de muestra`}
            className="flex h-56 w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gold/60 bg-surface text-navy"
          >
            <svg
              className="h-10 w-10 text-navy/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M4 16l4-4 4 4 4-6 4 4M4 20h16M4 20V6a1 1 0 011-1h14a1 1 0 011 1v14"
              />
            </svg>
            <span className="text-xs font-semibold">
              Foto {borrador.fotoActivaMomentaneo + 1} (mock)
            </span>
            <span className="text-[11px] text-gray-400">
              Toca una miniatura para interactuar
            </span>
          </div>
          <div className="mt-2 flex gap-2" role="group" aria-label="Elegir foto de muestra">
            {[0, 1, 2, 3].map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => alElegirFoto(i)}
                aria-label={`Ver foto ${i + 1}`}
                aria-pressed={i === borrador.fotoActivaMomentaneo}
                className={cn(
                  "flex h-14 flex-1 cursor-pointer items-center justify-center rounded-lg border-2 bg-gray-200 text-xs font-bold text-navy/50 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                  i === borrador.fotoActivaMomentaneo
                    ? "border-gold ring-2 ring-gold/40"
                    : "border-gray-200 hover:border-gold",
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-2">
          <Badge variant="category">{nombreCategoria}</Badge>
        </div>

        {tieneTitulo ? (
          <h3 className="rounded-lg px-1 text-base font-bold text-navy ring-2 ring-gold/70">
            {borrador.titulo}
          </h3>
        ) : (
          <div className="h-5 w-2/3 rounded bg-gray-100" aria-hidden="true" />
        )}

        {tienePrecio ? (
          <p className="mt-1 rounded-lg px-1 text-lg font-bold text-navy ring-2 ring-gold/70">
            {precio}
          </p>
        ) : (
          <div className="mt-2 h-6 w-32 rounded bg-gray-100" aria-hidden="true" />
        )}

        <p className="mt-2 text-xs text-gray-500">
          {nombreSede || "Elige tu sede →"} <span className="text-gray-300">|</span> {tipoVentaFijo}{" "}
          <span className="text-gray-300">|</span> Borrador
        </p>

        <div className="mt-4">
          <h4 className="mb-1 text-sm font-semibold text-navy">Descripción</h4>
          {tieneDescripcion ? (
            <p className="whitespace-pre-line rounded-lg bg-gold/10 px-2 py-1 text-sm text-navy ring-1 ring-gold/60">
              {borrador.descripcion}
            </p>
          ) : (
            <div className="space-y-2" aria-hidden="true">
              <div className="h-3 w-full rounded bg-gray-100" />
              <div className="h-3 w-5/6 rounded bg-gray-100" />
            </div>
          )}
        </div>

        <div className="mt-4 rounded-xl bg-surface p-3">
          <h4 className="mb-2 text-sm font-semibold text-navy">Detalles del aviso</h4>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-gray-400">Categoría</dt>
              <dd className="font-medium text-navy">{nombreCategoria}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Tipo</dt>
              <dd className="font-medium text-navy">{tipoVentaFijo}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Sede</dt>
              <dd className="font-medium text-navy">{nombreSede || "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Estado</dt>
              <dd className="font-medium text-navy">Borrador</dd>
            </div>
          </dl>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-xl border border-gray-200 p-3">
          <Avatar name={nombreVendedor} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-navy">
              {nombreVendedor || "Tu nombre aquí"}
            </p>
            <p className="text-xs text-gray-400">Vendedor (tu sesión)</p>
          </div>
        </div>

        <p className="mt-3 text-center text-[11px] text-gray-400">
          ✦ Todo lo que escribas se refleja aquí al instante ✦
        </p>
      </div>
    </div>
  );
}
