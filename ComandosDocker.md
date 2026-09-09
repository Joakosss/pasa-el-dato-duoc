
## Podman
- podman
- podman-compose

## Día a día
- `podman-compose up -d --build`   _# levantar todo (reconstruyendo imágenes)_
- `podman-compose up -d `          _# levantar sin reconstruir_
- `podman-compose ps   `           _# ver estado de los 4 servicios_
- `podman-compose down`            _# bajar (conserva datos)_
- `podman-compose restart back`   _# reiniciar solo el back (front, postgres, mongo igual)_
## Ver qué pasa (logs)
- `podman-compose logs -f back `   _# logs del back en vivo (Ctrl+C para salir)_
- `podman-compose logs front   `  _# últimas líneas del front_
- `podman logs pasael-postgres ` _# log directo de Postgres_
# Bases de datos
## Postgres: ver seeds
`podman exec pasael-postgres psql -U pasael -d pasaeldato -c "SELECT name,email FROM users;" -c "SELECT title,tags FROM datos;"`
## Mongo: ver eventos
`podman exec pasael-mongo mongosh --quiet --eval "db.getSiblingDB('pasaeldato').dato_events.find().toArray()"`
## Salud de ambas sin entrar a ninguna
`curl -s http://localhost:3001/api/health`
## Seeds y volúmenes (la parte delicada)
- `podman volume ls`    # ver pgdata, mongodata, eetc`.
- `podman-compose down -v`    # BORRA datos y re-corre los seeds al próximo up
> Regla: down = apagas guardando; down -v = formateas y re-inicializas (ahí corren 01-schema.sql, 02-seed.dev.sql, init-dev.js de nuevo).

# Limpieza (cuando algo raro pase)
- `podman images`        # ver imágenes localhost/pasaeldato_*
- `podman system prune`  # borrar contenedores/imágenes colgadas (pregunta antes)
# Tu red / celular
- `ip a`                           # tu IP LAN para la app mobile (http://TU_IP:3001/api)
- `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000`  # front vivo? (200)