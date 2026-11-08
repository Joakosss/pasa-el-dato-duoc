import type { Metadata } from "next";
import { MisPublicidades } from "@/components/marca";

export const metadata: Metadata = {
  title: "Mis publicidades | Pasa el Dato",
};

export default function MisPublicidadesPage() {
  return <MisPublicidades />;
}
