# Requerimientos — Perfil de usuario

## Objetivo

Permitir que un usuario registrado consulte y mantenga la información de su perfil dentro de Pasa el Dato Duoc.

## Alcance documentado

El proyecto contempla una vista de perfil de usuario y la posibilidad de actualizar datos asociados al perfil. Los casos de uso definidos para perfil consideran especialmente teléfono, sede y fotografía de perfil.

## Requisitos funcionales

- Permitir al usuario autenticado visualizar su perfil.
- Mostrar los datos personales registrados del usuario.
- Mostrar la sede asociada al usuario.
- Permitir actualizar el teléfono.
- Permitir actualizar la sede.
- Permitir agregar o actualizar una fotografía de perfil.
- Mantener la relación entre el perfil y la cuenta autenticada.
- No exponer el hash de contraseña ni otros datos internos de autenticación.

## Datos involucrados

- RUN.
- Nombres.
- Apellidos.
- Correo.
- Teléfono.
- Sede.
- Fotografía de perfil, si la funcionalidad se implementa.

## Reglas y restricciones

- El usuario debe estar autenticado para modificar su propio perfil.
- La sede seleccionada debe existir en el catálogo de sedes disponible.
- Los datos de autenticación sensibles no forman parte de la información visible del perfil.

## Dependencias

- Registro de usuario.
- Inicio de sesión.
- Cuenta y usuario.
- Catálogo de sedes.
- Almacenamiento de imágenes, si se implementa fotografía de perfil.

## Pendientes por definir

- Qué campos, además de teléfono, sede y fotografía, pueden ser editados por el usuario.
- Formato, tamaño y almacenamiento definitivo de la fotografía.
- Si el correo institucional podrá modificarse mediante algún flujo especial.
