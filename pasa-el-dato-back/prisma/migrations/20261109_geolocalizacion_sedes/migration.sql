-- Publicaciones cercanas: coordenadas de catálogo para cada sede Duoc.
-- No se almacena ubicación de personas ni de publicaciones.
-- Las coordenadas representan únicamente la ubicación pública de la sede.

BEGIN;

ALTER TABLE "sede"
  ADD COLUMN "latitud" DOUBLE PRECISION,
  ADD COLUMN "longitud" DOUBLE PRECISION;

COMMIT;
