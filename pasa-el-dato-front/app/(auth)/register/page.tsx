import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Registrarse | Pasa el Dato",
};

export default function RegisterPage() {
  return (
    <div className="mx-auto w-full max-w-md py-16">
      <Card title="Crear cuenta" description="Regístrate para empezar a pasar datos.">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Formulario de registro pendiente de conectar al backend.
        </p>
      </Card>
    </div>
  );
}
