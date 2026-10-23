-- HU-UBI-01, fase A (T-08): catálogo ubicacional región→ciudad→comuna
-- y amarre de sede a comuna (comunaId nullable, ES-MIG-A).
-- Autorada con prisma migrate diff (entorno sin TTY no admite migrate dev); se aplica con migrate deploy.

-- AlterTable
ALTER TABLE "sede" ADD COLUMN     "fk_comuna" INTEGER;

-- CreateTable
CREATE TABLE "region" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo_subdere" TEXT NOT NULL,

    CONSTRAINT "region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ciudad" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "fk_region" INTEGER NOT NULL,

    CONSTRAINT "ciudad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comuna" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo_subdere" TEXT NOT NULL,
    "fk_ciudad" INTEGER NOT NULL,

    CONSTRAINT "comuna_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "region_codigo_subdere_key" ON "region"("codigo_subdere");

-- CreateIndex
CREATE INDEX "idx_ciudad_region" ON "ciudad"("fk_region");

-- CreateIndex
CREATE UNIQUE INDEX "ux_ciudad_nombre_region" ON "ciudad"("nombre", "fk_region");

-- CreateIndex
CREATE UNIQUE INDEX "comuna_codigo_subdere_key" ON "comuna"("codigo_subdere");

-- CreateIndex
CREATE INDEX "idx_comuna_ciudad" ON "comuna"("fk_ciudad");

-- CreateIndex
CREATE UNIQUE INDEX "sede_nombre_key" ON "sede"("nombre");

-- CreateIndex
CREATE INDEX "idx_sede_comuna" ON "sede"("fk_comuna");

-- AddForeignKey
ALTER TABLE "sede" ADD CONSTRAINT "sede_fk_comuna_fkey" FOREIGN KEY ("fk_comuna") REFERENCES "comuna"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ciudad" ADD CONSTRAINT "ciudad_fk_region_fkey" FOREIGN KEY ("fk_region") REFERENCES "region"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "comuna" ADD CONSTRAINT "comuna_fk_ciudad_fkey" FOREIGN KEY ("fk_ciudad") REFERENCES "ciudad"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

