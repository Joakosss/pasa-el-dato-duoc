-- HU catálogo académico (seed carreras): restricciones para seed idempotente.
-- Verificado que no existen valores duplicados en la BD antes de aplicar.

-- CreateIndex
CREATE UNIQUE INDEX "escuela_nombre_key" ON "escuela"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "ux_carrera_nombre_escuela" ON "carrera"("nombre", "fk_escuela");
