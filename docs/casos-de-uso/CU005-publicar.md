# CU005 — Crear publicación

## Actor principal

Usuario autenticado en rol de vendedor para la operación.

## Objetivo

Permitir que un usuario publique un producto o servicio dentro de Pasa el Dato Duoc.

## Precondiciones

- El usuario debe estar autenticado.
- Deben existir los catálogos necesarios para seleccionar sede, tipo de venta y categoría.

## Postcondiciones

- Si los datos son válidos, se crea una publicación asociada al usuario.
- La publicación queda relacionada con una sede, un tipo de venta y una categoría.

## Flujo principal

1. El usuario accede a la opción de crear publicación.
2. El sistema solicita los datos de la publicación.
3. El usuario ingresa título o nombre, descripción y precio.
4. El usuario selecciona tipo de venta.
5. El usuario selecciona categoría.
6. El usuario selecciona o confirma la sede asociada a la publicación.
7. El usuario adjunta imágenes si corresponde.
8. El sistema valida los datos ingresados y las relaciones seleccionadas.
9. El sistema crea la publicación asociada al usuario autenticado.
10. El sistema confirma que la publicación fue creada.

## Flujos alternativos y excepciones

### Datos obligatorios incompletos o inválidos

- Si falta un dato requerido o un valor no cumple las validaciones definidas, el sistema no crea la publicación.

### Catálogo inválido

- Si la sede, categoría o tipo de venta seleccionado no existe o no está disponible, el sistema rechaza la creación.

### Problema con imágenes

- Si una imagen no puede ser procesada o almacenada, el sistema debe informar el problema según las reglas que se definan para imágenes.

## Datos involucrados

- Título o nombre.
- Descripción.
- Precio.
- Usuario propietario.
- Sede.
- Tipo de venta.
- Categoría.
- Estado de publicación.
- Imágenes.

## Notas y pendientes

- El modelo contempla estados como `en curso`, `pausado` y `vendido`, pero el estado inicial definitivo debe quedar definido en la historia de usuario o regla de negocio correspondiente.
- La cantidad máxima de imágenes aún no está definida en los documentos disponibles.
- El control definitivo de contenido o palabras prohibidas debe especificarse antes de convertirlo en criterio de aceptación.
