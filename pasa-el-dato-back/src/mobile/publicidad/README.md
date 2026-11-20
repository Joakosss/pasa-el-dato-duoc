# Publicidad mobile

El endpoint autenticado `GET /api/mobile/publicidad/activos` devuelve los banners comerciales aprobados, vigentes y asignados a la sede del usuario. Prioriza los anuncios asociados a su carrera sin excluir los demás.

Las asociaciones de campañas comerciales con carreras se guardan en `mobile_banner_carrera`. Actualmente no existe una interfaz de administración para asignarlas.

## Campañas de demostración

Las tres campañas ficticias se almacenan por separado en PostgreSQL, incluidas sus imágenes y carreras objetivo. No son campañas comerciales aprobadas y en mobile se identifican como «Publicidad de demostración».

Para cargar o actualizar los ejemplos en la base de desarrollo, después de aplicar las migraciones:

```bash
podman exec -e CONFIRMAR_PUBLICIDAD_DEMO=si -e PUBLICIDAD_DEMO_DATABASE=pasaeldato pasael-back node src/mobile/publicidad/seed-publicidad-demo.mjs
```

El procedimiento valida que el nombre de la base coincida con el indicado, rechaza `NODE_ENV=production` y usa una transacción. Solo debe ejecutarse contra una base de desarrollo.

Para mostrar los ejemplos en el contenedor de desarrollo existente:

```bash
podman update --env MOBILE_PUBLICIDAD_DEMO=true pasael-back
podman restart pasael-back
```

La bandera está desactivada por defecto y no habilita los ejemplos si `NODE_ENV=production`. La configuración aplicada con `podman update` se pierde si se recrea el contenedor; debe habilitarse nuevamente solo en el entorno de desarrollo. Para desactivarla, ejecutar `podman update --unsetenv MOBILE_PUBLICIDAD_DEMO pasael-back` y reiniciar el contenedor.

La carga de ejemplos incorpora al catálogo las carreras objetivo que falten. No crea cuentas de marca ni modifica los banners comerciales.

## Fuentes de imágenes y catálogo

Las fotografías utilizadas en las campañas ficticias y sus enlaces de origen
están documentados en `assets/creditos-fotografias.json`. Las imágenes fueron
recortadas y llevan texto y una superposición de color. Se usa la
[licencia de Pexels](https://www.pexels.com/license/).

El catálogo de desarrollo se contrastó el 19 de noviembre de 2026 con las
fichas enlazadas desde las nueve escuelas de [Duoc UC](https://www.duoc.cl/oferta-academica/carreras/).
Las diferencias respecto a `prisma/datasets/carreras.json` se registran en
`catalogo-oficial-correcciones.json`. El archivo compartido no se modificó:
ejecutar su seed puede volver a agregar carreras que no aparecen en la
revisión. Las carreras vinculadas a usuarios deben revisarse antes de retirarlas.
