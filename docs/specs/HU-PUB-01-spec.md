# HU-PUB-01 — Especificación y diseño: Crear publicación

**Fecha:** 2026-10-25
**Alcance de este documento:** comportamiento observable (spec) y diseño técnico (design) para crear publicaciones. No implementa código ni ejecuta migraciones.
**Historia de usuario:** `docs/historias-de-usuario/HU-PUB-01.md`
**Fuentes:** `docs/requerimientos/publicaciones.md`, `docs/bd/bd-mer-excalidraw.md`, `docs/bd/modelo-entidad-relacion.png`, schema Prisma vigente, CU005.

## 0. Nota sobre contradicción resuelta

La HU dice textualmente estado inicial `Publicada`. El MER documenta
`ESTADO_PUBLICACION` con valores `(pausado, vendido, en curso)` — no existe
`Publicada`. Decisión confirmada por el usuario: el estado inicial se obtiene de
`ESTADO_PUBLICACION` buscando la fila con `descripcion = "En curso"`, sin IDs
hardcodeados. Este documento sigue la decisión confirmada. La HU queda con ese
texto desactualizado; su corrección es un asunto pendiente fuera de este alcance.

## 1. Alcance y comportamiento esperado

- Un usuario autenticado crea una publicación con título, descripción, precio,
  sede, tipo de venta, categoría y entre 1 y 5 imágenes.
- La publicación queda asociada al propietario (`Cuenta` detrás de
  `request.user.idCuenta`), a la sede indicada, al tipo de venta, a la categoría
  y al estado `En curso`.
- La publicación es visible desde su creación: sin moderación previa.
- `fk_user_comprador` nace nullable y sin lógica. `contador_vistas` nace en 0 y
  sin lógica. Ambos existen por fidelidad al MER; esta HU no los usa.
- Fuera de alcance: edición, eliminación, favoritos, búsqueda, vistas, IA,
  palabras prohibidas, moderación, cierre de venta.

## 2. Contrato del endpoint

### 2.1 `POST /api/publicaciones`

- Autenticación: cookie `accessToken` vía `JwtAuthGuard`. Sin sesión válida:
  `401` con mensaje `Sesión inválida` (mensaje existente del guard).
- Content-Type: `multipart/form-data`.
- Campos de texto (parte del formulario): `titulo`, `descripcion`, `precio`,
  `sedeId`, `tipoVentaId`, `categoriaId`.
- Archivos: campo `imagenes`, entre 1 y 5 archivos.

**Respuesta 201:**

```json
{
  "id": "uuid",
  "titulo": "...",
  "descripcion": "...",
  "precio": 15000,
  "estado": { "id": 1, "descripcion": "En curso" },
  "sede": { "id": 1, "nombre": "Puente Alto" },
  "tipoVenta": { "id": 1, "nombre": "Producto" },
  "categoria": { "id": 1, "nombre": "..." },
  "imagenes": [
    { "idImagen": "uuid", "url": "/api/uploads/<uuid>.png", "orden": 1 }
  ]
}
```

Reglas:

- `id` es el identificador de la publicación (UUID).
- `estado.descripcion` es `"En curso"` porque se resolvió por búsqueda en el
  catálogo, no por ID fijo.
- `imagenes` respeta el orden de envío: `orden` comienza en 1.
- `url` es la ruta pública relativa servida por el propio backend.

**Errores:**

| Caso | HTTP | Condición | Mensaje de referencia |
|---|---:|---|---|
| Sin sesión o sesión inválida | 401 | Guard rechaza | `Sesión inválida` |
| Campo de texto ausente o inválido | 400 | Validación de DTO | Indica el campo y la regla |
| Sede, tipo de venta o categoría inexistente | 404 | `asegurarExistencia` | `Sede no existe` / `Tipo de venta no existe` / `Categoría no existe` |
| Sede no disponible | 400 | Sede existe con `activa = false` o `eliminado = true` | `Sede no disponible` |
| Cero imágenes o más de 5 | 400 | Validación de archivos | Indica causa (cantidad) |
| Formato no permitido | 400 | MIME o firma inválida | `Formato de imagen no permitido` |
| Imagen mayor a 5 MB | 400 | Límite de multer | `Imagen supera 5 MB` |

## 3. Validaciones

### 3.1 DTO (class-validator, ValidationPipe global con `transform: true`)

- `titulo`: string, `@Length(5, 100)`. Se recorta con `@Transform(trim)`.
- `descripcion`: string, `@Length(20, 2000)`. Se recorta.
- `precio`: entero CLP. En multipart llega como string; se transforma y valida
  `@IsInt` + `@Min(1)`. Se rechazan decimales, 0, negativos y valores no
  numéricos. No existe concepto de "gratis" ni "a convenir".
