import type { Metadata } from "next";
import { Dato } from "@/domain/models/Dato";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Dashboard | Pasa el Dato",
};

// Ejemplo de uso de clases tipadas en un Server Component.
// Cuando exista backend, reemplazar por llamada vía repository + HttpClient.
const EXAMPLE = new Dato({
  id: "example-1",
  title: "Ejemplo de Dato",
  content: "Este es un ejemplo creado desde la clase de dominio Dato.",
  authorId: "user-1",
  tags: ["ejemplo"],
  createdAt: new Date(),
  updatedAt: new Date(),
});

export default function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <Card
        title={EXAMPLE.title}
        description={`Creado el ${formatDate(EXAMPLE.createdAt)}`}
      >
        <p>{EXAMPLE.excerpt}</p>
      </Card>
    </div>
  );
}
