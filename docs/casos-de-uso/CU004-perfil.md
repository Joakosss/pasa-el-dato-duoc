# CU004 — Gestionar perfil

## Actor principal

Usuario autenticado.

## Objetivo

Permitir que el usuario consulte y actualice la información de su perfil dentro de Pasa el Dato Duoc.

## Precondiciones

- El usuario debe estar autenticado.
- Debe existir una cuenta y un usuario asociados.

## Postcondiciones

- El usuario puede visualizar la información disponible de su perfil.
- Si modifica datos permitidos y estos son válidos, los cambios quedan registrados.

## Flujo principal — Visualizar perfil

1. El usuario accede a su perfil.
2. El sistema identifica al usuario autenticado.
3. El sistema obtiene los datos asociados a su cuenta y usuario.
4. El sistema muestra la información del perfil.
5. El sistema muestra la sede asociada al usuario.

## Flujo principal — Actualizar perfil

1. El usuario accede a la opción de edición de perfil.
2. El sistema muestra los datos que pueden modificarse.
3. El usuario modifica uno o más datos permitidos.
4. El sistema valida los nuevos valores.
5. El sistema guarda los cambios válidos.
6. El sistema muestra el perfil actualizado.

## Datos editables documentados

Los documentos del proyecto contemplan especialmente:

- Teléfono.
- Sede.
- Fotografía de perfil.

## Flujos alternativos y excepciones

### Sede inválida

- Si la sede seleccionada no existe o no está disponible, el sistema no aplica el cambio.

### Datos inválidos

- Si un dato actualizado no cumple las validaciones definidas, el sistema rechaza el cambio y conserva la información anterior.

### Usuario no autenticado

- Si no existe una sesión válida, el sistema no permite acceder a la gestión del perfil.

## Datos involucrados

- RUN.
- Nombres.
- Apellidos.
- Correo.
- Teléfono.
- Sede.
- Fotografía de perfil, si se implementa.

## Reglas y notas

- La información sensible de autenticación, como `clave_hash`, no debe mostrarse en el perfil.
- El alcance definitivo de los campos editables distintos de teléfono, sede y fotografía sigue pendiente de definición.
- El modelo actual mantiene CUENTA y USUARIO como entidades separadas; no se requiere una tabla PERFIL independiente por ahora.
