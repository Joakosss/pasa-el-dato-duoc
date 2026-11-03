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

## Subtareas
### Backend (BE)
- **HU-PERF-04-BE01**: Definir catálogo definitivo de campos editables de cuenta para el MVP (contrato y validaciones por campo).
- **HU-PERF-04-BE02**: Crear endpoint protegido de actualización parcial de cuenta (p. ej. `PATCH /api/v1/cuenta/me`), vinculando la modificación al usuario autenticado (desde token).
- **HU-PERF-04-BE03**: Implementar validación: actualizar solo campos enviados, mantener el resto sin cambios y rechazar campos no permitidos.
- **HU-PERF-04-BE04**: Manejar “sin cambios”: si no se envía ningún campo, no modificar datos y responder que no hay cambios para guardar (código/razón coherente con estándar API).
- **HU-PERF-04-BE05**: Asegurar que no se editen datos sensibles de autenticación por este flujo (credenciales, tokens, secretos u otros equivalentes).
- **HU-PERF-04-BE06**: Pruebas unitarias e integración para: actualización parcial, validaciones, intento sin campos, autenticación requerida y aislamiento (solo mi cuenta).

### Frontend (FE)
- **HU-PERF-04-FE01**: Crear/ajustar formulario de “Editar mi cuenta” con los campos permitidos para el MVP.
- **HU-PERF-04-FE02**: Implementar envío parcial (solo campos modificados) y estados de carga/deshabilitado durante guardado.
- **HU-PERF-04-FE03**: Manejar respuesta “sin cambios” mostrando feedback UX (sin tratarlo como error severo).
- **HU-PERF-04-FE04**: Mostrar confirmación de éxito y refrescar datos visibles de “Mi cuenta” (refetch o actualización local).
- **HU-PERF-04-FE05**: Manejar errores de validación por campo (mostrar mensajes por input) y errores generales (no autenticado, red).

### Integración y QA (INT/QA)
- **HU-PERF-04-INT01**: Definir y documentar contrato OpenAPI/Swagger del endpoint de actualización parcial (campos, validaciones, ejemplos, errores).
- **HU-PERF-04-INT02**: Pruebas de seguridad: confirmar que no se puede modificar otra cuenta, ni editar campos fuera del catálogo permitido.
- **HU-PERF-04-INT03**: Pruebas E2E: editar datos válidos, editar subset, enviar sin cambios, y validar persistencia en “Mi cuenta”.

## Estado

`borrador` — requiere definir campos editables antes de pasar a `lista`.
