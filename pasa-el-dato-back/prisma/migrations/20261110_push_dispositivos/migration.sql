-- Push mobile: tokens Expo por dispositivo.
-- Los endpoints que los administran se exponen solo bajo /api/mobile/notificaciones.

BEGIN;

CREATE TYPE "PlataformaDispositivoNotificacion" AS ENUM ('ANDROID', 'IOS');

CREATE TABLE "dispositivo_notificacion" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "fk_cuenta" UUID NOT NULL,
  "expo_push_token" TEXT NOT NULL,
  "plataforma" "PlataformaDispositivoNotificacion" NOT NULL,
  "activo" BOOLEAN NOT NULL DEFAULT true,
  "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fecha_actualizacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "dispositivo_notificacion_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "dispositivo_notificacion_expo_push_token_key" UNIQUE ("expo_push_token"),
  CONSTRAINT "dispositivo_notificacion_fk_cuenta_fkey"
    FOREIGN KEY ("fk_cuenta") REFERENCES "cuenta"("id_cuenta")
    ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE INDEX "idx_dispositivo_notificacion_cuenta_activo"
  ON "dispositivo_notificacion"("fk_cuenta", "activo");

COMMIT;
