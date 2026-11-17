import { Icono, type IconoNombre } from "@/components/ui/Icono";
import { formatearTelefonoChile } from "@/lib/validators";
import type { PerfilRespuestaDTO } from "@/domain/dtos";

interface PerfilDatosProps {
  perfil: PerfilRespuestaDTO;
}

// S3.1: fila con ícono gold + etiqueta + valor (patrón ItemInformativo del
// mobile). El valor vacío muestra "No asignado".
function Dato({
  icono,
  etiqueta,
  valor,
  mono = false,
}: {
  icono: IconoNombre;
  etiqueta: string;
  valor: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold"
      >
        <Icono nombre={icono} size={18} />
      </span>
      <div className="min-w-0">
        <dt className="text-[13px] text-gray-500">{etiqueta}</dt>
        <dd
          className={
            mono
              ? "mt-0.5 break-all font-mono text-sm font-semibold text-navy"
              : "mt-0.5 break-words text-sm font-semibold text-navy"
          }
        >
          {valor}
        </dd>
      </div>
    </div>
  );
}

function valorOpcional(valor: string | null | undefined): string {
  return valor?.trim() || "No asignado";
}

// S3.5: grilla 1 col (<sm) -> 2 col (sm) -> 3 col (lg), con los mismos
// grupos del panel actual pero en filas con ícono.
export function PerfilDatos({ perfil }: PerfilDatosProps) {
  const nombres = [perfil.pNombre, perfil.sNombre]
    .filter((parte): parte is string => Boolean(parte?.trim()))
    .join(" ");
  const apellidos = [perfil.pApellido, perfil.sApellido]
    .filter((parte): parte is string => Boolean(parte?.trim()))
    .join(" ");

  return (
    <section
      aria-label="Datos de la cuenta"
      className="rounded-2xl border border-gray-200 bg-card p-6 shadow-sm sm:p-8"
    >
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <section aria-labelledby="perfil-datos-personales">
          <h2
            id="perfil-datos-personales"
            className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400"
          >
            Datos personales
          </h2>
          <dl className="space-y-4">
            <Dato icono="run" etiqueta="RUN" valor={valorOpcional(perfil.run)} mono />
            <Dato icono="editar" etiqueta="Nombres" valor={nombres || "No asignado"} />
            <Dato icono="editar" etiqueta="Apellidos" valor={apellidos || "No asignado"} />
          </dl>
        </section>

        <section aria-labelledby="perfil-contacto">
          <h2
            id="perfil-contacto"
            className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400"
          >
            Contacto
          </h2>
          <dl className="space-y-4">
            <Dato
              icono="correo"
              etiqueta="Correo institucional"
              valor={valorOpcional(perfil.correo)}
            />
            <Dato
              icono="telefono"
              etiqueta="Teléfono"
              valor={
                perfil.telefono?.trim()
                  ? formatearTelefonoChile(perfil.telefono)
                  : "No asignado"
              }
            />
          </dl>
        </section>

        <section aria-labelledby="perfil-informacion-academica">
          <h2
            id="perfil-informacion-academica"
            className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400"
          >
            Información académica
          </h2>
          <dl className="space-y-4">
            <Dato
              icono="sede"
              etiqueta="Sede"
              valor={valorOpcional(perfil.sede?.nombre)}
            />
            <Dato
              icono="carrera"
              etiqueta="Carrera"
              valor={valorOpcional(perfil.carrera?.nombre)}
            />
          </dl>
        </section>
      </div>
    </section>
  );
}
