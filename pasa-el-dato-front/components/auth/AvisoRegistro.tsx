"use client";

import { useSearchParams } from "next/navigation";

// Banner post-registro. Solo visible con ?registrado=1 en la URL.
export function AvisoRegistro() {
  const params = useSearchParams();
  if (params.get("registrado") !== "1") return null;
  return (
    <p
      role="status"
      className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700"
    >
      ✓ Cuenta creada. Inicia sesión con tu correo y contraseña.
    </p>
  );
}