- `sedeId`, `tipoVentaId`, `categoriaId`: `@IsInt` + `@Min(1)`.

### 3.2 Catálogos (servicio, patrón `asegurarExistencia`)

- Sede: debe existir, con `activa = true` y `eliminado = false`.
- Tipo de venta: debe existir.
- Categoría: debe existir.
- Estado: el servicio busca `estadoPublicacion.findFirst({ descripcion:
  "En curso" })`. Si no existe la fila, es un error de configuración (500 con
  mensaje claro), nunca un ID hardcodeado.

### 3.3 Archivos (multer + verificación de contenido)

- Cantidad: 1 a 5 archivos, campo `imagenes`.
- Tamaño: 5 MB por archivo, con `limits.fileSize` de multer (5 * 1024 * 1024).
- Formato declarado: `image/jpeg`, `image/png`, `image/webp` en `fileFilter`.
- Formato real (contenido): verificación de firma (magic bytes) al procesar el
  buffer — viable sin dependencias nuevas:
  - JPEG: `FF D8 FF`
  - PNG: `89 50 4E 47`
  - WebP: `RIFF` + `WEBP` en los primeros 12 bytes.
  Si la firma no coincide con el MIME declarado, se rechaza con 400.
- `@types/multer` es necesario para tipar `Express.Multer.File`. Verificar en
  la fase de tareas si `@nestjs/platform-express` ya lo expone; instalar solo
  si falta.

## 4. Modelo Prisma (diseño, conforme al MER)

Nombres de columna en snake_case vía `@map`, tablas vía `@@map`, siguiendo el
estilo del schema actual. Campos BASE en tablas de negocio: `fechaCreacion`,
`fechaModificacion`, `eliminado`, `fk_modificado_por`.

```prisma
model TipoVenta {
  id          Int           @id @default(autoincrement())
  nombre      String        @unique
  publicacion Publicacion[]

  @@map("tipoventa")
}

model Categoria {
  id          Int           @id @default(autoincrement())
  nombre      String        @unique
  publicacion Publicacion[]

  @@map("categoria")
}

model EstadoPublicacion {
  id          Int           @id @default(autoincrement())
  descripcion String        @unique
  publicacion Publicacion[]

  @@map("estado_publicacion")
}

model Publicacion {
  id                   String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  titulo               String
  descripcion          String
  precio               Int
  fk_estado_publicacion Int
  fk_tipoventa         Int
  fk_categoria         Int
  fk_usuario           String    @db.Uuid
  fk_sede              Int
  fk_user_comprador    String?   @db.Uuid
  contador_vistas      Int       @default(0)
  fechaCreacion        DateTime  @default(now()) @map("fecha_creacion") @db.Timestamptz(6)
  fechaModificacion    DateTime  @default(now()) @map("fecha_modificacion") @db.Timestamptz(6)
  eliminado            Boolean   @default(false)
  fk_modificado_por    String?   @db.Uuid

  estadoPublicacion EstadoPublicacion @relation(fields: [fk_estado_publicacion], references: [id], onUpdate: NoAction)
  tipoVenta         TipoVenta         @relation(fields: [fk_tipoventa], references: [id], onUpdate: NoAction)
  categoria         Categoria         @relation(fields: [fk_categoria], references: [id], onUpdate: NoAction)
  usuario           Usuario           @relation(fields: [fk_usuario], references: [id_cuenta], onUpdate: NoAction)
  sede              Sede              @relation(fields: [fk_sede], references: [id], onUpdate: NoAction)
  comprador         Cuenta?           @relation("publicacionComprador", fields: [fk_user_comprador], references: [id_cuenta], onUpdate: NoAction)
  modificadoPor     Cuenta?           @relation("publicacionModificadaPor", fields: [fk_modificado_por], references: [id_cuenta], onUpdate: NoAction)
  imagenes          ImagenPublicacion[]

  @@index([fk_estado_publicacion])
  @@index([fk_tipoventa])
  @@index([fk_categoria])
  @@index([fk_usuario])
  @@index([fk_sede])
  @@index([fk_user_comprador])
  @@index([fk_modificado_por], map: "idx_publicacion_modificado_por")
  @@map("publicacion")
}

model ImagenPublicacion {
  idImagen      String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid @map("id_imagen")
  fk_publicacion String @db.Uuid
  url           String
  orden         Int

  publicacion Publicacion @relation(fields: [fk_publicacion], references: [id], onDelete: Cascade, onUpdate: NoAction)

  @@unique([fk_publicacion, orden])
  @@index([fk_publicacion])
  @@map("imagen_publicacion")
}
```

