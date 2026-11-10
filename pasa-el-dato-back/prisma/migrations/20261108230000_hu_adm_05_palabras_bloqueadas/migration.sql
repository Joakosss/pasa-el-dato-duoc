-- CreateTable
CREATE TABLE "palabra_bloqueada" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "termino" TEXT NOT NULL,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "palabra_bloqueada_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "palabra_bloqueada_termino_key" ON "palabra_bloqueada"("termino");
