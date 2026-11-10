-- AlterTable
ALTER TABLE "publicacion" ADD COLUMN     "calificacion_activada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fecha_activacion_calificacion" TIMESTAMPTZ(6);
