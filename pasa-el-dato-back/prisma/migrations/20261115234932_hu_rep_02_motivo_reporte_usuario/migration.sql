/*
  Warnings:

  - Added the required column `fk_motivo` to the `reporte_usuario` table without a default value. This is not possible if the table is not empty.
  - Made the column `fk_reportante` on table `reporte_usuario` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "reporte_usuario" DROP CONSTRAINT "reporte_usuario_fk_reportante_fkey";

-- AlterTable
ALTER TABLE "reporte_usuario" ADD COLUMN     "fk_motivo" INTEGER NOT NULL,
ALTER COLUMN "fk_reportante" SET NOT NULL;

-- CreateTable
CREATE TABLE "motivo_reporte_usuario" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "motivo_reporte_usuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "motivo_reporte_usuario_nombre_key" ON "motivo_reporte_usuario"("nombre");

-- AddForeignKey
ALTER TABLE "reporte_usuario" ADD CONSTRAINT "reporte_usuario_fk_motivo_fkey" FOREIGN KEY ("fk_motivo") REFERENCES "motivo_reporte_usuario"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reporte_usuario" ADD CONSTRAINT "reporte_usuario_fk_reportante_fkey" FOREIGN KEY ("fk_reportante") REFERENCES "cuenta"("id_cuenta") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- HU-REP-02 (RN6): un mismo reportante solo tiene un reporte en curso por
-- usuario reportado. Índice parcial fuera del modelo Prisma (Postgres específico).
CREATE UNIQUE INDEX "uq_reporte_usuario_en_curso"
ON "reporte_usuario" ("fk_reportado", "fk_reportante")
WHERE "estado" IN ('PENDIENTE'::"EstadoReporteUsuario", 'EN_PROCESO'::"EstadoReporteUsuario");
