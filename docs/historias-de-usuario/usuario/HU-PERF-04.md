# HU-PERF-04 — Actualizar mi cuenta

**Como** usuario autenticado  
**quiero** actualizar los datos editables de mi cuenta  
**para** mantener vigente mi información dentro de la plataforma sin crear una nueva cuenta.

## Criterios de aceptación

- **Dado** sesión válida y datos válidos,  
  **cuando** confirmo la actualización de mi cuenta,  
  **entonces** el sistema guarda los campos enviados y muestra mi cuenta con los nuevos valores.

- **Dado** sesión válida,  
  **cuando** intento actualizar mi cuenta,  
  **entonces** el sistema modifica exclusivamente mi propia cuenta y ningún otro dato.

- **Dado** sin sesión válida,  
  **cuando** intento actualizar mi cuenta,  
  **entonces** el sistema rechaza la operación por autenticación requerida.

- **Dado** que envío solo un subconjunto de campos editables,  
  **cuando** confirmo la actualización,  
  **entonces** el sistema actualiza solo los campos enviados y mantiene el resto sin cambios.

- **Dado** que no envío ningún campo,  
  **cuando** confirmo la actualización,  
  **entonces** el sistema no modifica datos y responde que no existen cambios para guardar.

- **Dado** datos que no cumplen validaciones,  
  **cuando** confirmo la actualización,  
  **entonces** el sistema rechaza el cambio e indica los campos inválidos, conservando los valores anteriores.

## Reglas de negocio

- Solo un usuario autenticado actualiza su propia cuenta.
- La actualización es parcial por campo: cada campo editable es opcional e independiente.
- Si no se envía ningún campo, no se modifica nada.
- Los datos de autenticación sensibles no se editan por este flujo (por ejemplo: credenciales, tokens, secretos u otros equivalentes).
- La lista de campos editables de cuenta para el MVP debe estar definida documentalmente antes de especificar el contrato.

## Dependencias

- HU-AUTH-01 — Iniciar sesión.
- HU-PERF-03 — Consultar mi cuenta.
- CU001 y `docs/requerimientos/usuarios-autenticacion.md`.

## Fuera de alcance

- Cambio de contraseña (historia separada).
- Edición de datos de perfil (teléfono, sede u otros equivalentes) se trata en HU-PERF-01/02.
- Auditoría de cambios de cuenta.

## Prioridad sugerida

**Media**

Completa la gestión básica de “Mi cuenta” para el MVP.

## Dudas pendientes

- Catálogo definitivo de campos editables de cuenta para el MVP (bloquea especificar; no bloquea explorar).

## Estado

`borrador` — requiere definir campos editables antes de pasar a `lista`.
