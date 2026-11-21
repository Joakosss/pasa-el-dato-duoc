-- Autorización explícita para procesar el texto de una publicación en IA mobile.
-- Las publicaciones existentes no reciben autorización automáticamente.
CREATE TABLE "mobile_consentimiento_ia" (
    "publicacion_id" UUID NOT NULL,
    "huella_texto" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "operacion_id" UUID NOT NULL,
    "vector" DOUBLE PRECISION[] NOT NULL DEFAULT ARRAY[]::DOUBLE PRECISION[],
    "autorizado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mobile_consentimiento_ia_pkey" PRIMARY KEY ("publicacion_id"),
    CONSTRAINT "mobile_consentimiento_ia_publicacion_id_fkey"
      FOREIGN KEY ("publicacion_id") REFERENCES "publicacion"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
);

-- El borrado lógico y las ediciones desde cualquier cliente invalidan el permiso.
CREATE FUNCTION "mobile_invalidar_consentimiento_ia"() RETURNS trigger AS $$
BEGIN
    IF NEW.eliminado = TRUE
       OR NEW.titulo IS DISTINCT FROM OLD.titulo
       OR NEW.descripcion IS DISTINCT FROM OLD.descripcion THEN
        DELETE FROM "mobile_consentimiento_ia" WHERE "publicacion_id" = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "mobile_invalidar_consentimiento_ia"
AFTER UPDATE OF "titulo", "descripcion", "eliminado" ON "publicacion"
FOR EACH ROW EXECUTE FUNCTION "mobile_invalidar_consentimiento_ia"();
