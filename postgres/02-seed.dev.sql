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

-- Datos temporales para probar la selección de carrera durante el registro.
INSERT INTO escuela (nombre)
SELECT 'Escuela de prueba'
WHERE NOT EXISTS (
  SELECT 1 FROM escuela WHERE nombre = 'Escuela de prueba'
);

INSERT INTO carrera (nombre, fk_escuela)
SELECT 'Carrera de prueba', escuela.id
FROM escuela
WHERE escuela.nombre = 'Escuela de prueba'
  AND NOT EXISTS (
    SELECT 1
    FROM carrera
    WHERE carrera.nombre = 'Carrera de prueba'
      AND carrera.fk_escuela = escuela.id
  );
