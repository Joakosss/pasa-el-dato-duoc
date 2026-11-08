"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Button, Input, PasswordInput } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { iniciarSesionMarca } from "@/lib/api/auth";
import { ROUTES } from "@/config/constants";
import { validarCorreoComercial } from "@/lib/validators";
import { useSesionStore } from "@/stores/sesion-store";

// Login de marca: correo comercial externo (sin exigir @duocuc.cl).
// En éxito guarda la sesión y entra al portal de publicidad.
export function LoginMarcaForm() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [errorCorreo, setErrorCorreo] = useState<string | undefined>();
  const [errorClave, setErrorClave] = useState<string | undefined>();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: iniciarSesionMarca,
    onSuccess: (dto) => {
      useSesionStore.getState().iniciarSesion(dto);
      router.push(ROUTES.marca);
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.status === 401) {
        setErrorGeneral("Correo o contraseña incorrectos.");
        return;
      }
      if (error instanceof ApiError && error.status === 403) {
        setErrorGeneral(error.message || "Cuenta bloqueada o inactiva.");
        return;
      }
      if (error instanceof ApiError && error.status === 400) {
        setErrorGeneral(error.message || "Revisa los datos ingresados.");
        return;
      }
      setErrorGeneral("No pudimos iniciar sesión. Reintenta.");
    },
  });

  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (loginMutation.isPending) return;

    const validacion = validarCorreoComercial(correo);
    if (!validacion.ok) {
      setErrorCorreo(validacion.error);
      setErrorClave(undefined);
      setErrorGeneral(null);
      return;
    }
    if (!contrasena.trim()) {
      setErrorCorreo(undefined);
      setErrorClave("Ingresa tu contraseña.");
      setErrorGeneral(null);
      return;
    }

    setErrorCorreo(undefined);
    setErrorClave(undefined);
    setErrorGeneral(null);
    loginMutation.mutate({
      correo: validacion.normalizado ?? correo.trim().toLowerCase(),
      contrasena,
    });
  };

  return (
    <form className="space-y-4" onSubmit={enviar} noValidate>
      <Input
        label="Correo de la marca"
        type="email"
        placeholder="contacto@marca.cl"
        name="correo"
        autoComplete="email"
        value={correo}
        error={errorCorreo}
        onChange={(evento) => setCorreo(evento.target.value)}
      />
      <PasswordInput
        label="Contraseña"
        placeholder="••••••••"
        name="contrasena"
        autoComplete="current-password"
        value={contrasena}
        error={errorClave}
        onChange={(evento) => setContrasena(evento.target.value)}
      />
      {errorGeneral ? (
        <p role="alert" className="text-sm font-medium text-red-500">
          {errorGeneral}
        </p>
      ) : null}
      <Button
        variant="primary"
        size="lg"
        type="submit"
        className="w-full"
        disabled={loginMutation.isPending}
      >
        {loginMutation.isPending ? "Iniciando sesión…" : "Iniciar sesión"}
      </Button>
    </form>
  );
}
