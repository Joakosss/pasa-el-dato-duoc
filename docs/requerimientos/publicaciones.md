# Requerimientos — Publicaciones

## Objetivo

Permitir que los usuarios publiquen y administren productos o servicios ofrecidos dentro del marketplace Pasa el Dato Duoc.

## Alcance documentado

El proyecto contempla crear, editar y eliminar publicaciones. Una publicación se relaciona con un usuario, una sede, un tipo de venta y una categoría. También contempla imágenes y estados de publicación.

## Requisitos funcionales

- Permitir a un usuario autenticado crear una publicación.
- Registrar título o nombre de la publicación.
- Registrar descripción.
- Registrar precio.
- Asociar la publicación al usuario que la crea.
- Asociar la publicación a una sede.
- Asociar un tipo de venta, por ejemplo producto o servicio.
- Asociar una categoría.
- Permitir adjuntar una o más imágenes a la publicación.
- Mantener un estado de publicación.
- Permitir al propietario editar una publicación existente.
- Permitir al propietario eliminar o retirar una publicación.
- Permitir representar estados como en curso, pausada y vendida según el modelo vigente.
- Contemplar un contador de vistas si se mantiene en el modelo definitivo.

## Reglas y restricciones

- Solo un usuario autenticado puede crear publicaciones.
- La publicación debe quedar asociada a su propietario.
- Tipo de venta, categoría y sede deben corresponder a registros válidos.
- Las acciones de edición y eliminación deben respetar la propiedad de la publicación o permisos administrativos.
- El sistema contempla control administrativo y bloqueo de contenido/publicaciones dentro del marketplace.

## Datos involucrados

- Identificador de publicación.
- Título.
- Descripción.
- Precio.
- Estado.
- Tipo de venta.
- Categoría.
- Usuario propietario.
- Sede.
- Imágenes.
- Usuario comprador, si el modelo de cierre de venta lo requiere.
- Contador de vistas, si permanece en el alcance.

## Dependencias

- Usuarios autenticados.
- Sedes.
- Tipos de venta.
- Categorías.
- Estados de publicación.
- Almacenamiento de imágenes.

## Pendientes por definir

- Lista definitiva de estados permitidos.
- Si `eliminado` se manejará como estado de publicación o como bandera de borrado lógico del modelo base.
- Cantidad máxima de imágenes por publicación.
- Reglas definitivas para contenido o palabras prohibidas.
- Alcance de las funciones de IA para precio o recomendaciones.
