-- CreateEnum
CREATE TYPE "EstadoReporteUsuario" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'RESUELTO', 'DESCARTADO');

-- CreateEnum
CREATE TYPE "ResolucionReporteUsuario" AS ENUM ('BLOQUEO', 'ADVERTENCIA', 'DESCARTE');

-- DropForeignKey
ALTER TABLE "banner_publicidad" DROP CONSTRAINT "banner_publicidad_fk_marca_fkey";

-- DropForeignKey
ALTER TABLE "banner_publicidad" DROP CONSTRAINT "banner_publicidad_fk_modificado_por_fkey";

-- CreateTable
CREATE TABLE "reporte_usuario" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "descripcion" TEXT NOT NULL,
    "fk_reportado" UUID NOT NULL,
    "fk_reportante" UUID,
    "estado" "EstadoReporteUsuario" NOT NULL DEFAULT 'PENDIENTE',
    "fk_admin_asignado" UUID,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_modificacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_resolucion" TIMESTAMPTZ(6),
    "resolucion" "ResolucionReporteUsuario",
    "mensaje_advertencia" TEXT,
    "motivo_bloqueo" TEXT,

    CONSTRAINT "reporte_usuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_reporte_usuario_estado_fecha" ON "reporte_usuario"("estado", "fecha_creacion");

-- CreateIndex
CREATE INDEX "idx_reporte_usuario_reportado" ON "reporte_usuario"("fk_reportado");

-- CreateIndex
CREATE INDEX "idx_reporte_usuario_reportante" ON "reporte_usuario"("fk_reportante");

-- CreateIndex
CREATE INDEX "idx_reporte_usuario_admin" ON "reporte_usuario"("fk_admin_asignado");

-- AddForeignKey
ALTER TABLE "banner_publicidad" ADD CONSTRAINT "banner_publicidad_fk_marca_fkey" FOREIGN KEY ("fk_marca") REFERENCES "marca"("id_cuenta") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "banner_publicidad" ADD CONSTRAINT "banner_publicidad_fk_modificado_por_fkey" FOREIGN KEY ("fk_modificado_por") REFERENCES "cuenta"("id_cuenta") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reporte_usuario" ADD CONSTRAINT "reporte_usuario_fk_reportado_fkey" FOREIGN KEY ("fk_reportado") REFERENCES "cuenta"("id_cuenta") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reporte_usuario" ADD CONSTRAINT "reporte_usuario_fk_reportante_fkey" FOREIGN KEY ("fk_reportante") REFERENCES "cuenta"("id_cuenta") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reporte_usuario" ADD CONSTRAINT "reporte_usuario_fk_admin_asignado_fkey" FOREIGN KEY ("fk_admin_asignado") REFERENCES "cuenta"("id_cuenta") ON DELETE SET NULL ON UPDATE NO ACTION;
