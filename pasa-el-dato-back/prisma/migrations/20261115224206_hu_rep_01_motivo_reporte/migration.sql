/*
  Warnings:

  - Added the required column `fk_motivo` to the `reporte_publicacion` table without a default value. This is not possible if the table is not empty.
  - Made the column `fk_reportante` on table `reporte_publicacion` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "reporte_publicacion" DROP CONSTRAINT "reporte_publicacion_fk_reportante_fkey";

-- AlterTable
ALTER TABLE "reporte_publicacion" ADD COLUMN     "fk_motivo" INTEGER NOT NULL,
ALTER COLUMN "fk_reportante" SET NOT NULL;

-- CreateTable
CREATE TABLE "motivo_reporte" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "motivo_reporte_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "motivo_reporte_nombre_key" ON "motivo_reporte"("nombre");

-- AddForeignKey
ALTER TABLE "reporte_publicacion" ADD CONSTRAINT "reporte_publicacion_fk_motivo_fkey" FOREIGN KEY ("fk_motivo") REFERENCES "motivo_reporte"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reporte_publicacion" ADD CONSTRAINT "reporte_publicacion_fk_reportante_fkey" FOREIGN KEY ("fk_reportante") REFERENCES "cuenta"("id_cuenta") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- HU-REP-01 (RN6): un mismo reportante solo tiene un reporte en curso por
-- publicación. Índice parcial fuera del modelo Prisma (Postgres específico).
CREATE UNIQUE INDEX "uq_reporte_publicacion_en_curso"
ON "reporte_publicacion" ("fk_publicacion", "fk_reportante")
WHERE "estado" IN ('PENDIENTE'::"EstadoReportePublicacion", 'EN_PROCESO'::"EstadoReportePublicacion");
