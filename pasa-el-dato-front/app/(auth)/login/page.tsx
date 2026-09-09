import type { Metadata } from "next";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ROUTES } from "@/config";
export const metadata: Metadata = {
  title: "Iniciar sesión | Pasa el Dato",
};

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-card p-8 shadow-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-navy">
              <span className="text-lg font-bold text-gold">PD</span>
            </div>
            <h1 className="text-xl font-bold text-navy">Iniciar sesión</h1>
            <p className="mt-1 text-sm text-gray-400">Bienvenido de vuelta a Pasa el Dato</p>
          </div>

          <form className="space-y-4">
            <Input
              label="Correo institucional"
              type="email"
              placeholder="ejemplo@correo.duoc.cl"
              name="email"
            />
            <Input label="Contraseña" type="password" placeholder="••••••••" name="password" />
            {/* <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-500">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-navy focus:ring-gold"
              />
              Recordarme
            </label> */}
            <Button variant="primary" size="lg" type="submit" className="w-full">
              Iniciar sesión
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400">o</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* <Button variant="secondary" size="lg" className="w-full">
            Continuar con cuenta Duoc_UC
          </Button> */}

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-400">¿No tienes cuenta? </span>
            <Link href={ROUTES.register} className="font-semibold text-navy">Regístrate aquí</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
