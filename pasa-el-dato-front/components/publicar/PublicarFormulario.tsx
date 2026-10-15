"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { ROUTES } from "@/config/constants";
import { useSedes } from "@/hooks/use-sedes";
import { useBorradorPublicacionMomentaneo } from "@/hooks/use-borrador-publicacion-momentaneo";
import { CONFIG_PUBLICACION_MOMENTANEO } from "@/lib/publicar/config";
import {
  CATEGORIAS_PUBLICACION_MOMENTANEO,
  type TipoPublicacionMomentaneo,
} from "@/lib/publicar/tiposMomentaneo";
import { selectSesion, useSesionStore } from "@/stores/sesion-store";
import { PublicarVistaPrevia } from "./PublicarVistaPrevia";

interface PublicarFormularioProps {
  tipo: TipoPublicacionMomentaneo;
}

// TODO[MOMENTANEO]: formulario solo visual sin contrato back. Conectar a POST /publicaciones cuando exista.
export function PublicarFormulario({ tipo }: PublicarFormularioProps) {
  const config = CONFIG_PUBLICACION_MOMENTANEO[tipo];
  const { borrador, actualizar } = useBorradorPublicacionMomentaneo();
  const { sedes, isCargando: sedesCargando } = useSedes();
  const sesion = useSesionStore(selectSesion);

  const categoria = CATEGORIAS_PUBLICACION_MOMENTANEO.find(
    (c) => c.id === borrador.categoriaId,
  );
  const sede = sedes.find((s) => String(s.id) === borrador.sedeId);

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
          onSubmit={(e) => e.preventDefault()}
        >
          <Input
            label="Título"
            name="titulo"
            placeholder={config.placeholderTitulo}
            value={borrador.titulo}
            maxLength={80}
            onChange={(e) => actualizar({ titulo: e.target.value })}
          />
          <Textarea
            label="Descripción"
            name="descripcion"
            placeholder={config.placeholderDescripcion}
            value={borrador.descripcion}
            rows={4}
            maxLength={500}
            onChange={(e) => actualizar({ descripcion: e.target.value })}
          />
          <Input
            label="Precio (CLP)"
            name="precio"
            type="number"
            inputMode="numeric"
            min={0}
            placeholder={config.placeholderPrecio}
            value={borrador.precio}
            onChange={(e) => actualizar({ precio: e.target.value })}
          />
          <Select
            label="Categoría"
            name="categoria"
            value={borrador.categoriaId}
            onChange={(e) => actualizar({ categoriaId: e.target.value })}
          >
            {CATEGORIAS_PUBLICACION_MOMENTANEO.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>
          <Select
            label="Sede"
            name="sede"
            value={borrador.sedeId}
            disabled={sedesCargando}
            onChange={(e) => actualizar({ sedeId: e.target.value })}
          >
            <option value="">
              {sedesCargando ? "Cargando sedes…" : "Elige tu sede"}
            </option>
            {sedes.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.nombre}
              </option>
            ))}
          </Select>

          <div className="rounded-lg bg-surface p-3 text-xs text-gray-500">
            Tipo: <span className="font-semibold text-navy">{config.fkTipoVentaFijo}</span>{" "}
            (fijo por ruta) <span className="text-gray-300">|</span> Estado: Borrador{" "}
            <span className="text-gray-300">|</span> Vistas: 0
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            disabled
            title="Solo visual en esta etapa"
          >
            Publicar (próximamente)
          </Button>
        </form>

        <div className="lg:sticky lg:top-32 lg:self-start">
          <PublicarVistaPrevia
            borrador={borrador}
            nombreCategoria={categoria?.nombre ?? "Todas las categorías"}
            nombreSede={sede?.nombre ?? ""}
            nombreVendedor={sesion?.nombreCompleto ?? ""}
            tipoVentaFijo={config.fkTipoVentaFijo}
            alElegirFoto={(indice) =>
              actualizar({ fotoActivaMomentaneo: indice })
            }
          />
        </div>
      </div>
    </div>
  );
}
