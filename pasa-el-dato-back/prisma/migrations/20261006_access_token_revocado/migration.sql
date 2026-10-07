-- Denylist de access tokens revocados por logout. Solo jti revocados.
CREATE TABLE IF NOT EXISTS access_token_revocado (
  jti TEXT PRIMARY KEY,
  fk_cuenta UUID NOT NULL,
  fecha_expiracion TIMESTAMPTZ NOT NULL,
  CONSTRAINT fk_access_token_revocado_cuenta
    FOREIGN KEY (fk_cuenta)
    REFERENCES cuenta(id_cuenta)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_access_token_revocado_cuenta
  ON access_token_revocado(fk_cuenta);

CREATE INDEX IF NOT EXISTS idx_access_token_revocado_expiracion
  ON access_token_revocado(fecha_expiracion);
