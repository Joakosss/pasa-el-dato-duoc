# HU-PERF-06 — Eliminar o desactivar mi cuenta

**Como** usuario autenticado  
**quiero** eliminar o desactivar mi cuenta  
**para** dejar de usar la plataforma y reducir el riesgo de uso no deseado de mis credenciales.

## Criterios de aceptación

- **Dado** sesión válida,  
  **cuando** solicito eliminar o desactivar mi cuenta y confirmo la acción,  
  **entonces** el sistema aplica la desactivación o eliminación lógica definida para el MVP y confirma la operación.

- **Dado** sin sesión válida,  
  **cuando** intento eliminar o desactivar mi cuenta,  
  **entonces** el sistema rechaza la operación por autenticación requerida.

- **Dado** que cancelo la confirmación cuando el sistema la solicita,  
  **cuando** cancelo la operación,  
  **entonces** el sistema no realiza cambios y mi cuenta permanece activa.

- **Dado** que mi cuenta fue desactivada o eliminada lógicamente,  
  **cuando** intento iniciar sesión con mis credenciales,  
  **entonces** el sistema rechaza el acceso según la regla de cuentas inactivas o desactivadas.

- **Dado** que mi cuenta fue desactivada o eliminada lógicamente,  
  **cuando** se revisa el dispositivo,  
  **entonces** no quedan restos reutilizables de sesión para entrar sin credenciales.

## Reglas de negocio

- Solo un usuario autenticado elimina o desactiva su propia cuenta.
- La operación requiere confirmación explícita.
- Para el MVP, la forma exacta de “eliminar o desactivar” debe estar definida documentalmente (por ejemplo: desactivación o eliminación lógica) antes de especificar contrato.
- La operación no implica borrado físico de registros salvo definición explícita y aprobada.
- La cuenta desactivada o eliminada lógicamente no debe poder autenticarse.
- El cierre de sesión y limpieza de restos locales debe ocurrir tras la operación exitosa.

## Dependencias

- HU-AUTH-01 — Iniciar sesión.
- HU-AUTH-03 — Cerrar sesión (limpieza de estado local).
- CU001 y `docs/requerimientos/usuarios-autenticacion.md`.

## Fuera de alcance

- Eliminación física de información en base de datos o archivos.
- Recuperación automática de cuenta desactivada por flujo de usuario.
- Auditoría de eliminación/desactivación.

## Prioridad sugerida

**Baja a media**

Importante para seguridad y control de cuenta, pero no bloquea el flujo principal del MVP.

## Dudas pendientes

- Definir si el MVP implementa desactivación o eliminación lógica, y sus efectos sobre datos asociados.

## Estado

`borrador` — requiere decisión de “desactivar vs eliminar lógico” antes de pasar a `lista`.
