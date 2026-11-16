# HU-FAV-01 — Subtareas Backend (NestJS + Prisma)

Fuente: `docs/historias-de-usuario/favoritos/HU-FAV-01.md`  
Objetivo: implementar **marcar/desmarcar** una publicación como favorita con persistencia, validaciones de negocio y pruebas.

---

## Checklist de subtareas

### 0) Descubrimiento mínimo (antes de tocar código)
- [x] Revisar convenciones existentes en backend:
  - soft delete: booleano `eliminado` (no `deleted_at`), timestamps `fechaCreacion`/`fechaModificacion` (patrón BASE del repo)
  - PK/FK: `id` UUID, `fk_usuario`, `fk_publicacion`
  - errores: `NotFoundException` (404), `BadRequestException` (400), guard JWT (401)
- [x] Estado de publicación: tabla catálogo `estado_publicacion`; "eliminada" = `eliminado`; "bloqueada" = cuenta del dueño `bloqueado`

### 1) Persistencia: Prisma schema + migración
- [x] Modelo `Favorito` en `schema.prisma` con campos BASE + `fk_usuario` + `fk_publicacion` y relaciones
- [x] Unique `(fk_publicacion, fk_usuario)` — `ux_favorito_publicacion_usuario`
- [x] Índices `idx_favorito_usuario`, `idx_favorito_publicacion`, `idx_favorito_modificado_por`
- [x] Migración `20261110013554_favorito` aplicada en entorno de contenedores

### 2) Módulo Favoritos (Nest)
- [x] `FavoritosModule` registrado en `AppModule`
- [x] `FavoritosService` (inyección de `PrismaService`) con `marcarFavorito`, `quitarFavorito`, `obtenerEstadoFavorito`, `listarFavoritos`
- [x] Soft delete: `quitarFavorito` baja lógica; `marcarFavorito` crea o reactiva (`eliminado: false`)

### 3) Controller + Endpoints (contrato REST)
- [x] `POST /api/favoritos/:publicacionId` → `{ publicacionId, esFavorito: true }` (201)
- [x] `DELETE /api/favoritos/:publicacionId` → `{ publicacionId, esFavorito: false }` (200)
- [x] `GET /api/favoritos/:publicacionId` → `{ publicacionId, esFavorito }` (200)
- [x] `GET /api/favoritos` → listado paginado (pageSize 20 web / 10 móvil)
- [x] `JwtAuthGuard` en todo el controller (cookie `accessToken`)
- [x] Validación `ParseUUIDPipe` v4 en `:publicacionId`

### 4) Reglas de negocio y validaciones
- [x] No existe / eliminada / dueño bloqueado, eliminado o no aprobado → 404 "Publicación no encontrada"
- [x] Pausada/Vendida → permitida (no se filtra por estado al marcar)
- [x] Publicación propia → 400 "No puede guardar su propia publicación"
- [x] Idempotencia: POST repetido no duplica (unique + upsert); DELETE repetido sin error

### 5) Pruebas (e2e) — Criterios de aceptación
`pasa-el-dato-back/test/favoritos.e2e-spec.ts`:

- [x] F1: 401 sin sesión al marcar
- [x] F2: marcar/quitar idempotente, persistencia vía GET estado, reactivación tras quitar
- [x] F3: propia publicación → 400
- [x] F4/F4.1: sesión requerida para listar + Swagger documenta endpoint y cookie
- [x] F5: listado solo propios, conserva no disponibles (Pausada/eliminada con `disponible: false`)
- [x] F6: lista vacía + paginación inválida → 400
- [x] F7: paginación 20/10 sin repetir publicaciones
- [x] F8: marcar rechaza publicación inexistente/eliminada/dueño bloqueado (404)
- [x] F9: marcar permite Pausada/Vendida (201) y persiste estado
- [x] Suite e2e en contenedor verde (30 archivos, 252 tests pasados)

### 6) Documentación técnica mínima
- [x] Swagger documenta los 4 endpoints: `@ApiOperation`, respuestas (`200`/`201` con `EstadoFavoritoRespuestaDto`, `400`, `401`, `404` en POST marcar) y cookie `accessToken`
- [x] Nota técnica (ver "Notas de implementación")

---

## Notas de implementación
- Preferir transacción Prisma (`$transaction`) para:
  - leer publicación + validar + upsert favorito de forma consistente.
- Usar el patrón BASE del MER para timestamps y baja lógica.
- No asumir librerías nuevas; reutilizar guards/exceptions ya existentes.

## Nota técnica (implementación vigente)

Contrato REST (prefijo global `api`, cookie `accessToken`):

| Método | Ruta | OK | Errores |
|--------|------|----|---------|
| GET | `/api/favoritos` | 200 listado paginado `{ items, page, pageSize, total, nextPage }` | 400 query inválida, 401 |
| GET | `/api/favoritos/:publicacionId` | 200 `{ publicacionId, esFavorito }` | 400 UUID inválido, 401 |
| POST | `/api/favoritos/:publicacionId` | 201 `{ publicacionId, esFavorito: true }` | 400 propia publicación / UUID inválido, 401, 404 no disponible |
| DELETE | `/api/favoritos/:publicacionId` | 200 `{ publicacionId, esFavorito: false }` | 400 UUID inválido, 401 |

- "No disponible" = publicación inexistente, `eliminado: true`, o dueño con cuenta `bloqueado`/`eliminado`/no `aprobada`. Se responde 404 (convención del repo, no 403/409).
- Publicaciones Pausada/Vendida se pueden marcar.
- Baja lógica: `DELETE` marca `eliminado: true` + `fk_modificado_por` + `fechaModificacion`. No borra la fila.
- Reactivación: `POST` sobre favorito soft-deleted lo reactiva con `upsert` (`eliminado: false`).
- La fila y el unique `(fk_publicacion, fk_usuario)` garantizan un único favorito por par usuario–publicación.
