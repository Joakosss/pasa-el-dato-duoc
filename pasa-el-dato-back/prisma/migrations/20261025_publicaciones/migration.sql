-- HU-PUB-01 (T-01): catálogos de publicación (tipoventa, categoria,
-- estado_publicacion), tabla publicacion (con fk_user_comprador nullable y
-- contador_vistas por fidelidad al MER) e imagen_publicacion (único
-- fk_publicacion+orden). Autorada con prisma migrate diff (entorno sin TTY
-- no admite migrate dev); se aplica con migrate deploy.

-- CreateTable
CREATE TABLE "tipoventa" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "tipoventa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categoria" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estado_publicacion" (
    "id" SERIAL NOT NULL,
    "descripcion" TEXT NOT NULL,

    CONSTRAINT "estado_publicacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publicacion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "precio" INTEGER NOT NULL,
    "fk_estado_publicacion" INTEGER NOT NULL,
    "fk_tipoventa" INTEGER NOT NULL,
    "fk_categoria" INTEGER NOT NULL,
    "fk_usuario" UUID NOT NULL,
    "fk_sede" INTEGER NOT NULL,
    "fk_user_comprador" UUID,
    "contador_vistas" INTEGER NOT NULL DEFAULT 0,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_modificacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eliminado" BOOLEAN NOT NULL DEFAULT false,
    "fk_modificado_por" UUID,

    CONSTRAINT "publicacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imagen_publicacion" (
    "id_imagen" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fk_publicacion" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,

    CONSTRAINT "imagen_publicacion_pkey" PRIMARY KEY ("id_imagen")
);

-- CreateIndex
CREATE UNIQUE INDEX "tipoventa_nombre_key" ON "tipoventa"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "categoria_nombre_key" ON "categoria"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "estado_publicacion_descripcion_key" ON "estado_publicacion"("descripcion");

-- CreateIndex
CREATE INDEX "idx_publicacion_estado" ON "publicacion"("fk_estado_publicacion");

-- CreateIndex
CREATE INDEX "idx_publicacion_tipoventa" ON "publicacion"("fk_tipoventa");

-- CreateIndex
CREATE INDEX "idx_publicacion_categoria" ON "publicacion"("fk_categoria");

-- CreateIndex
CREATE INDEX "idx_publicacion_usuario" ON "publicacion"("fk_usuario");

-- CreateIndex
CREATE INDEX "idx_publicacion_sede" ON "publicacion"("fk_sede");

-- CreateIndex
CREATE INDEX "idx_publicacion_comprador" ON "publicacion"("fk_user_comprador");

-- CreateIndex
CREATE INDEX "idx_publicacion_modificado_por" ON "publicacion"("fk_modificado_por");

-- CreateIndex
CREATE INDEX "idx_imagen_publicacion_publicacion" ON "imagen_publicacion"("fk_publicacion");

-- CreateIndex
CREATE UNIQUE INDEX "ux_imagen_publicacion_publicacion_orden" ON "imagen_publicacion"("fk_publicacion", "orden");

-- AddForeignKey
ALTER TABLE "publicacion" ADD CONSTRAINT "publicacion_fk_estado_publicacion_fkey" FOREIGN KEY ("fk_estado_publicacion") REFERENCES "estado_publicacion"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "publicacion" ADD CONSTRAINT "publicacion_fk_tipoventa_fkey" FOREIGN KEY ("fk_tipoventa") REFERENCES "tipoventa"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "publicacion" ADD CONSTRAINT "publicacion_fk_categoria_fkey" FOREIGN KEY ("fk_categoria") REFERENCES "categoria"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "publicacion" ADD CONSTRAINT "publicacion_fk_usuario_fkey" FOREIGN KEY ("fk_usuario") REFERENCES "usuario"("id_cuenta") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "publicacion" ADD CONSTRAINT "publicacion_fk_sede_fkey" FOREIGN KEY ("fk_sede") REFERENCES "sede"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "publicacion" ADD CONSTRAINT "publicacion_fk_user_comprador_fkey" FOREIGN KEY ("fk_user_comprador") REFERENCES "cuenta"("id_cuenta") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "publicacion" ADD CONSTRAINT "publicacion_fk_modificado_por_fkey" FOREIGN KEY ("fk_modificado_por") REFERENCES "cuenta"("id_cuenta") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "imagen_publicacion" ADD CONSTRAINT "imagen_publicacion_fk_publicacion_fkey" FOREIGN KEY ("fk_publicacion") REFERENCES "publicacion"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

