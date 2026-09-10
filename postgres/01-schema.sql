-- 01-schema.sql — ESQUEMA OFICIAL (permanente, no borrar)
-- Refleja domain/models/User.ts y Dato.ts del front.
-- Corre solo la primera vez (volumen vacío).

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE estado_cuenta AS ENUM (
  'PENDIENTE',
  'ACTIVA'
);

CREATE TABLE IF NOT EXISTS cuenta (
  id_cuenta UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  correo TEXT UNIQUE NOT NULL,
  clave_hash TEXT NOT NULL,
  telefono TEXT NOT NULL,
  estado estado_cuenta NOT NULL DEFAULT 'PENDIENTE'
);

CREATE TABLE IF NOT EXISTS rol_usuario (
  id SERIAL PRIMARY KEY,
  descripcion TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS sede (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  activa BOOLEAN NOT NULL DEFAULT TRUE
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
    REFERENCES sede(id)
);

CREATE INDEX IF NOT EXISTS idx_usuario_rol
  ON usuario(fk_rol_usuario);

CREATE INDEX IF NOT EXISTS idx_usuario_sede
  ON usuario(fk_sede);