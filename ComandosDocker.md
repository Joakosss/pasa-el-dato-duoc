## Podman

- podman

- podman-compose

  

## Día a día

- `podman-compose up -d --build` _# levantar todo (reconstruyendo imágenes)_

- `podman-compose up -d ` _# levantar sin reconstruir_

- `podman-compose ps ` _# ver estado de los 4 servicios_

- `podman-compose down` _# bajar (conserva datos)_

- `podman-compose restart back` _# reiniciar solo el back (front, postgres, mongo igual)_

## Ver qué pasa (logs)

- `podman-compose logs -f back ` _# logs del back en vivo (Ctrl+C para salir)_

- `podman-compose logs front ` _# últimas líneas del front_

- `podman logs pasael-postgres ` _# log directo de Postgres_

# Bases de datos

## Postgres: ver seeds

`podman exec pasael-postgres psql -U pasael -d pasaeldato -c "SELECT * FROM rol_usuario;" -c "SELECT id, nombre, activa FROM sede;" -c "SELECT * FROM escuela;" -c "SELECT * FROM carrera;"`

## Postgres: migraciones (Prisma)

> Fuente de verdad del esquema: `pasa-el-dato-back/prisma/schema.prisma` y `pasa-el-dato-back/prisma/migrations`.
> La base de datos se actualiza únicamente con Prisma. `postgres/01-schema.sql` es solo una exportación documental y no se ejecuta.

> 1. Crear una migración tras cambiar `schema.prisma`:

```
podman compose exec back pnpm db:migrate
```

> 2. Aplicar las migraciones pendientes (entornos sin TTY, contenedores):

```
podman compose exec back pnpm db:migrate:deploy
```

> 3. Regenerar el cliente Prisma (si cambió el esquema):

```
podman compose exec back pnpm db:generate
```

> 4. Cargar los datos dev (roles, sede "Puente Alto", escuela y carrera de prueba):

```
podman compose exec back pnpm db:seed:dev
```

> 5. Regenerar la exportación documental del esquema:

```
podman compose exec -T back pnpm db:schema:sql > postgres/01-schema.sql
```

> 6. Verificar el estado de los servicios:

```
podman compose ps
```

PostgreSQL debería aparecer como:
`Up ... (healthy)`

## Postgres: reiniciar la base desde cero

> Esto elimina los volúmenes de PostgreSQL y MongoDB y pierde los datos actuales.
> Al levantar de nuevo, la base queda vacía: hay que aplicar migraciones y seed dev.

```
podman compose down -v
podman compose up --build -d
podman compose exec back pnpm db:migrate:deploy
podman compose exec back pnpm db:seed:dev
```

## Mongo: ver eventos

`podman exec pasael-mongo mongosh --quiet --eval "db.getSiblingDB('pasaeldato').dato_events.find().toArray()"`

## Salud de ambas sin entrar a ninguna

`curl -s http://localhost:3001/api/health`

## Seeds y volúmenes (la parte delicada)

- `podman volume ls` # ver pgdata, mongodata, etc.

- `podman-compose down -v` # BORRA datos; al próximo up la BD queda vacía y hay que correr migraciones + seed dev

> Regla: `down` apaga guardando datos; `down -v` formatea los volúmenes. Los SQL de `postgres/` NO se ejecutan automáticamente: el esquema se crea con `pnpm db:migrate:deploy` y los datos dev con `pnpm db:seed:dev`.

  

# Limpieza (cuando algo raro pase)

- `podman images` # ver imágenes localhost/pasaeldato_*

- `podman system prune` # borrar contenedores/imágenes colgadas (pregunta antes)

# Tu red / celular

- `ip a` # tu IP LAN para la app mobile (http://TU_IP:3001/api)

- `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000` # front vivo? (200)
