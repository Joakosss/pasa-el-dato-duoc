-- CreateTable
CREATE TABLE "calificacion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "puntaje" INTEGER NOT NULL,
    "comentario" TEXT,
    "fk_publicacion" UUID NOT NULL,
    "fk_emisor" UUID NOT NULL,
    "fk_receptor" UUID NOT NULL,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_modificacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calificacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_calificacion_publicacion" ON "calificacion"("fk_publicacion");

-- CreateIndex
CREATE INDEX "idx_calificacion_receptor" ON "calificacion"("fk_receptor");

-- CreateIndex
CREATE INDEX "idx_calificacion_emisor" ON "calificacion"("fk_emisor");

-- CreateIndex
CREATE UNIQUE INDEX "ux_calificacion_publicacion_emisor_receptor" ON "calificacion"("fk_publicacion", "fk_emisor", "fk_receptor");

-- AddForeignKey
ALTER TABLE "calificacion" ADD CONSTRAINT "calificacion_fk_publicacion_fkey" FOREIGN KEY ("fk_publicacion") REFERENCES "publicacion"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "calificacion" ADD CONSTRAINT "calificacion_fk_emisor_fkey" FOREIGN KEY ("fk_emisor") REFERENCES "cuenta"("id_cuenta") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "calificacion" ADD CONSTRAINT "calificacion_fk_receptor_fkey" FOREIGN KEY ("fk_receptor") REFERENCES "cuenta"("id_cuenta") ON DELETE RESTRICT ON UPDATE NO ACTION;
