-- CreateEnum
CREATE TYPE "EstadoBannerPublicidad" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO');

-- CreateTable
CREATE TABLE "banner_publicidad" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fk_marca" UUID NOT NULL,
    "imagen" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "fecha_inicio" TIMESTAMPTZ(6) NOT NULL,
    "fecha_fin" TIMESTAMPTZ(6) NOT NULL,
    "estado" "EstadoBannerPublicidad" NOT NULL DEFAULT 'PENDIENTE',
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_modificacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eliminado" BOOLEAN NOT NULL DEFAULT false,
    "fk_modificado_por" UUID,

    CONSTRAINT "banner_publicidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banner_sede" (
    "fk_banner_publicidad" UUID NOT NULL,
    "fk_sede" INTEGER NOT NULL,

    CONSTRAINT "banner_sede_pkey" PRIMARY KEY ("fk_banner_publicidad","fk_sede")
);

-- CreateIndex
CREATE INDEX "idx_banner_publicidad_marca" ON "banner_publicidad"("fk_marca");

-- CreateIndex
CREATE INDEX "idx_banner_publicidad_estado" ON "banner_publicidad"("estado");

-- CreateIndex
CREATE INDEX "idx_banner_publicidad_vigencia" ON "banner_publicidad"("fecha_inicio", "fecha_fin");

-- CreateIndex
CREATE INDEX "idx_banner_publicidad_modificado_por" ON "banner_publicidad"("fk_modificado_por");

-- CreateIndex
CREATE INDEX "idx_banner_sede_sede" ON "banner_sede"("fk_sede");

-- AddForeignKey
ALTER TABLE "banner_publicidad" ADD CONSTRAINT "banner_publicidad_fk_marca_fkey" FOREIGN KEY ("fk_marca") REFERENCES "marca"("id_cuenta") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "banner_publicidad" ADD CONSTRAINT "banner_publicidad_fk_modificado_por_fkey" FOREIGN KEY ("fk_modificado_por") REFERENCES "cuenta"("id_cuenta") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "banner_sede" ADD CONSTRAINT "banner_sede_fk_banner_publicidad_fkey" FOREIGN KEY ("fk_banner_publicidad") REFERENCES "banner_publicidad"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "banner_sede" ADD CONSTRAINT "banner_sede_fk_sede_fkey" FOREIGN KEY ("fk_sede") REFERENCES "sede"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
