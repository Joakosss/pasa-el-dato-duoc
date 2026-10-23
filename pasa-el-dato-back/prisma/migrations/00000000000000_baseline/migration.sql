-- Baseline: esquema vigente al iniciar la estrategia de migraciones Prisma (HU-UBI-01, T-01).
-- Idempotente: CREATE TABLE/INDEX con IF NOT EXISTS y foreign keys envueltas en DO con
-- captura de duplicate_object, para aplicarse tanto sobre un volumen existente creado
-- previamente por postgres/01-schema.sql como sobre una base nueva.
-- Fuente de verdad: prisma/schema.prisma + prisma/migrations (ver diseño HU-UBI-01).

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE IF NOT EXISTS "cuenta" (
    "id_cuenta" UUID NOT NULL DEFAULT gen_random_uuid(),
    "correo" TEXT NOT NULL,
    "clave_hash" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_modificacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eliminado" BOOLEAN NOT NULL DEFAULT false,
    "fk_modificado_por" UUID,
    "bloqueado" BOOLEAN NOT NULL DEFAULT false,
    "fecha_bloqueo" TIMESTAMPTZ(6),
    "motivo_bloqueo" TEXT,
    "aprobada" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "cuenta_pkey" PRIMARY KEY ("id_cuenta")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "rol_usuario" (
    "id" SERIAL NOT NULL,
    "descripcion" TEXT NOT NULL,

    CONSTRAINT "rol_usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "sede" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_modificacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eliminado" BOOLEAN NOT NULL DEFAULT false,
    "fk_modificado_por" UUID,

    CONSTRAINT "sede_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "escuela" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "escuela_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "carrera" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "fk_escuela" INTEGER NOT NULL,

    CONSTRAINT "carrera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "usuario" (
    "id_cuenta" UUID NOT NULL,
    "run" TEXT NOT NULL,
    "p_nombre" TEXT NOT NULL,
    "s_nombre" TEXT,
    "p_apellido" TEXT NOT NULL,
    "s_apellido" TEXT NOT NULL,
    "fk_rol_usuario" INTEGER NOT NULL,
    "fk_sede" INTEGER NOT NULL,
    "fk_carrera" INTEGER NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id_cuenta")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "log_api" (
    "id" BIGSERIAL NOT NULL,
    "metodo" TEXT NOT NULL,
    "ruta" TEXT NOT NULL,
    "codigo_estado" INTEGER NOT NULL,
    "mensaje_error" TEXT,
    "fk_cuenta" UUID,
    "fecha_hora" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_api_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "refresh_token" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fk_cuenta" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_expiracion" TIMESTAMPTZ(6) NOT NULL,
    "fecha_revocacion" TIMESTAMPTZ(6),

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "access_token_revocado" (
    "jti" TEXT NOT NULL,
    "fk_cuenta" UUID NOT NULL,
    "fecha_expiracion" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "access_token_revocado_pkey" PRIMARY KEY ("jti")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "cuenta_correo_key" ON "cuenta"("correo");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_cuenta_modificado_por" ON "cuenta"("fk_modificado_por");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "rol_usuario_descripcion_key" ON "rol_usuario"("descripcion");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_sede_modificado_por" ON "sede"("fk_modificado_por");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_carrera_escuela" ON "carrera"("fk_escuela");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "usuario_run_key" ON "usuario"("run");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_usuario_rol" ON "usuario"("fk_rol_usuario");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_usuario_sede" ON "usuario"("fk_sede");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_usuario_carrera" ON "usuario"("fk_carrera");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_log_api_cuenta" ON "log_api"("fk_cuenta");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_log_api_fecha_hora" ON "log_api"("fecha_hora");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "refresh_token_token_hash_key" ON "refresh_token"("token_hash");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_refresh_token_cuenta" ON "refresh_token"("fk_cuenta");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_access_token_revocado_cuenta" ON "access_token_revocado"("fk_cuenta");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_access_token_revocado_expiracion" ON "access_token_revocado"("fecha_expiracion");

-- AddForeignKey
DO $do$ BEGIN
  ALTER TABLE "cuenta" ADD CONSTRAINT "fk_cuenta_modificado_por" FOREIGN KEY ("fk_modificado_por") REFERENCES "cuenta"("id_cuenta") ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $do$;

-- AddForeignKey
DO $do$ BEGIN
  ALTER TABLE "sede" ADD CONSTRAINT "fk_sede_modificado_por" FOREIGN KEY ("fk_modificado_por") REFERENCES "cuenta"("id_cuenta") ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $do$;

-- AddForeignKey
DO $do$ BEGIN
  ALTER TABLE "carrera" ADD CONSTRAINT "carrera_fk_escuela_fkey" FOREIGN KEY ("fk_escuela") REFERENCES "escuela"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $do$;

-- AddForeignKey
DO $do$ BEGIN
  ALTER TABLE "usuario" ADD CONSTRAINT "usuario_fk_carrera_fkey" FOREIGN KEY ("fk_carrera") REFERENCES "carrera"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $do$;

-- AddForeignKey
DO $do$ BEGIN
  ALTER TABLE "usuario" ADD CONSTRAINT "usuario_fk_rol_usuario_fkey" FOREIGN KEY ("fk_rol_usuario") REFERENCES "rol_usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $do$;

-- AddForeignKey
DO $do$ BEGIN
  ALTER TABLE "usuario" ADD CONSTRAINT "usuario_fk_sede_fkey" FOREIGN KEY ("fk_sede") REFERENCES "sede"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $do$;

-- AddForeignKey
DO $do$ BEGIN
  ALTER TABLE "usuario" ADD CONSTRAINT "usuario_id_cuenta_fkey" FOREIGN KEY ("id_cuenta") REFERENCES "cuenta"("id_cuenta") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $do$;

-- AddForeignKey
DO $do$ BEGIN
  ALTER TABLE "log_api" ADD CONSTRAINT "log_api_fk_cuenta_fkey" FOREIGN KEY ("fk_cuenta") REFERENCES "cuenta"("id_cuenta") ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $do$;

-- AddForeignKey
DO $do$ BEGIN
  ALTER TABLE "refresh_token" ADD CONSTRAINT "fk_refresh_token_cuenta" FOREIGN KEY ("fk_cuenta") REFERENCES "cuenta"("id_cuenta") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $do$;

-- AddForeignKey
DO $do$ BEGIN
  ALTER TABLE "access_token_revocado" ADD CONSTRAINT "fk_access_token_revocado_cuenta" FOREIGN KEY ("fk_cuenta") REFERENCES "cuenta"("id_cuenta") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $do$;

