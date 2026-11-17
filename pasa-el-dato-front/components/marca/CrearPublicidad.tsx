"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { resolverUrlApi } from "@/lib/api/urls";
import { ROUTES } from "@/config/constants";
import { useSedes } from "@/hooks/use-sedes";
import { useCrearBanner } from "@/hooks/use-crear-banner";
import { formatDate } from "@/lib/utils/format";
import { Badge, Button, Input, Textarea } from "@/components/ui";
import { SubirImagenBanner } from "./SubirImagenBanner";
import type { BannerCreadoDTO } from "@/domain/dtos/banner.dto";

interface ErroresFormulario {
  imagen?: string;
  mensaje?: string;
  fechaInicio?: string;
  fechaFin?: string;
  sedes?: string;
}

// `type="date"` entrega "YYYY-MM-DD" sin hora y el back compara Date
// exigiendo fin > inicio: el periodo se codifica en hora local, inicio a
// las 00:00:00.000 y fin a las 23:59:59.999, para que un banner de un solo
// día también sea válido.
function construirFecha(fecha: string, cierreDeDia: boolean): string {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const local = cierreDeDia
    ? new Date(anio, mes - 1, dia, 23, 59, 59, 999)
    : new Date(anio, mes - 1, dia, 0, 0, 0, 0);
  return local.toISOString();
}

