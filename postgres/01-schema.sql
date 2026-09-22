-- 01-schema.sql — ESQUEMA OFICIAL
-- Corre solo la primera vez (volumen vacío)

CREATE TABLE IF NOT EXISTS cuenta (
  id_cuenta UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  correo TEXT UNIQUE NOT NULL,
  clave_hash TEXT NOT NULL,
  telefono TEXT NOT NULL,
  aprobada BOOLEAN NOT NULL DEFAULT TRUE,

  -- BASE
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_modificacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  eliminado BOOLEAN NOT NULL DEFAULT FALSE,
  fk_modificado_por UUID,

  -- BASE-EXTRA
  bloqueado BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_bloqueo TIMESTAMPTZ,
  motivo_bloqueo TEXT,

  CONSTRAINT fk_cuenta_modificado_por
    FOREIGN KEY (fk_modificado_por)
    REFERENCES cuenta(id_cuenta)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS rol_usuario (
  id SERIAL PRIMARY KEY,
  descripcion TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS sede (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  activa BOOLEAN NOT NULL DEFAULT TRUE,

  -- BASE
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_modificacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  eliminado BOOLEAN NOT NULL DEFAULT FALSE,
  fk_modificado_por UUID,

  CONSTRAINT fk_sede_modificado_por
    FOREIGN KEY (fk_modificado_por)
    REFERENCES cuenta(id_cuenta)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS escuela (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS carrera (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,

  fk_escuela INTEGER NOT NULL
    REFERENCES escuela(id)
);

CREATE TABLE IF NOT EXISTS usuario (
  id_cuenta UUID PRIMARY KEY
    REFERENCES cuenta(id_cuenta) ON DELETE CASCADE,

  run TEXT UNIQUE NOT NULL,
  p_nombre TEXT NOT NULL,
  s_nombre TEXT,
  p_apellido TEXT NOT NULL,
  s_apellido TEXT NOT NULL,

  fk_rol_usuario INTEGER NOT NULL
    REFERENCES rol_usuario(id),

  fk_sede INTEGER NOT NULL
    REFERENCES sede(id),

  fk_carrera INTEGER NOT NULL
    REFERENCES carrera(id)
);

CREATE TABLE IF NOT EXISTS log_api (
  id BIGSERIAL PRIMARY KEY,

  metodo TEXT NOT NULL,
  ruta TEXT NOT NULL,
  codigo_estado INTEGER NOT NULL,

  mensaje_error TEXT,

  fk_cuenta UUID
    REFERENCES cuenta(id_cuenta)
    ON DELETE SET NULL,

  fecha_hora TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS refresh_token (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  fk_cuenta UUID NOT NULL,

  -- Se guarda solamente el hash, nunca el token entregado al cliente.
  token_hash TEXT UNIQUE NOT NULL,

  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_expiracion TIMESTAMPTZ NOT NULL,

  -- NULL significa que el token todavía no ha sido revocado.
  fecha_revocacion TIMESTAMPTZ,

  CONSTRAINT fk_refresh_token_cuenta
    FOREIGN KEY (fk_cuenta)
    REFERENCES cuenta(id_cuenta)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_log_api_cuenta
  ON log_api(fk_cuenta);

CREATE INDEX IF NOT EXISTS idx_log_api_fecha_hora
  ON log_api(fecha_hora);

CREATE INDEX IF NOT EXISTS idx_usuario_rol
  ON usuario(fk_rol_usuario);

CREATE INDEX IF NOT EXISTS idx_usuario_sede
  ON usuario(fk_sede);

CREATE INDEX IF NOT EXISTS idx_usuario_carrera
  ON usuario(fk_carrera);

CREATE INDEX IF NOT EXISTS idx_carrera_escuela
  ON carrera(fk_escuela);

CREATE INDEX IF NOT EXISTS idx_cuenta_modificado_por
  ON cuenta(fk_modificado_por);

CREATE INDEX IF NOT EXISTS idx_sede_modificado_por
  ON sede(fk_modificado_por);

CREATE INDEX IF NOT EXISTS idx_refresh_token_cuenta
  ON refresh_token(fk_cuenta);