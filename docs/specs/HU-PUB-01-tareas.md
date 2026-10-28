# HU-PUB-01 — Tareas de implementación

**Fecha:** 2026-10-25
**Especificación aprobada:** `docs/specs/HU-PUB-01-spec.md`
**Regla general:** todas las tareas de código se ejecutan y verifican dentro del
contenedor (`podman compose exec back ...`); nunca en el host.

## 0. Verificación previa de relaciones y claves foráneas

Verificado contra `prisma/schema.prisma` y el MER antes de cerrar las tareas:

| FK propuesta | Destino verificado | Evidencia |
|---|---|---|
| `Publicacion.fk_usuario` | `Usuario.id_cuenta` (PK UUID) | `Usuario` (schema línea 122–141): PK es `id_cuenta`, mismo destino que `Cuenta`. El MER declara `fk_usuario`. Requiere back-relation aditiva `publicaciones Publicacion[]` en `Usuario`. |
| `Publicacion.fk_sede` | `Sede.id` | Igual patrón que `Usuario.fk_sede` (línea 134). |
| `Publicacion.fk_estado_publicacion` | `EstadoPublicacion.id` | Nueva tabla de referencia del MER. |
| `Publicacion.fk_tipoventa` | `TipoVenta.id` | Nueva tabla de referencia del MER. |
| `Publicacion.fk_categoria` | `Categoria.id` | Nueva tabla de referencia del MER. |
| `Publicacion.fk_user_comprador` | `Cuenta.id_cuenta`, nullable | Nullable por decisión confirmada. Relación declarada como `Cuenta?`, patrón `RefreshToken.cuenta` (línea 165). Back-relation aditiva en `Cuenta`. |
| `Publicacion.fk_modificado_por` | `Cuenta.id_cuenta`, nullable | Patrón verificado: `Cuenta` (línea 23), `Sede` (línea 51) declaran la relación hacia `Cuenta`. La versión inicial de la spec decía "sin relación declarada"; corregida. Back-relation aditiva en `Cuenta`. |
| `ImagenPublicacion.fk_publicacion` | `Publicacion.id` | MER: `fk_publicacion`. Cascade para borrado físico futuro (CU007). |

Conclusión: ninguna FK apunta a un modelo inexistente. Los cambios sobre
`Usuario` y `Cuenta` son solo back-relations aditivas; ningún campo existente
cambia de tipo ni semántica.

## 1. Tareas

Formato: `T-nn — título`. Cada tarea incluye entrega y verificación. Orden
estricto salvo T-08/T-09 (paralelizables).

### T-01 — Migración Prisma de publicaciones

- Agregar a `prisma/schema.prisma`: `TipoVenta`, `Categoria`,
  `EstadoPublicacion`, `Publicacion`, `ImagenPublicacion` según la spec
  (sección 4), incluidas back-relations en `Usuario` y `Cuenta`.
- Generar migración con el procedimiento de `docs/bd/migraciones-prisma.md`
  (migrate diff + deploy dentro del contenedor).
- **Verificación:** `prisma migrate diff --from-migrations ... --to-schema
  --exit-code` en `0`; guardarraíl BD↔schema en `0`; `pnpm db:generate` sin
  errores; lint y `tsc --noEmit` dentro del contenedor.
- **No ejecutar** la migración contra desarrollo hasta confirmar el equipo
  (la tarea prepara la migración; su aplicación es paso de despliegue).

### T-02 — Seed de catálogos (parcialmente bloqueada)

- Extender `seed-dev.ts` de forma idempotente (`skipDuplicates`):
  - `EstadoPublicacion`: `En curso`, `Pausado`, `Vendido` (valores del MER).
  - `TipoVenta`: `Producto`, `Servicio` (derivado de `(servicio-producto)` del
    MER).
- `Categoria`: catálogo inicial autorizado para esta implementación:
  `Tecnología y accesorios`, `Libros y material de estudio`, `Insumos y
  materiales académicos`, `Vestuario y accesorios`, `Hogar y vida diaria`,
  `Deportes y bienestar`, `Servicios académicos`, `Servicios técnicos y
  creativos`, `Servicios personales y varios`, `Otros`.
- El seed no crea imágenes ni publicaciones.
- **Verificación:** ejecutar seed dos veces en dev; segunda pasada sin
  duplicados ni errores; `SELECT` de catálogos con los valores esperados.

### T-03 — Módulo `publicacion` base

- Crear `src/publicacion/` con module, controller (sin rutas aún) y service
  vacío; registrar en `AppModule`.
- **Verificación:** `pnpm lint`, `pnpm exec tsc --noEmit`, app levanta y
  `/api/health` responde.

### T-04 — DTO `CrearPublicacionDto`

- Campos y validaciones de la spec sección 3.1: `titulo` (trim,
  `@Length(5,100)`), `descripcion` (trim, `@Length(20,2000)`), `precio`
  (transform a entero, `@IsInt`, `@Min(1)`), `sedeId`, `tipoVentaId`,
  `categoriaId` (`@IsInt`, `@Min(1)`).
- **Verificación:** pruebas unitarias del DTO (4/101, 19/2001, 0, negativo,
  decimal, no numérico, IDs < 1).

### T-05 — Validador de firmas de imagen

