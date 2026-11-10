# HU-FAV-01 — Subtareas Backend (NestJS + Prisma)

Fuente: `docs/historias-de-usuario/favoritos/HU-FAV-01.md`  
Objetivo: implementar **marcar/desmarcar** una publicación como favorita con persistencia, validaciones de negocio y pruebas.

---

## Checklist de subtareas

### 0) Descubrimiento mínimo (antes de tocar código)
- [ ] Revisar convenciones existentes en backend:
  - naming de soft delete (`deleted_at` vs `deletedAt`)
  - naming de PK/FK en Prisma (`id`, `fk_usuario`, etc.)
  - formato de errores HTTP (mensajes, códigos, filtros globales).
- [ ] Identificar cómo se representa el **estado de publicación** (tabla catálogo/enum) y cómo se modela “bloqueada”/“eliminada” hoy.

### 1) Persistencia: Prisma schema + migración
- [ ] Agregar modelo Prisma `favorito` en `pasa-el-dato-back/prisma/schema.prisma`:
  - campos BASE: `id`, `created_at`, `updated_at`, `deleted_at` (o el patrón vigente en el repo)
  - columnas de negocio: `fk_usuario`, `fk_publicacion`
  - relaciones:
    - `usuario` (1 usuario → N favoritos)
    - `publicacion` (1 publicación → N favoritos)
  - **unique constraint** en (`fk_usuario`, `fk_publicacion`) para evitar duplicados.
- [ ] Crear índices:
  - index por `fk_usuario` (listados futuros, HU-FAV-02)
  - index por `fk_publicacion` (opcional)
- [ ] Generar migración Prisma correspondiente y verificar que aplica en entorno de contenedores.

### 2) Módulo Favoritos (Nest)
- [ ] Crear `FavoritosModule` e incluirlo en `AppModule`.
- [ ] Crear `FavoritosService` (inyección de `PrismaService`) con:
  - `marcarFavorito(usuarioId: number, publicacionId: number)`
  - `quitarFavorito(usuarioId: number, publicacionId: number)`
  - (opcional) `obtenerEstado(usuarioId: number, publicacionId: number)` para UI persistente
- [ ] Soporte de soft delete:
  - `quitarFavorito` debe hacer **baja lógica** del favorito.
  - `marcarFavorito` debe:
    - crear si no existe
    - **reactivar** (unset `deleted_at`) si existía soft-deleted.

### 3) Controller + Endpoints (contrato REST)
Endpoints mínimos sugeridos:
- [ ] `POST /api/favoritos/:publicacionId` → marcar favorito
- [ ] `DELETE /api/favoritos/:publicacionId` → quitar favorito
- [ ] (Recomendado) `GET /api/favoritos/:publicacionId` → consultar estado `{ esFavorito: boolean }`
  - Alternativa: exponer `esFavorito` en endpoints de `publicacion` (listado/detalle) cuando hay sesión.

Detalles:
- [ ] Proteger endpoints con `JwtAuthGuard` (solo autenticados).
- [ ] Validar `publicacionId` con pipes (ej. `ParseIntPipe`) y/o DTO de params.
- [ ] Respuestas:
  - POST: `{ publicacionId, esFavorito: true }` (201 o 200 si restaurado)
  - DELETE: `{ publicacionId, esFavorito: false }` (200) o sin body (204)
  - GET: `{ publicacionId, esFavorito }`

### 4) Reglas de negocio y validaciones
Implementar validaciones en service (transaccional cuando aplique):

- [ ] **Publicación no disponible**:
  - Si no existe → 404
  - Si eliminada → 404/409 (según convención del repo)
  - Si bloqueada → 409/403 (según convención)
- [ ] **Permitido si está “pausada” o “vendida”**:
  - Marcar permitido; se guarda igual.
- [ ] **No permitir marcar favorita propia**:
  - Si `publicacion.fk_usuario === usuarioId` → rechazar (400/409).
- [ ] **Idempotencia / no duplicación**:
  - POST dos veces no debe duplicar (unique constraint + upsert/transaction).
  - DELETE repetido debe ser idempotente (204/200 sin error).

### 5) Pruebas (e2e) — Criterios de aceptación
Agregar specs en `pasa-el-dato-back/test/` siguiendo patrón existente:

- [ ] E2E: usuario autenticado marca favorito de publicación de otro usuario → OK y persiste.
- [ ] E2E: usuario autenticado desmarca favorito → baja lógica aplicada.
- [ ] E2E: persistencia de estado:
  - (si hay GET estado) marcar → GET → `esFavorito: true`
  - (o si se implementa en detalle publicación) marcar → GET detalle → `esFavorito: true`
- [ ] E2E: no autenticado → POST devuelve 401.
- [ ] E2E: propia publicación → POST rechaza.
- [ ] E2E: publicación no existe/eliminada/bloqueada → POST rechaza.
- [ ] E2E: POST repetido no crea duplicado.

### 6) Documentación técnica mínima
- [ ] Documentar en README o en doc de HU:
  - endpoints y respuestas
  - códigos de error esperados
  - nota sobre soft delete/reactivación.

---

## Notas de implementación
- Preferir transacción Prisma (`$transaction`) para:
  - leer publicación + validar + upsert favorito de forma consistente.
- Usar el patrón BASE del MER para timestamps y baja lógica.
- No asumir librerías nuevas; reutilizar guards/exceptions ya existentes.
