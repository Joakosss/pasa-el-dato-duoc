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

## Subtareas
### Backend (BE)
- **HU-PERF-05-BE01**: Definir reglas exactas de contraseña para el MVP (mínimos, complejidad, restricciones) y unificar validación en DTO/servicio.
- **HU-PERF-05-BE02**: Definir política post-cambio de contraseña para el MVP (mantener sesión actual o forzar reautenticación) y su implementación.
- **HU-PERF-05-BE03**: Crear endpoint protegido para cambio de contraseña (p. ej. `POST /api/v1/cuenta/me/password` o equivalente), vinculado al usuario autenticado.
- **HU-PERF-05-BE04**: Implementar verificación de contraseña actual (comparación segura) y rechazo con mensaje genérico si es incorrecta.
- **HU-PERF-05-BE05**: Persistir la nueva contraseña usando el mecanismo de hashing definido por el backend (p. ej. Argon2 según arquitectura objetivo, si ya está implementado en el proyecto).
- **HU-PERF-05-BE06**: Implementar comportamiento de sesiones según política (p. ej. invalidación de refresh tokens/sesiones existentes o mantenerlas).
- **HU-PERF-05-BE07**: Pruebas unitarias e integración: contraseña actual incorrecta, nueva inválida, éxito, autenticación requerida y verificación de política de sesión.

### Frontend (FE)
- **HU-PERF-05-FE01**: Crear pantalla/formulario “Cambiar contraseña” con campos: contraseña actual, nueva contraseña y confirmación (si aplica por UX).
- **HU-PERF-05-FE02**: Implementar validación de cliente alineada a las reglas MVP (sin exponer detalles sensibles en mensajes).
- **HU-PERF-05-FE03**: Integrar con la API, mostrando loading/disabled durante envío y *toast* de éxito.
- **HU-PERF-05-FE04**: Manejar errores: contraseña actual incorrecta (mensaje genérico), nueva inválida (marcar campo), no autenticado y red.
- **HU-PERF-05-FE05**: Aplicar comportamiento post-cambio según política (mantener sesión o forzar re-login/redirect) y limpiar estado local si corresponde.

### Integración y QA (INT/QA)
- **HU-PERF-05-INT01**: Definir y documentar contrato OpenAPI/Swagger del cambio de contraseña (payload, validaciones, errores y política de sesión).
- **HU-PERF-05-INT02**: Pruebas de seguridad: evitar filtración de información en errores (no revelar si la contraseña actual “casi” coincide u otros detalles).
- **HU-PERF-05-INT03**: Pruebas E2E: cambio exitoso y verificación de comportamiento de sesión; rechazo por contraseña actual incorrecta; rechazo por contraseña nueva inválida.

## Estado

`borrador` — requiere definir reglas de contraseña y política de sesión antes de pasar a `lista`.
