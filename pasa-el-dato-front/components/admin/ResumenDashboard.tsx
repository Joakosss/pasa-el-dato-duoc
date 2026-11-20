"use client";

import { useMemo, useState } from "react";
import { useMetricasDashboard } from "@/hooks/use-metricas-admin";
import { useSedes } from "@/hooks/use-sedes";
import { Button, Input, Select } from "@/components/ui";
import { cn } from "@/lib/utils/cn";

// Resumen real HU-ADM-04: metricas bajo demanda con filtros fecha + sede.
// Sin exportacion ni datos personales; hayDatos=false muestra mensaje del back.
export function ResumenDashboard() {
  const [desdeInput, setDesdeInput] = useState("");
  const [hastaInput, setHastaInput] = useState("");
  const [sedeInput, setSedeInput] = useState("");
  const [filtros, setFiltros] = useState<{
    desde?: string;
    hasta?: string;
    sedeId?: number;
  }>({});

  const metricas = useMetricasDashboard(filtros);
  const sedes = useSedes();

  const errorFiltros = useMemo(() => {
    if (desdeInput && hastaInput && desdeInput >= hastaInput) {
      return "La fecha desde debe ser anterior a la fecha hasta.";
    }
    return null;
  }, [desdeInput, hastaInput]);

  const aplicar = () => {
    if (errorFiltros) return;
    const sedeId = sedeInput ? Number(sedeInput) : undefined;
    setFiltros({
      ...(desdeInput ? { desde: `${desdeInput}T00:00:00.000Z` } : {}),
      ...(hastaInput
        ? { hasta: siguienteDiaISO(hastaInput) }
        : {}),
      ...(sedeId && Number.isFinite(sedeId) ? { sedeId } : {}),
    });
  };

  const limpiar = () => {
    setDesdeInput("");
    setHastaInput("");
    setSedeInput("");
    setFiltros({});
  };

  const dashboard = metricas.dashboard;
  const datos = dashboard?.metricas ?? null;
  const porCategoria = datos?.publicaciones.porCategoria ?? [];
  const porSede = datos?.publicaciones.porSede ?? [];
  const maxCategoria = Math.max(1, ...porCategoria.map((c) => c.total));
  const maxSede = Math.max(1, ...porSede.map((s) => s.total));

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-card p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            label="Desde"
            name="desde"
            type="date"
            value={desdeInput}
            onChange={(e) => setDesdeInput(e.target.value)}
          />
          <Input
            label="Hasta"
            name="hasta"
            type="date"
            value={hastaInput}
            onChange={(e) => setHastaInput(e.target.value)}
          />
          <Select
            label="Sede"
            name="sedeId"
            value={sedeInput}
            onChange={(e) => setSedeInput(e.target.value)}
          >
            <option value="">Todas las sedes</option>
            {sedes.sedes.map((sede) => (
              <option key={sede.id} value={sede.id}>
                {sede.nombre}
              </option>
            ))}
          </Select>
          <div className="flex items-end gap-2">
            <Button
              size="sm"
              onClick={aplicar}
              disabled={metricas.isCargando || errorFiltros !== null}
            >
              Aplicar
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={limpiar}
              disabled={metricas.isCargando}
            >
              Limpiar
            </Button>
          </div>
        </div>
        {errorFiltros ? (
          <p className="mt-2 text-sm text-red-500">{errorFiltros}</p>
        ) : null}
        {sedes.error ? (
          <p className="mt-2 text-xs text-gray-500">{sedes.error}</p>
        ) : null}
      </div>

      {metricas.isCargando ? (
        <div className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : null}
      {metricas.isCargando ? (
        <p role="status" className="sr-only">
          Cargando métricas…
        </p>
      ) : null}

      {!metricas.isCargando && metricas.error ? (
        <div className="rounded-xl border border-gray-200 bg-card px-5 py-10 text-center">
          <p className="text-sm text-red-500">{metricas.error}</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() => metricas.reintentar()}
          >
            Reintentar
          </Button>
        </div>
      ) : null}

      {!metricas.isCargando && !metricas.error && dashboard ? (
        <>
          {!dashboard.hayDatos ? (
            <p role="status" className="rounded-xl border border-gray-200 bg-card px-5 py-6 text-center text-sm text-gray-500">
              {dashboard.mensajeSinDatos ??
                "Sin datos para el periodo o sede seleccionados."}
            </p>
          ) : null}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Tarjeta
              titulo="Usuarios activos"
              valor={datos?.usuariosActivos ?? 0}
            />
            <Tarjeta
              titulo="Publicaciones"
              valor={datos?.publicaciones.total ?? 0}
            />
            <Tarjeta
              titulo="Transacciones"
              valor={datos?.transaccionesTotales ?? 0}
            />
            <Tarjeta
              titulo="Reportes resueltos"
              valor={datos?.reportesResueltos ?? 0}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Distribucion
              titulo="Publicaciones por categoría"
              vacio="Sin publicaciones por categoría en el periodo."
              items={porCategoria.map((c) => ({
                id: String(c.categoriaId),
                nombre: c.categoriaNombre,
                total: c.total,
              }))}
              maximo={maxCategoria}
            />
            <Distribucion
              titulo="Publicaciones por sede"
              vacio="Sin publicaciones por sede en el periodo."
              items={porSede.map((s) => ({
                id: String(s.sedeId),
                nombre: s.sedeNombre,
                total: s.total,
              }))}
              maximo={maxSede}
            />
          </div>
        </>
      ) : null}
    </section>
  );
}

function siguienteDiaISO(fecha: string): string {
  const base = new Date(`${fecha}T00:00:00.000Z`);
  if (Number.isNaN(base.getTime())) return `${fecha}T00:00:00.000Z`;
  return new Date(base.getTime() + 24 * 60 * 60 * 1000).toISOString();
}

function Tarjeta({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-card p-5 shadow-sm">
      <p className="text-xs font-medium text-gray-400">{titulo}</p>
      <p className="mt-2 text-2xl font-bold text-navy">{valor}</p>
    </div>
  );
}

function Distribucion({
  titulo,
  vacio,
  items,
  maximo,
}: {
  titulo: string;
  vacio: string;
  items: Array<{ id: string; nombre: string; total: number }>;
  maximo: number;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-card">
      <h2 className="border-b border-gray-100 px-5 py-3 text-sm font-semibold text-navy">
        {titulo}
      </h2>
      {items.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-gray-500">{vacio}</p>
      ) : (
        <ul className="space-y-3 px-5 py-4">
          {items.map((item) => (
            <li key={item.id} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate text-navy">{item.nombre}</span>
                <span className="font-semibold text-navy">{item.total}</span>
              </div>
              <div
                className="h-2 rounded bg-gray-100"
                role="img"
                aria-label={`${item.nombre}: ${item.total}`}
              >
                <div
                  className={cn("h-2 rounded bg-gold")}
                  style={{ width: `${Math.round((item.total / maximo) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

