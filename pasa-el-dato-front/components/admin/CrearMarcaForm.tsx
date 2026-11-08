"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, Input, PasswordInput } from "@/components/ui";
import { ROUTES } from "@/config/constants";
import { useCrearMarcaAdmin } from "@/hooks/use-crear-marca-admin";
import { ApiError } from "@/lib/api";
import {
  validarContrasenaMvp,
  validarCorreoComercial,
  validarTelefono,
} from "@/lib/validators";
import { useSesionStore } from "@/stores/sesion-store";
import type { MarcaAdminCreadaDTO } from "@/domain/dtos/marca.dto";

interface ErroresFormulario {
  nombre?: string;
  correo?: string;
  telefono?: string;
  contrasenaInicial?: string;
  confirmacion?: string;
}

export function CrearMarcaForm() {
  const router = useRouter();
  const cerrarSesion = useSesionStore((estado) => estado.cerrarSesion);
  const crearMarca = useCrearMarcaAdmin();

  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [contrasenaInicial, setContrasenaInicial] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [errores, setErrores] = useState<ErroresFormulario>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [marcaCreada, setMarcaCreada] = useState<MarcaAdminCreadaDTO | null>(
    null,
  );

  const limpiarError = (campo: keyof ErroresFormulario) => {
    setErrores((previos) => {
      if (!previos[campo]) return previos;
      const siguientes = { ...previos };
      delete siguientes[campo];
      return siguientes;
    });
    if (errorGeneral) setErrorGeneral(null);
    if (marcaCreada) setMarcaCreada(null);
  };

  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (crearMarca.isPending) return;

    setErrorGeneral(null);
    setMarcaCreada(null);

    const nombreLimpio = nombre.trim();
    const correoValidado = validarCorreoComercial(correo);
    const telefonoValidado = validarTelefono(telefono);
    const claveValidada = validarContrasenaMvp(contrasenaInicial);

    const siguientesErrores: ErroresFormulario = {};
    if (!nombreLimpio) {
      siguientesErrores.nombre = "Ingresa el nombre de la marca.";
    } else if (nombreLimpio.length > 150) {
      siguientesErrores.nombre = "El nombre no puede exceder 150 caracteres.";
    }
    if (!correoValidado.ok) {
      siguientesErrores.correo = correoValidado.error;
    }
    if (!telefonoValidado.ok) {
      siguientesErrores.telefono = telefonoValidado.error;
    }
    if (!claveValidada.ok) {
      siguientesErrores.contrasenaInicial = claveValidada.error;
    }
    if (!confirmacion) {
      siguientesErrores.confirmacion = "Confirma la contraseña inicial.";
    } else if (contrasenaInicial !== confirmacion) {
      siguientesErrores.confirmacion = "Las contraseñas no coinciden.";
    }

    setErrores(siguientesErrores);
    if (Object.keys(siguientesErrores).length > 0) return;

    crearMarca.mutate(
      {
        nombre: nombreLimpio,
        correo: correoValidado.normalizado ?? correo.trim().toLowerCase(),
        telefono: telefonoValidado.normalizado ?? telefono.trim(),
        contrasenaInicial,
      },
      {
        onSuccess: (data) => {
          setMarcaCreada(data);
          setNombre("");
          setCorreo("");
          setTelefono("");
          setContrasenaInicial("");
          setConfirmacion("");
          setErrores({});
          toast.success(`Marca "${data.nombre}" creada y autorizada.`);
        },
        onError: (error) => {
          if (error instanceof ApiError) {
            if (error.status === 401) {
              toast.error("Tu sesión expiró. Inicia sesión nuevamente.");
              cerrarSesion();
              router.replace(ROUTES.login);
              return;
            }
            if (error.status === 403) {
              setErrorGeneral(
                "No tienes permisos para crear cuentas de marca.",
              );
              return;
            }
            if (error.status === 409) {
              setErrores((previos) => ({
                ...previos,
                correo: "El correo ya está registrado.",
              }));
              return;
            }
            if (error.status === 400 || error.status === 422) {
              setErrorGeneral(error.message || "Revisa los datos ingresados.");
              return;
            }
          }
          setErrorGeneral("No pudimos crear la cuenta de marca. Reintenta.");
        },
      },
    );
  };

  return (
    <section className="mx-auto w-full max-w-2xl">
      <header>
        <h2 className="text-lg font-bold text-navy">Crear cuenta de marca</h2>
        <p className="mt-1 text-sm text-gray-500">
          La cuenta se crea activa y autorizada con rol Marca. La contraseña
          inicial se entrega a la marca fuera del sistema.
        </p>
      </header>

      {marcaCreada ? (
        <div
          role="status"
          className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4"
        >
          <p className="text-sm font-semibold text-green-800">
            {marcaCreada.nombre} fue creada y autorizada.
          </p>
          <p className="mt-1 text-sm text-green-700">
            {marcaCreada.correo} · Rol Marca · Cuenta activa
          </p>
          <p className="mt-1 text-xs text-green-700">
            La contraseña inicial no se muestra. Entrégala a la marca fuera del
            sistema.
          </p>
        </div>
      ) : null}

      <form
        noValidate
        onSubmit={enviar}
        className="mt-5 space-y-4 rounded-2xl border border-gray-200 bg-card p-6 shadow-sm sm:p-8"
      >
        <fieldset disabled={crearMarca.isPending} className="space-y-4">
          <Input
            label="Nombre de la marca"
            name="nombreMarca"
            placeholder="Ej. Marca Duoc"
            autoComplete="organization"
            value={nombre}
            error={errores.nombre}
            onChange={(evento) => {
              setNombre(evento.target.value);
              limpiarError("nombre");
            }}
          />
          <Input
            label="Correo de la marca"
            name="correoMarca"
            type="email"
            placeholder="contacto@marca.cl"
            autoComplete="email"
            value={correo}
            error={errores.correo}
            onChange={(evento) => {
              setCorreo(evento.target.value);
              limpiarError("correo");
            }}
          />
          <Input
            label="Teléfono"
            name="telefonoMarca"
            type="tel"
            inputMode="tel"
            placeholder="912345678"
            autoComplete="tel"
            value={telefono}
            error={errores.telefono}
            onChange={(evento) => {
              setTelefono(evento.target.value);
              limpiarError("telefono");
            }}
          />
          <PasswordInput
            label="Contraseña inicial"
            name="contrasenaInicialMarca"
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
            value={contrasenaInicial}
            error={errores.contrasenaInicial}
            onChange={(evento) => {
              setContrasenaInicial(evento.target.value);
              limpiarError("contrasenaInicial");
            }}
          />
          <PasswordInput
            label="Confirmar contraseña inicial"
            name="confirmacionContrasenaMarca"
            placeholder="Repite la contraseña"
            autoComplete="new-password"
            value={confirmacion}
            error={errores.confirmacion}
            onChange={(evento) => {
              setConfirmacion(evento.target.value);
              limpiarError("confirmacion");
            }}
          />
        </fieldset>

        {errorGeneral ? (
          <p role="alert" className="text-sm font-medium text-red-600">
            {errorGeneral}
          </p>
        ) : null}

        <div className="flex justify-end border-t border-gray-100 pt-5">
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={crearMarca.isPending}
          >
            {crearMarca.isPending ? "Creando cuenta…" : "Crear cuenta de marca"}
          </Button>
        </div>
      </form>
    </section>
  );
}
