-- CreateTable
CREATE TABLE "mobile_banner_carrera" (
    "banner_id" UUID NOT NULL,
    "carrera_id" INTEGER NOT NULL,

    CONSTRAINT "mobile_banner_carrera_pkey" PRIMARY KEY ("banner_id","carrera_id")
);

-- CreateTable
CREATE TABLE "mobile_publicidad_demo" (
    "id" TEXT NOT NULL,
    "empresa" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "imagen" BYTEA NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "mobile_publicidad_demo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mobile_publicidad_demo_carrera" (
    "demo_id" TEXT NOT NULL,
    "carrera_id" INTEGER NOT NULL,

    CONSTRAINT "mobile_publicidad_demo_carrera_pkey" PRIMARY KEY ("demo_id","carrera_id")
);

-- CreateIndex
CREATE INDEX "mobile_banner_carrera_carrera_id_idx" ON "mobile_banner_carrera"("carrera_id");

-- CreateIndex
CREATE INDEX "mobile_publicidad_demo_carrera_carrera_id_idx" ON "mobile_publicidad_demo_carrera"("carrera_id");

-- AddForeignKey
ALTER TABLE "mobile_banner_carrera" ADD CONSTRAINT "mobile_banner_carrera_banner_id_fkey" FOREIGN KEY ("banner_id") REFERENCES "banner_publicidad"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mobile_banner_carrera" ADD CONSTRAINT "mobile_banner_carrera_carrera_id_fkey" FOREIGN KEY ("carrera_id") REFERENCES "carrera"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mobile_publicidad_demo_carrera" ADD CONSTRAINT "mobile_publicidad_demo_carrera_demo_id_fkey" FOREIGN KEY ("demo_id") REFERENCES "mobile_publicidad_demo"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mobile_publicidad_demo_carrera" ADD CONSTRAINT "mobile_publicidad_demo_carrera_carrera_id_fkey" FOREIGN KEY ("carrera_id") REFERENCES "carrera"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
