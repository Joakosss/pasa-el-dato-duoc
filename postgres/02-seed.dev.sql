-- 02-seed.dev.sql — RETIRADO DE INITDB
-- Este archivo ya no se monta en docker-entrypoint-initdb.d.
-- Su contenido dev (roles, escuela, carrera) y la sede "Puente Alto" migraron
-- al seed dev idempotente de pasa-el-dato-back/src/seed/seed-dev.ts:
--   podman compose exec back pnpm db:seed:dev
-- Conservado solo como referencia documental. Mantener sincronizado con
-- seed-dev.ts si cambian los datos dev.

INSERT INTO rol_usuario (descripcion)
VALUES ('Estudiante'), ('Administrador'), ('Marca')
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
