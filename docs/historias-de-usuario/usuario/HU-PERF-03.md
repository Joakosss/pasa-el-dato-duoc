# HU-PERF-03 — Consultar mis datos principales (Mi cuenta)

**Como** usuario autenticado  
**quiero** consultar mis datos principales  
**para** conocer la información vigente asociada a mi acceso a la plataforma.

> Nota de unificación: en el MVP actual, “Mi cuenta” se resuelve con el mismo
> endpoint y DTO que “Mi perfil” (`GET /api/perfil/me`), ya que la respuesta
> incluye datos provenientes de `Cuenta` (correo, teléfono) y `Usuario`
> (identidad, sede, carrera, rol), sin exponer información sensible.

## Criterios de aceptación

- **Dado** sesión válida,  
  **cuando** consulto mis datos principales,  
  **entonces** el sistema muestra mis datos vigentes **sin exponer información sensible de autenticación** (ej.: `clave_hash`, tokens, secretos u otros equivalentes).

- **Dado** sin sesión válida,  
  **cuando** intento consultar mis datos principales,  
  **entonces** el sistema rechaza la operación por autenticación requerida.

- **Dado** sesión válida,  
  **cuando** consulto mis datos principales,  
  **entonces** el sistema solo me entrega datos de mi propia cuenta/perfil y nunca datos de otra cuenta.

## Reglas de negocio

- Solo un usuario autenticado consulta sus propios datos.
- Los datos sensibles de autenticación nunca se exponen.
- La consulta no permite inferir información privada de otros usuarios.

## Dependencias

- HU-AUTH-01 — Iniciar sesión.
- CU001 y `docs/requerimientos/usuarios-autenticacion.md`.

## Fuera de alcance

- Auditoría de consultas.
- Consulta de perfiles/cuentas de terceros.
- Exponer datos sensibles (hashes/tokens), aunque existan en la base de datos.

## Prioridad sugerida

**Media**

Habilita una sección “Mi cuenta” para el MVP y reutiliza el contrato de perfil.

## Endpoint de referencia (MVP)

- `GET /api/perfil/me` (sin prefijo `/api/v1`).

## Estado

`satisfecha-por-unificacion` — HU-PERF-01 (“Consultar mi perfil”) cubre este alcance en el MVP mediante el endpoint `/api/perfil/me`.
