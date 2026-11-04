"use client";

import type { TipoPublicacion } from "@/lib/publicar/tipos";
import { FormularioPublicacion } from "./FormularioPublicacion";

interface PublicarFormularioProps {
  tipo: TipoPublicacion;
}

export function PublicarFormulario({ tipo }: PublicarFormularioProps) {
  return <FormularioPublicacion modo="crear" tipo={tipo} />;
}
