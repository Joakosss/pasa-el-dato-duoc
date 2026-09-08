import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Ingresar | Pasa el Dato",
};

export default function LoginPage() {
  return (
    <div className="mx-auto w-full max-w-md py-16">
      <Card title="Ingresar" description="Accede a tu cuenta para continuar.">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Formulario de login pendiente de conectar al backend.
        </p>
      </Card>
    </div>
  );
}
