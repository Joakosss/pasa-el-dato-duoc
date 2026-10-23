import { Avatar } from "@/components/ui/Avatar";
import type { PerfilRespuestaDTO } from "@/domain/dtos";
import { cn } from "@/lib/utils/cn";

interface PerfilDetalleProps {
  perfil: PerfilRespuestaDTO;
}

function unir(valores: Array<string | null | undefined>): string {
  const texto = valores
    .filter((valor): valor is string => Boolean(valor?.trim()))
    .map((valor) => valor.trim())
    .join(" ");
  return texto || "No asignado";
}

function datoOpcional(valor: string | null | undefined): string {
  return valor?.trim() || "No asignado";
}

function Dato({
  etiqueta,
  valor,
  mono = false,
}: {
  etiqueta: string;
  valor: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-gray-400">
        {etiqueta}
      </dt>
      <dd
        className={cn(
          "mt-1 break-words text-sm font-semibold text-navy",
          mono && "font-mono",
        )}
      >
        {valor}
      </dd>
    </div>
  );
}

export function PerfilDetalle({ perfil }: PerfilDetalleProps) {
  const nombres = unir([perfil.pNombre, perfil.sNombre]);
  const apellidos = unir([perfil.pApellido, perfil.sApellido]);
  const nombreCompleto = unir([
    perfil.pNombre,
    perfil.sNombre,
    perfil.pApellido,
    perfil.sApellido,
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-navy sm:text-2xl">Mi perfil</h1>
        <p className="mt-1 text-sm text-gray-500">
          Consulta los datos personales registrados en tu cuenta Duoc.
        </p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-card shadow-sm">
        <div className="border-b border-gray-100 bg-surface px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar name={nombreCompleto} size="xl" />
            <div className="min-w-0">
              <h2 className="break-words text-lg font-bold text-navy sm:text-xl">
                {nombreCompleto}
              </h2>
              <p className="mt-0.5 break-all text-sm text-gray-500">
                {datoOpcional(perfil.correo)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 px-6 py-6 sm:px-8 lg:grid-cols-3">
          <section aria-labelledby="perfil-datos-personales">
            <h3
              id="perfil-datos-personales"
              className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400"
            >
              Datos personales
            </h3>
            <dl className="space-y-4">
              <Dato etiqueta="RUN" valor={datoOpcional(perfil.run)} mono />
              <Dato etiqueta="Nombres" valor={nombres} />
              <Dato etiqueta="Apellidos" valor={apellidos} />
            </dl>
          </section>

          <section aria-labelledby="perfil-contacto">
            <h3
              id="perfil-contacto"
              className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400"
            >
              Contacto
            </h3>
            <dl className="space-y-4">
              <Dato
                etiqueta="Correo institucional"
                valor={datoOpcional(perfil.correo)}
              />
              <Dato
                etiqueta="Teléfono"
                valor={datoOpcional(perfil.telefono)}
              />
            </dl>
          </section>

          <section aria-labelledby="perfil-informacion-academica">
            <h3
              id="perfil-informacion-academica"
              className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400"
            >
              Información académica
            </h3>
            <dl className="space-y-4">
              <Dato
                etiqueta="Sede"
                valor={datoOpcional(perfil.sede?.nombre)}
              />
              <Dato
                etiqueta="Carrera"
                valor={datoOpcional(perfil.carrera?.nombre)}
              />
            </dl>
          </section>
        </div>
      </section>
    </div>
  );
}
