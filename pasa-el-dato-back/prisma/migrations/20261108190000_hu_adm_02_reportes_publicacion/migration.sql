-- CreateEnum
CREATE TYPE "EstadoReportePublicacion" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'RESUELTO', 'DESCARTADO');

-- CreateEnum
CREATE TYPE "ResolucionReportePublicacion" AS ENUM ('RETIRO_PUBLICACION', 'ADVERTENCIA', 'DESCARTE');

-- CreateEnum
CREATE TYPE "TipoAuditoriaAdmin" AS ENUM (
    'TOMAR_REPORTE_PUBLICACION',
    'DESCARTAR_REPORTE_PUBLICACION',
    'REABRIR_REPORTE_PUBLICACION',
    'RETIRAR_PUBLICACION',
    'ADVERTIR_VENDEDOR'
);

-- CreateTable
CREATE TABLE "auditoria_admin" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accion" "TipoAuditoriaAdmin" NOT NULL,
    "fk_admin" UUID NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidad_id" TEXT NOT NULL,
    "detalle" TEXT,
    "fecha" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reporte_publicacion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "motivo" TEXT NOT NULL,
    "comentarios" TEXT,
    "fk_publicacion" UUID NOT NULL,
    "fk_reportante" UUID,
    "estado" "EstadoReportePublicacion" NOT NULL DEFAULT 'PENDIENTE',
    "fk_admin_asignado" UUID,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_modificacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_resolucion" TIMESTAMPTZ(6),
    "resolucion" "ResolucionReportePublicacion",
    "mensaje_advertencia" TEXT,
    "aviso_vendedor_registrado" BOOLEAN NOT NULL DEFAULT false,
    "aviso_vendedor_fecha" TIMESTAMPTZ(6),

    CONSTRAINT "reporte_publicacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_auditoria_admin_admin" ON "auditoria_admin"("fk_admin");

-- CreateIndex
CREATE INDEX "idx_auditoria_admin_entidad" ON "auditoria_admin"("entidad", "entidad_id");

-- CreateIndex
CREATE INDEX "idx_auditoria_admin_fecha" ON "auditoria_admin"("fecha");

-- CreateIndex
CREATE INDEX "idx_reporte_publicacion_estado_fecha" ON "reporte_publicacion"("estado", "fecha_creacion");

-- CreateIndex
CREATE INDEX "idx_reporte_publicacion_publicacion" ON "reporte_publicacion"("fk_publicacion");

-- CreateIndex
CREATE INDEX "idx_reporte_publicacion_reportante" ON "reporte_publicacion"("fk_reportante");

-- CreateIndex
CREATE INDEX "idx_reporte_publicacion_admin" ON "reporte_publicacion"("fk_admin_asignado");

-- AddForeignKey
ALTER TABLE "auditoria_admin"
    ADD CONSTRAINT "auditoria_admin_fk_admin_fkey"
    FOREIGN KEY ("fk_admin") REFERENCES "cuenta"("id_cuenta")
    ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reporte_publicacion"
    ADD CONSTRAINT "reporte_publicacion_fk_publicacion_fkey"
    FOREIGN KEY ("fk_publicacion") REFERENCES "publicacion"("id")
    ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reporte_publicacion"
    ADD CONSTRAINT "reporte_publicacion_fk_reportante_fkey"
    FOREIGN KEY ("fk_reportante") REFERENCES "cuenta"("id_cuenta")
    ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reporte_publicacion"
    ADD CONSTRAINT "reporte_publicacion_fk_admin_asignado_fkey"
    FOREIGN KEY ("fk_admin_asignado") REFERENCES "cuenta"("id_cuenta")
    ON DELETE SET NULL ON UPDATE NO ACTION;
