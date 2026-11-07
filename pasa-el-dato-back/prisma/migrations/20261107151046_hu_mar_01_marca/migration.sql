-- CreateTable
CREATE TABLE "marca" (
    "id_cuenta" UUID NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "marca_pkey" PRIMARY KEY ("id_cuenta")
);

-- AddForeignKey
ALTER TABLE "marca" ADD CONSTRAINT "marca_id_cuenta_fkey" FOREIGN KEY ("id_cuenta") REFERENCES "cuenta"("id_cuenta") ON DELETE CASCADE ON UPDATE NO ACTION;
