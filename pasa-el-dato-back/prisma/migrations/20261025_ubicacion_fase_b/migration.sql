-- HU-UBI-01, fase B: invertir la relación comuna-ciudad y preservar datos.
-- Preflight T-01 confirmó 0 comunas huérfanas y 0 ciudades con varias comunas.
-- No se inventan id_entidad para ciudades existentes: quedan NULL.
-- No se modifican ni eliminan registros de sede.

BEGIN;

-- Columnas nuevas, nullable durante el backfill.
ALTER TABLE "ciudad"
  ADD COLUMN "id_entidad" TEXT,
  ADD COLUMN "fk_comuna" INTEGER;

ALTER TABLE "comuna"
  ADD COLUMN "fk_region" INTEGER;

-- Guarda: toda comuna antigua debe apuntar a una ciudad existente.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "comuna" co
    LEFT JOIN "ciudad" ci ON ci."id" = co."fk_ciudad"
    WHERE ci."id" IS NULL
  ) THEN
    RAISE EXCEPTION 'Migración abortada: existen comunas huérfanas sin ciudad';
  END IF;
END $$;

-- Guarda: el modelo antiguo permite N comunas -> 1 ciudad. Invertirlo
-- elegiría una relación arbitraria; en ese caso se debe detener y decidir.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "comuna"
    GROUP BY "fk_ciudad"
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Migración abortada: una ciudad antigua está asociada a varias comunas';
  END IF;
END $$;

-- Backfill de región desde la relación anterior, antes de eliminar fk_ciudad.
UPDATE "comuna" co
SET "fk_region" = ci."fk_region"
FROM "ciudad" ci
WHERE co."fk_ciudad" = ci."id";

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "comuna" WHERE "fk_region" IS NULL) THEN
    RAISE EXCEPTION 'Migración abortada: backfill incompleto de comuna.fk_region';
  END IF;
END $$;

-- Backfill de la relación inversa; las ciudades sin comuna quedan NULL.
UPDATE "ciudad" ci
SET "fk_comuna" = co."id"
FROM "comuna" co
WHERE co."fk_ciudad" = ci."id";

-- Recién ahora la región es obligatoria.
ALTER TABLE "comuna" ALTER COLUMN "fk_region" SET NOT NULL;

-- Eliminar la relación y restricciones antiguas después del backfill.
ALTER TABLE "comuna" DROP CONSTRAINT "comuna_fk_ciudad_fkey";
DROP INDEX "idx_comuna_ciudad";
ALTER TABLE "comuna" DROP COLUMN "fk_ciudad";

DROP INDEX "ux_ciudad_nombre_region";

-- Nuevas restricciones e índices.
CREATE UNIQUE INDEX "ciudad_id_entidad_key" ON "ciudad"("id_entidad");
CREATE INDEX "idx_ciudad_comuna" ON "ciudad"("fk_comuna");
CREATE INDEX "idx_comuna_region" ON "comuna"("fk_region");

ALTER TABLE "ciudad"
  ADD CONSTRAINT "ciudad_fk_comuna_fkey"
  FOREIGN KEY ("fk_comuna") REFERENCES "comuna"("id")
  ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "comuna"
  ADD CONSTRAINT "comuna_fk_region_fkey"
  FOREIGN KEY ("fk_region") REFERENCES "region"("id")
  ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT;
