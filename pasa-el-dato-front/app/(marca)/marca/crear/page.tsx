import type { Metadata } from "next";
import { CrearPublicidad } from "@/components/marca";

export const metadata: Metadata = {
  title: "Crear publicidad | Pasa el Dato",
};

export default function CrearPublicidadPage() {
  return <CrearPublicidad />;
}
