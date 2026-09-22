import type { Metadata } from "next";
import { RegisterWizard } from "@/components/register/RegisterWizard";

export const metadata: Metadata = {
  title: "Registrarse | Pasa el Dato",
};

export default function RegisterPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <RegisterWizard />
      </div>
    </main>
  );
}
