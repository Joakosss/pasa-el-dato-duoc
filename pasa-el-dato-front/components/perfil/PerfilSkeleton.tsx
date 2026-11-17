const SECCIONES_SKELETON = [
  { titulo: "Datos personales", filas: 3 },
  { titulo: "Contacto", filas: 2 },
  { titulo: "Información académica", filas: 2 },
];

// S6.3: replica el layout nuevo (hero centrado en móvil / fila en sm+,
// tarjeta de reputación, grilla 1->2->3 columnas) para no saltar al cargar.
export function PerfilSkeleton() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Cargando perfil…</span>
      <div aria-hidden="true" className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="h-20 w-20 animate-pulse rounded-full bg-gray-200 sm:h-14 sm:w-14" />
            <div className="space-y-2 text-center sm:text-left">
              <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
                <div className="h-7 w-48 animate-pulse rounded bg-gray-200" />
                <div className="h-5 w-24 animate-pulse rounded-full bg-gray-200" />
              </div>
              <div className="h-4 w-56 max-w-full animate-pulse rounded bg-gray-100" />
            </div>
          </div>
          <div className="hidden shrink-0 gap-2 sm:flex">
            <div className="h-9 w-32 animate-pulse rounded-lg bg-gray-200" />
            <div className="h-9 w-40 animate-pulse rounded-lg bg-gray-200" />
          </div>
        </div>

        <div className="h-28 animate-pulse rounded-2xl bg-gray-100 sm:hidden" />
        <div className="hidden h-24 animate-pulse rounded-2xl bg-gray-100 sm:block" />

        <section className="rounded-2xl border border-gray-200 bg-card p-6 shadow-sm sm:p-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {SECCIONES_SKELETON.map((seccion) => (
              <section key={seccion.titulo}>
                <div className="mb-4 h-3 w-28 animate-pulse rounded bg-gray-200" />
                <div className="space-y-4">
                  {Array.from({ length: seccion.filas }, (_, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-gray-100" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
                        <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
