# HU-PERF-03 — Consultar mi cuenta

**Como** usuario autenticado  
**quiero** consultar los datos principales de mi cuenta  
**para** conocer la información vigente asociada a mi acceso a la plataforma.

## Criterios de aceptación

- **Dado** sesión válida,  
  **cuando** consulto mi cuenta,  
  **entonces** el sistema muestra mis datos de cuenta vigentes sin exponer información sensible de autenticación.

- **Dado** sin sesión válida,  
  **cuando** intento consultar mi cuenta,  
  **entonces** el sistema rechaza la operación por autenticación requerida.

- **Dado** sesión válida,  
  **cuando** consulto mi cuenta,  
  **entonces** el sistema solo me entrega datos de mi propia cuenta y nunca datos de otra cuenta.

## Reglas de negocio

- Solo un usuario autenticado consulta su propia cuenta.
- Los datos de autenticación sensibles no se exponen (por ejemplo: credenciales, tokens, secretos u otros equivalentes).
- La consulta de cuenta no permite inferir información privada de otros usuarios.

## Dependencias

- HU-AUTH-01 — Iniciar sesión.
- CU001 y `docs/requerimientos/usuarios-autenticacion.md`.

## Fuera de alcance

- Edición de datos de perfil (teléfono, sede u otros equivalentes) se trata en HU-PERF-01/02.
- Auditoría de consultas de cuenta.

## Prioridad sugerida

**Media**

Habilita una sección “Mi cuenta” y soporta flujos de actualización de cuenta.

## Dudas pendientes

- Qué campos exactos componen “datos principales de cuenta” para el MVP (no bloquea explorar; bloquea especificar contrato).

## Subtareas
### Backend (BE)
- **HU-PERF-03-BE01**: Definir el contrato de “datos principales de cuenta” para el MVP (campos, tipos y qué se excluye por sensible).
- **HU-PERF-03-BE02**: Crear endpoint protegido para consultar la cuenta propia (p. ej. `GET /api/v1/cuenta/me` o equivalente), vinculando la consulta al usuario autenticado (desde token).
- **HU-PERF-03-BE03**: Asegurar que la respuesta no exponga información sensible de autenticación (tokens, hashes, secretos u otros equivalentes).
- **HU-PERF-03-BE04**: Implementar control de acceso: rechazar si no hay sesión válida y garantizar que nunca se pueda consultar la cuenta de otro usuario.
- **HU-PERF-03-BE05**: Desarrollar pruebas unitarias e integración para: autenticación requerida, respuesta correcta y ausencia de campos sensibles.

### Frontend (FE)
- **HU-PERF-03-FE01**: Crear/ajustar sección “Mi cuenta” que consulte y muestre los datos principales de cuenta definidos para el MVP.
- **HU-PERF-03-FE02**: Integrar consumo de API con manejo de carga (skeleton/spinner) y errores (no autenticado, red).
- **HU-PERF-03-FE03**: Implementar guard/redirección si no existe sesión válida, alineado al patrón de autenticación existente.
- **HU-PERF-03-FE04**: Asegurar que la UI no renderice ni persista datos sensibles (p. ej. evitar almacenar payload completo si incluye info no requerida).

### Integración y QA (INT/QA)
- **HU-PERF-03-INT01**: Definir y documentar contrato OpenAPI/Swagger del endpoint de consulta de cuenta propia.
- **HU-PERF-03-INT02**: Pruebas de seguridad: confirmar que no se puede forzar consulta de otra cuenta (IDs ajenos) y que el endpoint es solo “me”.
- **HU-PERF-03-INT03**: Pruebas E2E: sesión válida muestra datos; sesión inválida redirige/rechaza correctamente.

## Estado

`borrador` — requiere acordar los campos exactos de respuesta antes de pasar a `lista`.
