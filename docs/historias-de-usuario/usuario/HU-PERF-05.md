# HU-PERF-05 — Cambiar mi contraseña

**Como** usuario autenticado  
**quiero** cambiar mi contraseña  
**para** mantener la seguridad de mi cuenta ante riesgo o renovación de credenciales.

## Criterios de aceptación

- **Dado** sesión válida y datos válidos,  
  **cuando** confirmo el cambio de contraseña con mi contraseña actual y una nueva contraseña,  
  **entonces** el sistema actualiza la contraseña y confirma la operación.

- **Dado** sesión válida,  
  **cuando** ingreso una contraseña actual incorrecta,  
  **entonces** el sistema rechaza el cambio sin indicar detalles adicionales que faciliten la validación de credenciales.

- **Dado** sesión válida,  
  **cuando** ingreso una nueva contraseña que no cumple las reglas definidas,  
  **entonces** el sistema rechaza el cambio e indica el campo inválido, conservando la contraseña anterior.

- **Dado** sin sesión válida,  
  **cuando** intento cambiar mi contraseña,  
  **entonces** el sistema rechaza la operación por autenticación requerida.

- **Dado** que el cambio de contraseña se completa,  
  **cuando** vuelvo a usar la plataforma,  
  **entonces** la sesión se mantiene o se invalida según la política definida para el MVP, sin quedar la cuenta en un estado inconsistente.

## Reglas de negocio

- Solo un usuario autenticado cambia la contraseña de su propia cuenta.
- El cambio requiere confirmar la contraseña actual.
- La nueva contraseña debe cumplir las reglas definidas para el MVP (mínimos y restricciones).
- El sistema no debe revelar información que facilite la validación de credenciales (mensajes de error genéricos cuando corresponda).
- La política post-cambio (mantener sesión actual o forzar reautenticación) debe estar definida antes de especificar el comportamiento final.

## Dependencias

- HU-AUTH-01 — Iniciar sesión.
- CU001 y `docs/requerimientos/usuarios-autenticacion.md`.

## Fuera de alcance

- Recuperación de contraseña por correo o flujos de “olvidé mi contraseña”.
- Auditoría de cambios de credenciales.

## Prioridad sugerida

**Media**

Mejora seguridad del MVP sin bloquear flujos base de autenticación y uso.

## Dudas pendientes

- Reglas exactas de contraseña para el MVP.
- Política de sesión tras cambiar contraseña (mantener o forzar re-login).

## Estado

`borrador` — requiere definir reglas de contraseña y política de sesión antes de pasar a `lista`.
