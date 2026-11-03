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

## Subtareas
### Backend (BE)
- **HU-PERF-06-BE01**: Definir decisión MVP: desactivación vs eliminación lógica (bandera/estado), y sus efectos sobre datos asociados (publicaciones, chat, etc.) sin borrado físico.
- **HU-PERF-06-BE02**: Crear endpoint protegido para eliminar/desactivar cuenta propia (p. ej. `DELETE /api/v1/cuenta/me` o `POST /api/v1/cuenta/me/desactivar`), con confirmación explícita desde el front.
- **HU-PERF-06-BE03**: Implementar regla: solo el usuario autenticado afecta su propia cuenta (vinculado a token) y rechazar sin sesión válida.
- **HU-PERF-06-BE04**: Aplicar la desactivación/eliminación lógica según lo definido (sin borrado físico), y asegurar idempotencia (si ya está desactivada, no duplicar cambios).
- **HU-PERF-06-BE05**: Bloquear autenticación de cuentas desactivadas/eliminadas lógicamente (ajustar flujo de login/guards según patrón existente).
- **HU-PERF-06-BE06**: Invalidar sesión/refresh tokens y cualquier resto de sesión reutilizable tras operación exitosa (alineado a HU-AUTH-03).
- **HU-PERF-06-BE07**: Pruebas unitarias e integración: confirmación requerida (a nivel de contrato), autenticación requerida, operación exitosa, login bloqueado posterior y limpieza de sesión.

### Frontend (FE)
- **HU-PERF-06-FE01**: Crear pantalla/sección “Eliminar o desactivar cuenta” en “Mi cuenta”, accesible solo autenticado.
- **HU-PERF-06-FE02**: Implementar modal/diálogo de confirmación explícita (confirmar/cancelar) antes de llamar a la API.
- **HU-PERF-06-FE03**: Manejar cancelación cerrando el modal sin efectuar cambios.
- **HU-PERF-06-FE04**: Integrar acción con la API, mostrando loading/disabled y notificación de éxito.
- **HU-PERF-06-FE05**: Tras éxito, limpiar estado local de sesión (store, cookies/localStorage según corresponda) y redirigir a pantalla pública/login.
- **HU-PERF-06-FE06**: Manejar errores (no autenticado, red, rechazo backend) con mensajes adecuados.

### Integración y QA (INT/QA)
- **HU-PERF-06-INT01**: Definir y documentar contrato OpenAPI/Swagger del endpoint (operación elegida, confirmación, respuestas, errores).
- **HU-PERF-06-INT02**: Pruebas de seguridad: verificar que no se pueda desactivar otra cuenta y que tras desactivación no se pueda reutilizar sesión.
- **HU-PERF-06-INT03**: Pruebas E2E: cancelar no cambia nada; confirmar desactiva/elimina lógicamente; luego intentar login y verificar rechazo.

## Estado

`borrador` — requiere decisión de “desactivar vs eliminar lógico” antes de pasar a `lista`.
