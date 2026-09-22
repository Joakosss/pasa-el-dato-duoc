# CU006 — Editar publicación

## Actor principal

Usuario propietario de la publicación.

## Objetivo

Permitir que el propietario modifique la información de una publicación existente.

## Precondiciones

- El usuario debe estar autenticado.
- La publicación debe existir.
- La publicación debe pertenecer al usuario, salvo acciones administrativas definidas por separado.

## Postcondiciones

- Si los nuevos datos son válidos, la publicación queda actualizada.
- Si la modificación no es válida, se mantienen los datos anteriores.

## Flujo principal

1. El usuario accede a una publicación propia.
2. El usuario selecciona la opción de editar.
3. El sistema muestra la información actual de la publicación.
4. El usuario modifica uno o más campos permitidos.
5. El sistema valida los nuevos datos.
6. El sistema verifica las referencias a sede, categoría y tipo de venta cuando estas cambien.
7. El sistema guarda los cambios.
8. El sistema confirma la actualización.

## Flujos alternativos y excepciones

### Publicación no pertenece al usuario

- Si el usuario intenta editar una publicación de otro usuario, el sistema rechaza la operación.

### Publicación inexistente

- Si la publicación no existe o ya no se encuentra disponible según las reglas del sistema, no se realiza la edición.

### Datos inválidos

- Si algún valor no cumple las reglas definidas, el sistema rechaza la actualización correspondiente.

## Datos involucrados

El modelo contempla potencialmente la edición de:

- Título o nombre.
- Descripción.
- Precio.
- Sede.
- Tipo de venta.
- Categoría.
- Imágenes.
- Estado, cuando la funcionalidad correspondiente lo permita.

## Notas y pendientes

- Los documentos disponibles no cierran una lista definitiva de campos editables; debe definirse al redactar la HU sin inventar campos nuevos.
- Las reglas administrativas para editar o bloquear publicaciones se tratan por separado de la edición normal del propietario.
