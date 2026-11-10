-- CreateTable
CREATE TABLE "favorito" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fk_publicacion" UUID NOT NULL,
    "fk_usuario" UUID NOT NULL,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_modificacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eliminado" BOOLEAN NOT NULL DEFAULT false,
    "fk_modificado_por" UUID,

    CONSTRAINT "favorito_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_favorito_publicacion" ON "favorito"("fk_publicacion");

-- CreateIndex
CREATE INDEX "idx_favorito_usuario" ON "favorito"("fk_usuario");

-- CreateIndex
CREATE INDEX "idx_favorito_modificado_por" ON "favorito"("fk_modificado_por");

-- CreateIndex
CREATE UNIQUE INDEX "ux_favorito_publicacion_usuario" ON "favorito"("fk_publicacion", "fk_usuario");

-- AddForeignKey
ALTER TABLE "favorito" ADD CONSTRAINT "favorito_fk_publicacion_fkey" FOREIGN KEY ("fk_publicacion") REFERENCES "publicacion"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "favorito" ADD CONSTRAINT "favorito_fk_usuario_fkey" FOREIGN KEY ("fk_usuario") REFERENCES "usuario"("id_cuenta") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "favorito" ADD CONSTRAINT "favorito_fk_modificado_por_fkey" FOREIGN KEY ("fk_modificado_por") REFERENCES "cuenta"("id_cuenta") ON DELETE SET NULL ON UPDATE NO ACTION;
