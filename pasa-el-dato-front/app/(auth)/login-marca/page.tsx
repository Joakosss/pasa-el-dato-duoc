import type { Metadata } from "next";
import Link from "next/link";
import { ROUTES } from "@/config";
import { LoginMarcaForm } from "@/components/auth/LoginMarcaForm";

export const metadata: Metadata = {
  title: "Acceso de marca | Pasa el Dato",
};

export default function LoginMarcaPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-card p-8 shadow-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-navy">
              <span className="text-lg font-bold text-gold">PD</span>
            </div>
            <h1 className="text-xl font-bold text-navy">Acceso de marca</h1>
            <p className="mt-1 text-sm text-gray-400">
              Ingresa con el correo de tu marca para gestionar tus publicidades.
            </p>
          </div>

          <LoginMarcaForm />

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-400">¿Eres estudiante? </span>
            <Link
              href={ROUTES.login}
              className="font-semibold text-navy transition hover:text-gold"
            >
              Inicia sesión aquí
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