Decisiones de diseño del modelo (tipos no definidos en el MER):

- `Publicacion.id` es UUID generado por PostgreSQL, igual que `Cuenta` y
  `RefreshToken`; `ImagenPublicacion.idImagen` es UUID por decisión confirmada.
- `precio` es `Int` (CLP sin decimales, decisión confirmada).
- `fk_usuario` referencia `Usuario.id_cuenta` (el MER dice `fk_usuario` y el PK
  de `Usuario` es `id_cuenta`).
- Único compuesto `(fk_publicacion, orden)` garantiza orden único por
  publicación (decisión confirmada).
- `fk_user_comprador` y `fk_modificado_por` declaran relación hacia `Cuenta`
  (patrón verificado en `Sede.cuenta`, `RefreshToken.cuenta` y
  `AccessTokenRevocado.cuenta`). Exige campos back-relation aditivos en
  `Cuenta` (`publicaciones`, `publicacionesCompradas`,
  `publicacionesModificadas`) y en `Usuario` (`publicaciones`). Ningún campo
  existente cambia de tipo ni de semántica.
- `onDelete: Cascade` en imágenes: al eliminar lógicamente la publicación no se
  borran filas, pero el cascade cubre borrados físicos futuros (CU007).

## 5. Flujo de creación y manejo de errores

Orden del flujo (fallback first, lo caro al final):

1. `JwtAuthGuard` valida sesión y expone `request.user.idCuenta`.
2. `FileInterceptor('imagenes')` recibe archivos con límites (cantidad por
   validador propio, tamaño por `limits` de multer). Errores de multer se
   traducen a 400 con mensaje de la tabla de errores.
3. `ValidationPipe` valida y normaliza el DTO. Error: 400 indicando campo.
4. Servicio: verifica contenido real de imágenes (magic bytes). Error: 400.
5. Servicio: verifica catálogos — sede (existente, activa, no eliminada), tipo
   de venta, categoría. Error: 404 si no existe, 400 si sede no disponible.
6. Servicio: resuelve `estadoPublicacion` por `descripcion = "En curso"`. Si no
   existe: error 500 con mensaje `Catálogo de estados incompleto` (fallo de
   seed, no de usuario).
7. Servicio: escribe archivos al disco, luego transacción Prisma que crea
   `publicacion` + `imagen_publicacion` (sección 6). Error de BD: compensación
   de archivos y propagación del error (500).
8. Respuesta 201 con el cuerpo del contrato.

Los mensajes de error siguen el patrón existente: mensajes genéricos de sesión,
mensajes que nombran el campo en validaciones, `NotFoundException` en
`asegurarExistencia`.

## 6. Persistencia de archivos y compensación

- Directorio raíz configurable: variable de entorno `UPLOAD_DIR`. El backend la
  lee al configurar el almacenamiento; sin valor definido usa una ruta por
  defecto documentada en `.env.example` (por definir en tareas, p. ej.
  `/app/uploads-publicaciones`).
- Subdirectorio por año/mes no se contempla en el MVP: archivos con nombre
  `<uuid>.<ext>` directamente en `UPLOAD_DIR`.
- `url` almacenada en PostgreSQL: `/api/uploads/<uuid>.<ext>` (ruta relativa;
  el front compone el origen con `NEXT_PUBLIC_API_URL`).
- Servido: `app.useStaticAssets(UPLOAD_DIR, { prefix: '/api/uploads' })` con
  `NestExpressApplication`. Lectura pública, sin autenticación (las imágenes son
  contenido público de la publicación).

Flujo de escritura con compensación (mismo filesystem, mismo volumen):

1. Escribir los 1–5 archivos en `UPLOAD_DIR/tmp/`.
2. Validar magic bytes sobre el buffer (paso 4 del flujo) antes de escribir.
3. Mover de `tmp/` al directorio final (rename atómico dentro del volumen).
4. Ejecutar la transacción Prisma (`publicacion` + `imagen_publicacion`).
5. Si la transacción falla: eliminar los archivos ya movidos (compensación) y
   propagar el error. Queda como archivo huérfano solo si el proceso muere entre
   los pasos 3 y 5 (riesgo residual aceptado en MVP; sin proceso de limpieza).
6. Si el paso 3 falla parcialmente: eliminar los archivos ya movidos y abortar
   sin tocar la BD.

Infraestructura (`compose.yaml`):

- Nuevo volumen nombrado `uploadsdata` montado en el servicio `back` en la ruta
  `UPLOAD_DIR`. Sobrevive a `podman-compose up -d --build` y a recreaciones del
  contenedor.
