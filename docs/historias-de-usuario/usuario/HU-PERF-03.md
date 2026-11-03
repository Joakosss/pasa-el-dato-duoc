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

## Estado

`borrador` — requiere acordar los campos exactos de respuesta antes de pasar a `lista`.
