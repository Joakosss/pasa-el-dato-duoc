"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { ROUTES } from "@/config/constants";
import { useBorradorPublicacion } from "@/hooks/use-borrador-publicacion";
import { useCategorias } from "@/hooks/use-categorias";
import { useSedes } from "@/hooks/use-sedes";
import { useTipoventas } from "@/hooks/use-tipoventas";
import { useUrlsImagenes } from "@/hooks/use-urls-imagenes";
import { ApiError } from "@/lib/api";
import { crearPublicacion } from "@/lib/api/publicaciones";
import { CONFIG_PUBLICACION } from "@/lib/publicar/config";
import type { TipoPublicacion } from "@/lib/publicar/tipos";
import {
  validarBorrador,
  type CampoBorrador,
} from "@/lib/publicar/validacion";
import { selectSesion, useSesionStore } from "@/stores/sesion-store";
import { PublicarVistaPrevia } from "./PublicarVistaPrevia";
import { SubirImagenes } from "./SubirImagenes";

interface PublicarFormularioProps {
  tipo: TipoPublicacion;
}

function normalizar(valor: string): string {
  return valor.trim().toLowerCase();
}

function mensajeDeError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return "No encontramos uno de los datos del formulario. Recarga e intenta otra vez.";
    }
    if (error.status === 413) {
      return "Una imagen supera los 5 MB. Elige archivos más livianos.";
    }
    return error.message || "No pudimos publicar. Reintenta.";
  }
  return "No pudimos publicar. Reintenta.";
}