// Creación de banner publicitario (HU-PU-01): imagen, mensaje, vigencia y
// sedes destinatarias. En éxito muestra el estado PENDIENTE que devuelve el
// back; "Mis publicidades" no lista banners porque no tiene endpoint propio.
export function CrearPublicidad() {
  const { sedes, isCargando, error: errorSedes, reintentar } = useSedes();
  const crearBanner = useCrearBanner();

  const [imagen, setImagen] = useState<File | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [sedesIds, setSedesIds] = useState<number[]>([]);
  const [errores, setErrores] = useState<ErroresFormulario>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [bannerCreado, setBannerCreado] = useState<BannerCreadoDTO | null>(
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
  };

  const alternarSede = (id: number, marcada: boolean) => {
    limpiarError("sedes");
    setSedesIds((previos) =>
      marcada ? [...previos, id] : previos.filter((sede) => sede !== id),
    );
  };

  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (crearBanner.isPending) return;

    const siguientes: ErroresFormulario = {};
    if (!imagen) {
      siguientes.imagen = "Adjunta una imagen para el banner.";
    }
    const mensajeLimpio = mensaje.trim();
    if (!mensajeLimpio) {
      siguientes.mensaje = "Escribe un mensaje para el banner.";
    }
    if (!fechaInicio) {
      siguientes.fechaInicio = "Selecciona la fecha de inicio.";
    }
    if (!fechaFin) {
      siguientes.fechaFin = "Selecciona la fecha de fin.";
    }
    if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
      siguientes.fechaFin =
        "La fecha de fin debe ser posterior a la fecha de inicio.";
    }
    if (sedesIds.length === 0) {
      siguientes.sedes = "Selecciona al menos una sede.";
    }

    setErrores(siguientes);
    setErrorGeneral(null);
    if (Object.keys(siguientes).length > 0 || !imagen) return;

    crearBanner.mutate(
      {
        imagen,
        mensaje: mensajeLimpio,
        fechaInicio: construirFecha(fechaInicio, false),
        fechaFin: construirFecha(fechaFin, true),
        sedes: sedesIds,
      },
      {
        onSuccess: (banner) => {
          setBannerCreado(banner);
          setImagen(null);
          setMensaje("");
          setFechaInicio("");
          setFechaFin("");
          setSedesIds([]);
          setErrores({});
          setErrorGeneral(null);
          toast.success("Banner creado. Queda pendiente de aprobación.");
        },
        onError: (error: unknown) => {
          // 400 validación/fechas/sedes, 404 sede inexistente, 413 imagen
          // sobre 5 MB: se muestra la causa real que informa el back.
          if (error instanceof ApiError) {
            if (error.status === 401) {
              toast.error("Tu sesión expiró. Inicia sesión nuevamente.");
              return;
            }
            if (error.status === 403) {
              setErrorGeneral(
                error.message || "Esta cuenta no puede crear banners.",
              );
              return;
            }
            if (
              error.status === 400 ||
              error.status === 404 ||
              error.status === 413
            ) {
              setErrorGeneral(error.message || "Revisa los datos ingresados.");
              return;
            }
          }
          setErrorGeneral("No pudimos crear el banner. Reintenta.");
        },
      },
    );
  };

  if (bannerCreado) {
    return (
      <section className="space-y-4" aria-live="polite">
        <header className="space-y-2">
          <h1 className="text-xl font-bold text-navy">Banner creado</h1>
          <div>
            <Badge variant="review">Pendiente de aprobación</Badge>
          </div>
          <p className="text-sm text-gray-500">
            Tu banner quedó registrado y será revisado por el administrador
            antes de mostrarse a la comunidad.
          </p>
        </header>

        <article className="space-y-3 rounded-2xl border border-gray-200 bg-card p-4">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolverUrlApi(bannerCreado.imagen)}
              alt="Imagen del banner creado"
              className="max-h-56 w-full object-contain"
            />
          </div>
          <p className="text-sm text-navy">{bannerCreado.mensaje}</p>
          <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-gray-500">Vigencia</dt>
              <dd className="font-medium text-navy">
                {formatDate(bannerCreado.fechaInicio)} →{" "}
                {formatDate(bannerCreado.fechaFin)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Sedes</dt>
              <dd className="font-medium text-navy">
                {bannerCreado.sedes.map((sede) => sede.nombre).join(", ")}
              </dd>
            </div>
          </dl>
        </article>

        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setBannerCreado(null)}>
            Crear otro banner
          </Button>
          <Link
            href={ROUTES.marca}
            className="inline-flex items-center justify-center rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy transition hover:bg-gold-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            Ir a mis publicidades
          </Link>
        </div>
      </section>
    );
  }

  return (
    <form className="space-y-4" onSubmit={enviar} noValidate>
      <header>
        <h1 className="text-xl font-bold text-navy">Crear publicidad</h1>
        <p className="mt-1 text-sm text-gray-500">
          Sube el banner, define el mensaje, la vigencia y las sedes.
        </p>
      </header>

      <SubirImagenBanner
        imagen={imagen}
        onCambiar={(nueva) => {
          limpiarError("imagen");
          setImagen(nueva);
        }}
        error={errores.imagen}
      />

      <Textarea
        label="Mensaje"
        name="mensaje"
        placeholder="Conoce nuestra nueva colección"
        value={mensaje}
        error={errores.mensaje}
        onChange={(evento) => {
          limpiarError("mensaje");
          setMensaje(evento.target.value);
        }}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Fecha de inicio"
          type="date"
          name="fechaInicio"
          value={fechaInicio}
          error={errores.fechaInicio}
          onChange={(evento) => {
            limpiarError("fechaInicio");
            setFechaInicio(evento.target.value);
          }}
        />
        <Input
          label="Fecha de fin"
          type="date"
          name="fechaFin"
          value={fechaFin}
          error={errores.fechaFin}
          onChange={(evento) => {
            limpiarError("fechaFin");
            setFechaFin(evento.target.value);
          }}
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-navy">
          Sedes destinatarias
        </legend>
        {isCargando ? (
          <p className="text-sm text-gray-500">Cargando sedes…</p>
        ) : null}
        {errorSedes ? (
          <p className="text-sm text-red-500">
            {errorSedes}{" "}
            <button
              type="button"
              onClick={() => reintentar()}
              className="cursor-pointer font-semibold underline focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              Reintentar
            </button>
          </p>
        ) : null}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {sedes.map((sede) => (
            <label
              key={sede.id}
              htmlFor={`sede-${sede.id}`}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-navy transition hover:border-gold"
            >
              <input
                id={`sede-${sede.id}`}
                type="checkbox"
                checked={sedesIds.includes(sede.id)}
                onChange={(evento) =>
                  alternarSede(sede.id, evento.target.checked)
                }
                className="h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 accent-[#002b49] focus-visible:ring-2 focus-visible:ring-gold"
              />
              {sede.nombre}
            </label>
          ))}
        </div>
        {errores.sedes ? (
          <span className="text-sm text-red-500">{errores.sedes}</span>
        ) : null}
      </fieldset>

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
        disabled={crearBanner.isPending}
      >
        {crearBanner.isPending ? "Creando banner…" : "Crear banner"}
      </Button>
    </form>
  );
}
