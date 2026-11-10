-- HU-NO-01 / HU-NO-02: historial de notificaciones de usuario y preferencia global.

ALTER TABLE "cuenta"
ADD COLUMN "notificaciones_push_habilitadas" BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TYPE "TipoNotificacionUsuario" AS ENUM (
    'CHAT_NUEVO_MENSAJE',
    'FAVORITA_VENDIDA',
    'REPORTE_RESULTADO',
    'ADMIN_ADVERTENCIA',
    'ADMIN_AVISO'
);

CREATE TABLE "notificacion_usuario" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fk_cuenta" UUID NOT NULL,
    "tipo" "TipoNotificacionUsuario" NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "data_json" JSONB,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacion_usuario_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_notificacion_usuario_lectura"
ON "notificacion_usuario"("fk_cuenta", "leida");

CREATE INDEX "idx_notificacion_usuario_fecha"
ON "notificacion_usuario"("fk_cuenta", "fecha_creacion");

ALTER TABLE "notificacion_usuario"
ADD CONSTRAINT "notificacion_usuario_fk_cuenta_fkey"
FOREIGN KEY ("fk_cuenta") REFERENCES "cuenta"("id_cuenta")
ON DELETE CASCADE ON UPDATE NO ACTION;
