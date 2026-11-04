"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui";
import { usePropiedadPublicacion } from "@/hooks/use-propiedad-publicacion";
import { EliminarPublicacionModal } from "./EliminarPublicacionModal";

interface AccionesPublicacionProps {
  id: string;
}

const CLASE_ENLACE_SECUNDARIO =
  "inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-8 py-3 text-sm font-semibold text-navy transition-colors hover:border-gold hover:bg-gold/10 focus:outline-none focus:ring-2 focus:ring-gold";

export function AccionesPublicacion({ id }: AccionesPublicacionProps) {
  const { esPropia, verificando } = usePropiedadPublicacion(id);
  const [modalAbierto, setModalAbierto] = useState(false);

  if (verificando) {
    return (
      <div
        aria-hidden="true"
        className="h-12 w-full animate-pulse rounded-lg bg-gray-100"
      />
    );
  }

  if (esPropia) {
    return (
      <>
        <div className="flex gap-3">
          <Link href={`/product/${id}/editar`} className={CLASE_ENLACE_SECUNDARIO}>
            Editar
          </Link>
          <Button
            variant="destructive"
            size="lg"
            className="flex-1"
            onClick={() => setModalAbierto(true)}
          >
            Eliminar
          </Button>
        </div>

        <EliminarPublicacionModal
          abierto={modalAbierto}
          onCerrar={() => setModalAbierto(false)}
          publicacionId={id}
        />
      </>
    );
  }

  return (
    <>
      <Button
        variant="primary"
        size="lg"
        className="w-full py-3.5"
        disabled
        title="El chat con el vendedor estará disponible próximamente"
      >
        Contactar vendedor
      </Button>
      <p className="mt-2 text-center text-xs text-gray-400">
        El chat con el vendedor estará disponible próximamente.
      </p>
    </>
  );
}