- Función pura que recibe `Buffer` y MIME declarado; verifica magic bytes
  (`FF D8 FF`, `89 50 4E 47`, `RIFF`+`WEBP`). Sin dependencias nuevas.
- **Verificación:** pruebas unitarias con buffers mínimos válidos y corruptos,
  MIME que no coincide con firma, buffer vacío.

### T-06 — Recepción de archivos (multer)

- `FileInterceptor('imagenes')` con `limits.fileSize = 5 MB`; validador propio
  de cantidad 1–5; `fileFilter` restringe a `image/jpeg`, `image/png`,
  `image/webp`.
- Tratamiento de errores definido:
  - `MulterError` `LIMIT_FILE_SIZE` → 400 `Imagen supera 5 MB`.
  - `MulterError` `LIMIT_UNEXPECTED_FILE` → 400 indicando el campo esperado.
  - Formato no permitido en `fileFilter` → 400 `Formato de imagen no permitido`.
  - Cero o más de 5 archivos → 400 indicando causa (cantidad).
- Confirmar si `@types/multer` ya está disponible vía
  `@nestjs/platform-express`; instalar solo si falta (única dependencia
  candidata de esta HU).
- **Verificación:** pruebas unitarias del filtro y del traductor de errores.

### T-07 — Verificación de catálogos en el servicio

- Patrón `asegurarExistencia`: sede (existente + `activa = true` +
  `eliminado = false`), tipo de venta, categoría. 404 si no existe, 400
  `Sede no disponible` si sede existe pero no está disponible.
- Resolución del estado por `findFirst({ where: { descripcion: "En curso" } })`;
  si falta, 500 `Catálogo de estados incompleto`.
- **Verificación:** pruebas unitarias con Prisma mockeado para cada caso.

### T-08 — Almacenamiento y servido de imágenes

- Configuración `UPLOAD_DIR` (variable de entorno, con ruta por defecto
  documentada); flujo con compensación de la spec sección 6: escribir en
  `UPLOAD_DIR/tmp/` por solicitud, validar, mover (rename), transacción, borrar
  archivos si la BD falla; si el movimiento falla parcialmente, borrar los ya
  movidos y no tocar la BD.
- Servido público: `useStaticAssets(UPLOAD_DIR, { prefix: '/api/uploads' })`
  con `NestExpressApplication` en `main.ts`.
- Tratamiento de fallos de disco: error de escritura/movimiento → 500, BD sin
  cambios, sin archivos residuales.
- **Verificación:** pruebas unitarias de la compensación (BD falla → archivos
  eliminados; movimiento falla → BD intacta), prueba unitaria de aislamiento de
  `tmp/` concurrente y verificación HTTP de recuperación de imagen por su URL.

### T-09 — Infraestructura de almacenamiento (paralelizable con T-08)

- `compose.yaml`: volumen nombrado `uploadsdata` montado en `back` en la ruta
  `UPLOAD_DIR`; variable `UPLOAD_DIR` en `environment` y en `.env`.
- `Dockerfile.dev` no cambia.
- **Verificación:** `podman-compose up -d --build`; recrear el contenedor y
  comprobar que un archivo de prueba colocado en `UPLOAD_DIR` sobrevive.

### T-10 — Creación transaccional y endpoint completo

- `POST /api/publicaciones`: guard + interceptor + DTO; servicio ejecuta
  `$transaction` creando `publicacion` + `imagen_publicacion` (orden 1..n);
  respuesta 201 según contrato de la spec sección 2.1.
- **Verificación:** lint + tipos; respuesta 201 observable con el cuerpo del
  contrato (estado `En curso` resuelto por búsqueda).

### T-11 — Pruebas unitarias completas

- Consolidar y completar las de T-04, T-05, T-06, T-07, T-08.
- **Verificación:** `podman compose exec back pnpm test` en verde.

### T-12 — Pruebas E2E de criterios de aceptación

- `test/publicaciones.e2e-spec.ts` siguiendo `test/perfil.e2e-spec.ts`
  (registro, login, cookie). Casos: tabla de la spec sección 7.
- **Dependencias:** T-02b (lista de categorías aprobada) para el caso de
  creación válida; los casos negativos pueden escribirse antes.
- **Verificación:** `podman compose exec back pnpm test:e2e` en verde; la
  prueba de consistencia descarga cada `url` devuelta y espera 200.

## 2. Resumen

- 12 tareas; orden T-01 → T-12 con T-08/T-09 paralelizables.
- Back-relations aditivas en `Usuario` y `Cuenta` incluidas en T-01.
- Tratamiento de errores de multer y de almacenamiento definido en T-06 y T-08.
- Única dependencia candidata: `@types/multer` (solo si falta).
- No se modifica ninguna otra HU ni el texto de HU-PUB-01 (pendiente aparte).

## 3. Bloqueos vigentes

1. **T-02b / lista de categorías**: resuelta para esta implementación con un
   catálogo inicial autorizado. Si el equipo redefine nombres o granularidad,
   deberá tratarse como cambio funcional posterior.
2. **Texto de la HU**: dice `Publicada`; la decisión confirmada es `En curso`.
   Corrección de la HU pendiente, fuera de estas tareas.
3. **Aplicación de la migración a desarrollo**: T-01 la genera; su ejecución
   contra la BD de desarrollo es un paso explícito que queda para la fase de
   aplicación (`06-applier`), conforme a `docs/bd/migraciones-prisma.md`.
