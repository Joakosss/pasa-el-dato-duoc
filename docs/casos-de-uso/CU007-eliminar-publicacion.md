# CU007 — Eliminar publicación

## Actor principal

Usuario propietario de la publicación.

## Objetivo

Permitir que el propietario retire o elimine una publicación que ya no desea mantener disponible.

## Precondiciones

- El usuario debe estar autenticado.
- La publicación debe existir.
- La publicación debe pertenecer al usuario, salvo acciones administrativas definidas por separado.

## Postcondiciones

- La publicación deja de estar disponible para el flujo normal del marketplace según la estrategia de eliminación definida por el sistema.

## Flujo principal

1. El usuario accede a una publicación propia.
2. El usuario selecciona la opción de eliminar o retirar publicación.
3. El sistema verifica que el usuario sea propietario de la publicación.
4. El sistema solicita confirmación de la acción cuando corresponda.
5. El usuario confirma.
6. El sistema aplica la eliminación o retiro de la publicación.
7. El sistema confirma la operación.

## Flujos alternativos y excepciones

### Publicación no pertenece al usuario

- Si el usuario intenta eliminar una publicación que no le pertenece, el sistema rechaza la operación.

### Publicación inexistente

- Si la publicación no existe, no se realiza ninguna modificación.

### Operación cancelada

- Si el usuario no confirma la eliminación, la publicación se mantiene sin cambios.

## Datos involucrados

- Identificador de publicación.
- Usuario propietario.
- Estado o bandera de eliminación, según el modelo definitivo.

## Notas y pendientes

- El modelo actual contempla un campo común `eliminado` para borrado lógico y también estados de publicación. Debe evitarse duplicar ambos conceptos sin una regla clara.
- La implementación física de borrado (lógico o definitivo) es una decisión de diseño técnico; este caso de uso solo exige que la publicación deje de estar disponible según la regla definida.
