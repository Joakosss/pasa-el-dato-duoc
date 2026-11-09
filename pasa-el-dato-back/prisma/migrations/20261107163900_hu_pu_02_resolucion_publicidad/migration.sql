-- AlterTable
ALTER TABLE "banner_publicidad"
ADD COLUMN "motivo_rechazo" TEXT;

ALTER TABLE "banner_publicidad"
ADD COLUMN "fecha_aprobacion" TIMESTAMPTZ(6);

ALTER TABLE "banner_publicidad"
ADD COLUMN "fecha_rechazo" TIMESTAMPTZ(6);

-- CreateTable
CREATE TABLE "notificacion_marca" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fk_marca" UUID NOT NULL,
    "fk_banner" UUID,
    "tipo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacion_marca_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_notificacion_marca_lectura"
ON "notificacion_marca"("fk_marca", "leida");

-- CreateIndex
CREATE INDEX "idx_notificacion_marca_banner"
ON "notificacion_marca"("fk_banner");

-- AddForeignKey
ALTER TABLE "notificacion_marca"
ADD CONSTRAINT "notificacion_marca_fk_marca_fkey"
FOREIGN KEY ("fk_marca") REFERENCES "cuenta"("id_cuenta")
ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notificacion_marca"
ADD CONSTRAINT "notificacion_marca_fk_banner_fkey"
FOREIGN KEY ("fk_banner") REFERENCES "banner_publicidad"("id")
ON DELETE SET NULL ON UPDATE NO ACTION;
