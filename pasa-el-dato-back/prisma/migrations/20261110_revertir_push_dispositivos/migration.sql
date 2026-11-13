-- Reversión de preparación Expo Push: se conservan las notificaciones in-app.
-- Elimina solo tokens de dispositivos y su enum asociado.

BEGIN;

DROP TABLE IF EXISTS "dispositivo_notificacion";
DROP TYPE IF EXISTS "PlataformaDispositivoNotificacion";

COMMIT;