export function PublicarFormulario({ tipo }: PublicarFormularioProps) {
  const config = CONFIG_PUBLICACION[tipo];
  const router = useRouter();
  const queryClient = useQueryClient();
  const { borrador, actualizar } = useBorradorPublicacion();
  const { categorias, isCargando: categoriasCargando, error: categoriasError } =
    useCategorias();
  const { tipoventas, isCargando: tipoVentasCargando, error: tipoVentasError } =
    useTipoventas();
  const { sedes, isCargando: sedesCargando, error: sedesError } = useSedes();
  const sesion = useSesionStore(selectSesion);
  const urlsImagenes = useUrlsImagenes(borrador.imagenes);

  const [errores, setErrores] = useState<
    Partial<Record<CampoBorrador, string>>
  >({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const tipoVenta = tipoventas.find(
    (item) => normalizar(item.nombre) === normalizar(config.tipoVentaNombre),
  );
  const categoria = categorias.find(
    (item) => String(item.id) === borrador.categoriaId,
  );
  const sede = sedes.find((item) => String(item.id) === borrador.sedeId);

  const limpiarError = (campo: CampoBorrador) => {
    setErrores((prev) => {
      if (!prev[campo]) return prev;
      const siguiente = { ...prev };
      delete siguiente[campo];
      return siguiente;
    });
  };

  const crearMutation = useMutation({
    mutationFn: crearPublicacion,
    onSuccess: (dto) => {
      queryClient.invalidateQueries({ queryKey: ["publicaciones"] });
      router.push(`/product/${dto.id}`);
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.status === 401) {
        router.replace(ROUTES.login);
        return;
      }
      setErrorGeneral(mensajeDeError(error));
    },
  });

  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (crearMutation.isPending) return;

    setErrorGeneral(null);

    if (!tipoVenta) {
      setErrorGeneral("No pudimos determinar el tipo de venta. Reintenta.");
      return;
    }

    const resultado = validarBorrador(borrador, { tipoVentaId: tipoVenta.id });
    setErrores(resultado.errores);
    if (!resultado.valido) {
      setErrorGeneral(resultado.errorGeneral);
      return;
    }

    crearMutation.mutate({
      titulo: borrador.titulo.trim(),
      descripcion: borrador.descripcion.trim(),
      precio: Number(borrador.precio),
      sedeId: Number(borrador.sedeId),
      categoriaId: Number(borrador.categoriaId),
      tipoVentaId: tipoVenta.id,
      imagenes: borrador.imagenes,
    });
  };

  const catalogosCargando =
    categoriasCargando || sedesCargando || tipoVentasCargando;
  const errorCatalogos = categoriasError ?? sedesError ?? tipoVentasError;
  const puedeEnviar =
    !crearMutation.isPending && !catalogosCargando && Boolean(tipoVenta);

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-navy">{config.titulo}</h1>
          <p className="mt-1 text-sm text-gray-500">{config.subtitulo}</p>
        </div>
        <Link
          href={ROUTES.publish}
          className="shrink-0 text-sm font-medium text-navy transition hover:text-gold"
        >
          ← Cambiar tipo
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <form
          className="space-y-4 rounded-xl border border-gray-200 bg-card p-4"
          onSubmit={enviar}
        >
          <Input
            label="Título"
            name="titulo"
            placeholder={config.placeholderTitulo}
            value={borrador.titulo}
            maxLength={100}
            error={errores.titulo}
            onChange={(e) => {
              actualizar({ titulo: e.target.value });
              limpiarError("titulo");
            }}
          />
          <Textarea
            label="Descripción"
            name="descripcion"
            placeholder={config.placeholderDescripcion}
            value={borrador.descripcion}
            rows={4}
            maxLength={2000}
            error={errores.descripcion}
            onChange={(e) => {
              actualizar({ descripcion: e.target.value });
              limpiarError("descripcion");
            }}
          />
          <Input
            label="Precio (CLP)"
            name="precio"
            type="number"
            inputMode="numeric"
            min={1}
            placeholder={config.placeholderPrecio}
            value={borrador.precio}
            error={errores.precio}
            onChange={(e) => {
              actualizar({ precio: e.target.value });
              limpiarError("precio");
            }}
          />
          <Select
            label="Categoría"
            name="categoria"
            value={borrador.categoriaId}
            disabled={categoriasCargando}
            error={errores.categoriaId}
            onChange={(e) => {
              actualizar({ categoriaId: e.target.value });
              limpiarError("categoriaId");
            }}
          >
            <option value="">
              {categoriasCargando
                ? "Cargando categorías…"
                : "Selecciona una categoría"}
            </option>
            {categorias.map((item) => (
              <option key={item.id} value={String(item.id)}>
                {item.nombre}
              </option>
            ))}
          </Select>
          <Select
            label="Sede"
            name="sede"
            value={borrador.sedeId}
            disabled={sedesCargando}
            error={errores.sedeId}
            onChange={(e) => {
              actualizar({ sedeId: e.target.value });
              limpiarError("sedeId");
            }}
          >
            <option value="">
              {sedesCargando ? "Cargando sedes…" : "Elige tu sede"}
            </option>
            {sedes.map((item) => (
              <option key={item.id} value={String(item.id)}>
                {item.nombre}
              </option>
            ))}
          </Select>

          <SubirImagenes
            imagenes={borrador.imagenes}
            urls={urlsImagenes}
            fotoActiva={borrador.fotoActiva}
            error={errores.imagenes}
            onCambiar={(imagenes) => {
              actualizar({ imagenes, fotoActiva: 0 });
              limpiarError("imagenes");
            }}
            onSeleccionarActiva={(fotoActiva) => actualizar({ fotoActiva })}
          />

          {errorCatalogos ? (
            <p role="alert" className="text-sm font-medium text-red-500">
              {errorCatalogos}
            </p>
          ) : null}
          {errorGeneral ? (
            <p role="alert" className="text-sm font-medium text-red-500">
              {errorGeneral}
            </p>
          ) : null}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={!puedeEnviar}
          >
            {crearMutation.isPending ? "Publicando…" : "Publicar"}
          </Button>
        </form>

        <div className="lg:sticky lg:top-32 lg:self-start">
          <PublicarVistaPrevia
            borrador={borrador}
            urlsImagenes={urlsImagenes}
            nombreCategoria={categoria?.nombre ?? "Sin categoría"}
            nombreSede={sede?.nombre ?? ""}
            nombreVendedor={sesion?.nombreCompleto ?? ""}
            tipoVentaNombre={tipoVenta?.nombre ?? config.tipoVentaNombre}
            alElegirFoto={(indice) => actualizar({ fotoActiva: indice })}
          />
        </div>
      </div>
    </div>
  );
}