- `Dockerfile.dev` no cambia: no copia archivos de usuario, solo código.
- Variable `UPLOAD_DIR` agregada al bloque `environment` del servicio `back` y
  al `.env`.

Seed:

- `seed-dev.ts` (idempotente, `skipDuplicates`) agrega:
  - `EstadoPublicacion`: `En curso` (obligatorio), `Pausado` y `Vendido`
    (documentados en el MER, sin uso en esta HU).
  - `TipoVenta`: `Producto` y `Servicio` (derivado de la anotación
    `(servicio-producto)` del MER).
  - `Categoria`: lista pendiente (sección 8).
- El seed no crea imágenes ni publicaciones.

## 7. Pruebas para los criterios de aceptación

Unitarias (Vitest, mocks como `sede.service.spec.ts`):

- DTO: título fuera de rango (4 y 101 caracteres), descripción fuera de rango
  (19 y 2001), precio 0, negativo, con decimales, no numérico, IDs menores a 1.
- Servicio: sede inexistente (404), sede inactiva (400), sede eliminada (400),
  tipo de venta inexistente (404), categoría inexistente (404), estado
  `En curso` ausente (500), orden de imágenes 1..n, transacción única
  (`$transaction` llamado una vez).
- Validador de archivos: firmas JPEG/PNG/WebP válidas, MIME que no coincide con
  firma, archivo vacío.

E2E (`test/publicaciones.e2e-spec.ts`, patrón `perfil.e2e-spec.ts`):

| Criterio de aceptación HU | Caso |
|---|---|
| Creación válida | Datos + 1 imagen → 201, estado `En curso`, propietario correcto, imágenes con `orden` 1..n |
| Sin autenticación | Sin cookie → 401 |
| Campo faltante o inválido | Cada campo obligatorio por separado → 400 con campo indicado |
| Catálogo inválido | `sedeId`/`tipoVentaId`/`categoriaId` inexistente → 404; sede inactiva → 400 |
| Límites de título/descripción | 4/101 caracteres, 19/2001 caracteres → 400 |
| Precio inválido | 0, negativo, con decimales → 400 |
| Imágenes inválidas | 0 archivos, 6 archivos, formato no permitido (p. ej. GIF), archivo > 5 MB → 400 con causa |
| 1–5 imágenes válidas | 5 imágenes → 201 con 5 filas |
| Consistencia | Tras 201, `GET` a cada `url` devuelta responde 200 con el contenido |

## 8. Decisiones pendientes

1. **Lista de categorías para el seed**: el MER solo define la tabla
   `CATEGORIA (id, nombre)` sin valores. Se requiere una lista aprobada antes de
   la tarea de seed. Sin ella, el E2E de creación válida no puede ejecutarse.
2. **Texto de la HU**: dice `Publicada`; la decisión confirmada es `En curso`.
   Corregir la HU queda fuera de este alcance.
3. `@types/multer`: confirmar en tareas si está disponible vía
   `@nestjs/platform-express` antes de instalarlo.

## 9. Tareas propuestas (para la fase `tasks`)

1. T-01: migración Prisma con `TipoVenta`, `Categoria`, `EstadoPublicacion`,
   `Publicacion`, `ImagenPublicacion` (ruta documentada en
   `docs/bd/migraciones-prisma.md`).
2. T-02: extender `seed-dev.ts` con estados, tipos de venta y categorías
   (bloqueada por decisión pendiente 1).
3. T-03: módulo `publicacion` base (module, controller vacío, service) + registro
   en `AppModule`.
4. T-04: DTO `CrearPublicacionDto` con validaciones y transformaciones (precio
   entero CLP, recortes, rangos).
5. T-05: validador de firmas de imagen (magic bytes) sin dependencias nuevas.
6. T-06: `FileInterceptor` con límites de multer (tamaño, cantidad, MIME) y
   traducción de errores de multer a 400.
7. T-07: verificación de catálogos en el servicio (patrón `asegurarExistencia`,
   sede activa/no eliminada, búsqueda de `En curso`).
8. T-08: almacenamiento — configuración `UPLOAD_DIR`, escritura con
   compensación, `useStaticAssets` con prefijo `/api/uploads`.
9. T-09: `compose.yaml` — volumen `uploadsdata`, variable `UPLOAD_DIR`.
10. T-10: creación transaccional publicación + imágenes y respuesta 201.
11. T-11: pruebas unitarias (DTO, servicio, validador de archivos).
12. T-12: pruebas E2E de los criterios de aceptación.

Orden: T-01 → T-02 → T-03 → T-04 → T-05 → T-06 → T-07 → T-08 → T-09 → T-10 →
T-11 → T-12. T-08 y T-09 pueden paralelizarse.
