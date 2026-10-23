const SECCIONES_SKELETON = [
  { titulo: "Datos personales", filas: 3 },
  { titulo: "Contacto", filas: 2 },
  { titulo: "Información académica", filas: 2 },
];

export function PerfilSkeleton() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Cargando perfil…</span>
      <div aria-hidden="true" className="space-y-6">
        <div>
          <div className="h-7 w-32 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-4 w-64 max-w-full animate-pulse rounded bg-gray-100" />
        </div>

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-card shadow-sm">
          <div className="border-b border-gray-100 bg-surface px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="h-14 w-14 shrink-0 animate-pulse rounded-full bg-gray-200" />
              <div className="space-y-2">
                <div className="h-5 w-44 animate-pulse rounded bg-gray-200" />
                <div className="h-3.5 w-56 max-w-full animate-pulse rounded bg-gray-100" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 px-6 py-6 sm:px-8 lg:grid-cols-3">
            {SECCIONES_SKELETON.map((seccion) => (
              <section key={seccion.titulo}>
                <div className="mb-4 h-3 w-28 animate-pulse rounded bg-gray-200" />
                <div className="space-y-4">
                  {Array.from({ length: seccion.filas }, (_, index) => (
                    <div key={index}>
                      <div className="h-3 w-16 animate-pulse rounded bg-gray-100" />
                      <div className="mt-1.5 h-4 w-3/4 animate-pulse rounded bg-gray-200" />
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
