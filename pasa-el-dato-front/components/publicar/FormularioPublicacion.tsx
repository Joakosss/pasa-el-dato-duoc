"use client";

import { type FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { ROUTES } from "@/config/constants";
import type { PublicacionDetalleDTO } from "@/domain/dtos/publicacion.dto";
import { useBorradorPublicacion } from "@/hooks/use-borrador-publicacion";
import { useCategorias } from "@/hooks/use-categorias";
import { useSedes } from "@/hooks/use-sedes";
import { useTipoventas } from "@/hooks/use-tipoventas";
import { useUrlsImagenes } from "@/hooks/use-urls-imagenes";
import { ApiError } from "@/lib/api";
import {
  actualizarPublicacion,
  crearPublicacion,
} from "@/lib/api/publicaciones";
import { resolverUrlApi } from "@/lib/api/urls";
import { CONFIG_PUBLICACION } from "@/lib/publicar/config";
import {
  BORRADOR_PUBLICACION_INICIAL,
  type BorradorPublicacion,
  type TipoPublicacion,
} from "@/lib/publicar/tipos";
import {
  validarBorrador,
  type CampoBorrador,
} from "@/lib/publicar/validacion";
import { selectSesion, useSesionStore } from "@/stores/sesion-store";
import { PublicarVistaPrevia } from "./PublicarVistaPrevia";
import { SubirImagenes } from "./SubirImagenes";

interface FormularioPublicacionProps {
  modo: "crear" | "editar";
  tipo: TipoPublicacion;
  publicacion?: PublicacionDetalleDTO;
}

function normalizar(valor: string): string {
  return valor.trim().toLowerCase();
}

function borradorInicial(
  publicacion?: PublicacionDetalleDTO,
): BorradorPublicacion {
  if (!publicacion) return BORRADOR_PUBLICACION_INICIAL;

  return {
    titulo: publicacion.titulo,
    descripcion: publicacion.descripcion,
    precio: String(publicacion.precio),
    categoriaId: String(publicacion.categoria.id),
    sedeId: String(publicacion.sede.id),
    imagenes: [],
    fotoActiva: 0,
  };
}

function mensajeDeError(error: unknown, esEdicion: boolean): string {
  const generico = esEdicion
    ? "No pudimos guardar los cambios. Reintenta."
    : "No pudimos publicar. Reintenta.";

  if (error instanceof ApiError) {
    if (error.status === 404) {
      return esEdicion
        ? "La publicación ya no está disponible."
        : "No encontramos uno de los datos del formulario. Recarga e intenta otra vez.";
    }
    if (error.status === 403) {
      return "No tienes permisos para modificar esta publicación.";
    }
    if (error.status === 413) {
      return "Una imagen supera los 5 MB. Elige archivos más livianos.";
    }
    return error.message || generico;
  }
  return generico;
}

export function FormularioPublicacion({
  modo,
  tipo,
  publicacion,
}: FormularioPublicacionProps) {
  const config = CONFIG_PUBLICACION[tipo];
  const esEdicion = modo === "editar" && Boolean(publicacion);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { borrador, actualizar } = useBorradorPublicacion(
    borradorInicial(publicacion),
  );
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
  const tipoVentaId = esEdicion
    ? publicacion?.tipoVenta.id ?? null
    : tipoVenta?.id ?? null;
  const tipoVentaNombre = esEdicion
    ? publicacion?.tipoVenta.nombre ?? config.tipoVentaNombre
    : tipoVenta?.nombre ?? config.tipoVentaNombre;
  const categoria = categorias.find(
    (item) => String(item.id) === borrador.categoriaId,
  );
  const sede = sedes.find((item) => String(item.id) === borrador.sedeId);
  const urlsExistentes = useMemo(
    () =>
      [...(publicacion?.imagenes ?? [])]
        .sort((a, b) => a.orden - b.orden)
        .map((imagen) => resolverUrlApi(imagen.url)),
    [publicacion],
  );
  const urlsPreview =
    borrador.imagenes.length > 0 ? urlsImagenes : urlsExistentes;

  const limpiarError = (campo: CampoBorrador) => {
    setErrores((prev) => {
      if (!prev[campo]) return prev;
      const siguiente = { ...prev };
      delete siguiente[campo];
      return siguiente;
    });
  };

  const guardarMutation = useMutation({
    mutationFn: async ({ idTipoVenta }: { idTipoVenta: number }) => {
      const base = {
        titulo: borrador.titulo.trim(),
        descripcion: borrador.descripcion.trim(),
        precio: Number(borrador.precio),
        sedeId: Number(borrador.sedeId),
        categoriaId: Number(borrador.categoriaId),
        tipoVentaId: idTipoVenta,
      };

      if (esEdicion && publicacion) {
        return actualizarPublicacion(publicacion.id, {
          ...base,
          imagenes:
            borrador.imagenes.length > 0 ? borrador.imagenes : undefined,
        });
      }

      return crearPublicacion({ ...base, imagenes: borrador.imagenes });
    },
    onSuccess: (dto) => {
      if (esEdicion && publicacion) {
        queryClient.invalidateQueries({
          queryKey: ["publicacion", publicacion.id],
        });
        queryClient.invalidateQueries({ queryKey: ["publicaciones"] });
        queryClient.invalidateQueries({
          queryKey: ["publicacion-edicion", publicacion.id],
        });
        toast.success("Publicación actualizada");
        router.replace(`/product/${publicacion.id}`);
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["publicaciones"] });
      router.push(`/product/${dto.id}`);
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.status === 401) {
        router.replace(ROUTES.login);
        return;
      }
      setErrorGeneral(mensajeDeError(error, esEdicion));
    },
  });

  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (guardarMutation.isPending) return;

    setErrorGeneral(null);

    if (tipoVentaId === null) {
      setErrorGeneral("No pudimos determinar el tipo de venta. Reintenta.");
      return;
    }

    const resultado = validarBorrador(borrador, {
      tipoVentaId,
      permitirSinImagenes:
        esEdicion &&
        borrador.imagenes.length === 0 &&
        urlsExistentes.length > 0,
    });
    setErrores(resultado.errores);
    if (!resultado.valido) {
      setErrorGeneral(resultado.errorGeneral);
      return;
    }

    guardarMutation.mutate({ idTipoVenta: tipoVentaId });
  };

  const catalogosCargando =
    categoriasCargando || sedesCargando || tipoVentasCargando;
  const errorCatalogos = categoriasError ?? sedesError ?? tipoVentasError;
  const puedeEnviar =
    !guardarMutation.isPending &&
    !catalogosCargando &&
    tipoVentaId !== null;

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-navy">
            {esEdicion ? "Editar publicación" : config.titulo}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {esEdicion
              ? "Actualiza los datos y guarda los cambios."
              : config.subtitulo}
          </p>
        </div>
        <Link
          href={
            esEdicion && publicacion
              ? `/product/${publicacion.id}`
              : ROUTES.publish
          }
          className="shrink-0 text-sm font-medium text-navy transition hover:text-gold"
        >
          ← {esEdicion ? "Volver" : "Cambiar tipo"}
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
            urlsExistentes={esEdicion ? urlsExistentes : undefined}
            fotoActiva={borrador.fotoActiva}
            error={errores.imagenes}
            onCambiar={(imagenes) => {
              actualizar({ imagenes, fotoActiva: 0 });
              limpiarError("imagenes");
            }}
            onSeleccionarActiva={(fotoActiva) => actualizar({ fotoActiva })}
            onDescartarNuevas={
              esEdicion
                ? () => actualizar({ imagenes: [], fotoActiva: 0 })
                : undefined
            }
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
            {guardarMutation.isPending
              ? esEdicion
                ? "Guardando…"
                : "Publicando…"
              : esEdicion
                ? "Guardar cambios"
                : "Publicar"}
          </Button>
        </form>

        <div className="lg:sticky lg:top-32 lg:self-start">
          <PublicarVistaPrevia
            borrador={borrador}
            urlsImagenes={urlsPreview}
            nombreCategoria={
              categoria?.nombre ?? publicacion?.categoria.nombre ?? "Sin categoría"
            }
            nombreSede={sede?.nombre ?? publicacion?.sede.nombre ?? ""}
            nombreVendedor={sesion?.nombreCompleto ?? ""}
            tipoVentaNombre={tipoVentaNombre}
            alElegirFoto={(indice) => actualizar({ fotoActiva: indice })}
          />
        </div>
      </div>
    </div>
  );
}
