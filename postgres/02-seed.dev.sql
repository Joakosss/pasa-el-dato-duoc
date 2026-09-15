-- 02-seed.dev.sql — SEED DEV TEMPORAL (descartable)
-- Para tener algo que mostrar en front/back/mobile sin crear a mano.
-- Para volver a esquema limpio: borrar este archivo + `podman-compose down -v && up`.
-- Corre solo la primera vez (volumen vacío), después de 01-schema.sql.

INSERT INTO rol_usuario (descripcion)
VALUES ('Estudiante')
ON CONFLICT (descripcion) DO NOTHING;

-- Crea la sede activa solo si aún no existe con ese nombre.
INSERT INTO sede (nombre, activa)
SELECT 'Puente Alto', TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM sede WHERE nombre = 'Puente Alto'
);