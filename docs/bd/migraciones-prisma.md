# Migraciones Prisma: adopción de la baseline (HU-UBI-01, T-01)

**Fecha de la corrección:** 2026-10-20

## Corrección de diseño y de procedimiento

La adopción de la baseline `00000000000000_baseline` **no es automática** sobre
una base de datos existente que contiene tablas pero no tiene historial en
`_prisma_migrations`. En ese caso `prisma migrate deploy` falla con el error
**P3005** ("The database schema is not empty") antes de ejecutar cualquier SQL.

El diseño original preveía que la idempotencia de la baseline (`CREATE TABLE IF
NOT EXISTS`, claves foráneas protegidas con captura de `duplicate_object`)
bastara para aplicarla en cualquier estado. Esa premisa era insuficiente: P3005
es una verificación previa del propio Prisma, independiente de la idempotencia
del SQL.

Se definen **dos rutas oficiales** de adopción, ninguna automática y ambas
verificadas (ver sección final).

## Ruta 1 — Base de datos nueva (volumen PostgreSQL vacío)

1. Crear un volumen PostgreSQL vacío (por ejemplo, el volumen `pgdata` sin
   inicializar de `compose.yaml`).
2. Levantar los servicios:
   `podman-compose up -d --build`.
3. Ejecutar:
   `podman compose exec -T back pnpm db:migrate:deploy`.
4. Prisma aplica la baseline y las migraciones posteriores en orden, sin
   `migrate resolve` y sin P3005 (el P3005 solo aplica a esquemas no vacíos
   sin historial).
5. Verificación:
   - `_prisma_migrations` contiene una fila por migración, incluida
     `00000000000000_baseline`.
   - Guardarraíl de deriva:
     `podman compose exec -T back pnpm exec prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code`
     debe terminar en `0` (vacío).

## Ruta 2 — Base de datos existente heredada del esquema SQL

Para una BD creada antes de esta estrategia (por ejemplo, por
`postgres/01-schema.sql` montado en `docker-entrypoint-initdb.d`) y que ya
contiene las tablas pero no historial en `_prisma_migrations`:

1. **Verificar previamente que la BD coincide con el esquema baseline** antes
   de cualquier registro:

   ```bash
   podman compose exec -T back pnpm exec prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code
   ```

   Debe terminar en `0` (vacío). Si termina en `2` (diferencias), **detenerse**
   y resolver la discrepancia antes de continuar.

2. Registrar la baseline como aplicada:

   ```bash
   podman compose exec -T back pnpm exec prisma migrate resolve --applied 00000000000000_baseline
   ```

3. Aplicar el resto de migraciones:

   ```bash
   podman compose exec -T back pnpm db:migrate:deploy
   ```

4. Verificar con los guardarraíles definidos:

   ```bash
   podman compose exec -T back pnpm exec prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code
   podman compose exec -T back pnpm exec prisma migrate diff --from-migrations prisma/migrations --to-config-datasource --exit-code
   ```

   Ambos deben terminar en `0`.

> **Advertencia:** `prisma migrate resolve --applied` **no ejecuta ningún
> SQL**. Solo inserta la fila de la migración en `_prisma_migrations`
> marcándola como aplicada. Por eso **nunca debe ejecutarse sin validar
> primero** que el esquema existente corresponde exactamente a esa baseline
> (paso 1). Ejecutarlo sobre una BD cuyo esquema no coincide dejaría una
> baseline registrada como aplicada sobre esquema ajeno, ocultando la deriva
> real.

## Requisitos operativos

- `prisma.config.ts` define `datasource.shadowDatabaseUrl` (BD
  `pasaeldato_shadow` en el mismo servidor, sufijo `_shadow` derivado de
  `DATABASE_URL`); es obligatoria para `migrate diff --from-migrations` y para
  `migrate dev`.
- `prisma migrate dev` requiere terminal interactiva y no corre con `CI=true`
  dentro de `podman compose exec -T`; en este entorno las migraciones se
  autoran con `migrate diff --from-migrations prisma/migrations --to-schema
  prisma/schema.prisma --script` y se aplican con `migrate deploy`.
- Los comandos se ejecutan siempre dentro del contenedor `back`
  (`podman compose exec -T back ...`), nunca en el host.

## Verificación documentada de ambas rutas (2026-10-20)

Ambas rutas se ejecutaron y verificaron el mismo día, sobre la misma
colección de migraciones (baseline + `20261006_access_token_revocado` +
`20261020_ubicacion_fase_a`).

### Ruta 1 — volumen PostgreSQL vacío

Se creó una instancia PostgreSQL desechable en el volumen `baseline-test-pg`
contenedor `pg-baseline-test`, red `pasa-el-dato-duoc_pasaelnetz`, BD
`pasaeldato_test`):

1. `pnpm db:migrate:deploy` con `DATABASE_URL` apuntando a la BD vacía:
   terminó en `0` y aplicó las 3 migraciones, **incluida la baseline, sin
   `migrate resolve` y sin P3005**.
2. `_prisma_migrations`: 3 filas
   (`00000000000000_baseline`, `20261006_access_token_revocado`,
   `20261020_ubicacion_fase_a`).
3. `information_schema.tables` (`public`): 13 tablas, igual que la BD de
   desarrollo.
4. Guardarraíl BD↔schema (`--from-config-datasource --to-schema`): exit `0`.

Luego se destruyó el contenedor y el volumen de prueba.

### Ruta 2 — volumen existente heredado

Sobre el volumen `pgdata` de desarrollo (BD heredada de `01-schema.sql`,
histórico registrado durante la aplicación de T-01):

1. Verificación previa de coincidencia con la baseline:
   `--from-config-datasource --to-schema` → exit `0` (hecha antes del
   `resolve`; fue la condición que habilitó la ruta 2).
2. `pnpm exec prisma migrate resolve --applied 00000000000000_baseline` →
   "Migration 00000000000000_baseline marked as applied."
3. `pnpm db:migrate:deploy` → aplicó `20261006_access_token_revocado` y, con el
   tiempo, `20261020_ubicacion_fase_a`; salida "All migrations have been
   successfully applied".
4. Guardarraíles posteriores (re-ejecutados el 2026-10-20):
   - BD↔schema: exit `0`.
   - Migraciones↔BD (`--from-migrations ... --to-config-datasource`): exit `0`.
   - `_prisma_migrations`: 3 filas.

### Paridad final

Ambas BD (la desechable de Ruta 1 y la de desarrollo de Ruta 2) quedaron con
13 tablas en `public` y 3 filas en `_prisma_migrations`.
