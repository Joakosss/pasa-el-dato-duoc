# HU-PUB-03 — Eliminar publicación

**Como** usuario propietario autenticado  
**quiero** eliminar o retirar una publicación que ya no deseo mantener disponible  
**para** que deje de aparecer en el marketplace.

## Criterios de aceptación

- **Dado** que soy el propietario autenticado de una publicación no eliminada,
  **cuando** selecciono eliminar y confirmo la acción,
  **entonces** el sistema aplica la eliminación lógica, confirma la operación y la publicación deja de estar disponible en el flujo normal del marketplace.

- **Dado** que intento eliminar una publicación que no me pertenece,
  **cuando** ejecuto la eliminación,
  **entonces** el sistema rechaza la operación.

- **Dado** que la publicación no existe o ya está eliminada,
  **cuando** intento eliminarla,
  **entonces** el sistema no realiza ninguna modificación.

- **Dado** que no confirmo la eliminación cuando el sistema la solicita,
  **cuando** cancelo la operación,
  **entonces** la publicación se mantiene sin cambios.

## Reglas de negocio

Aprobadas documentalmente (CU007, requerimientos publicaciones):

- Solo el propietario autenticado elimina su publicación; acciones administrativas se tratan por separado.
- Tras eliminar, la publicación deja de estar disponible según la regla del sistema.
- Una publicación con `eliminado = true` no es editable y se excluye de las consultas normales (definido en HU-PUB-02).

Aprobadas MVP para esta HU:

- Eliminación lógica mediante la bandera común `eliminado = true`, no borrado físico.
- La publicación no eliminada es eliminable en cualquier estado, sin validar estado por ahora.
- La eliminación no se deshace desde el flujo de usuario; la recuperación es operación administrativa fuera del alcance del MVP.

Fuera de alcance: borrado físico de registros e imágenes, acciones administrativas de retiro.

## Dependencias

- HU-PUB-01 — Crear publicación.
- Usuarios autenticados.

## Prioridad

**Alta**

Completa el ciclo de vida básico del MVP junto con HU-PUB-01 y HU-PUB-02.

## Dudas pendientes

- Ninguna bloqueante para iniciar el flujo.

## Estado

`lista` — lista para comenzar `explore → proposal → spec + design → tasks → apply-progress → verify-report → archive-report`.

## Subtareas
### Backend (BE)
- **HU-PUB-03-BE01**: Crear endpoint protegido `DELETE /api/v1/publicaciones/{id}` vinculando la acción a la sesión del usuario.
- **HU-PUB-03-BE02**: Validar que la publicación exista, pertenezca al usuario autenticado (extraído del token) y no tenga `eliminado = true`.
- **HU-PUB-03-BE03**: Aplicar eliminación lógica mediante la bandera `eliminado = true` en base de datos, omitiendo borrado físico de registros o imágenes.
- **HU-PUB-03-BE04**: Configurar servicios de lectura, catálogo y búsquedas para filtrar y excluir automáticamente publicaciones con `eliminado = true`.
- **HU-PUB-03-BE05**: Desarrollar pruebas unitarias e integración para validar borrado lógico, restricciones de propietario y manejo de errores (no encontrada, ajena o ya eliminada).

### Frontend (FE)
- **HU-PUB-03-FE01**: Agregar botón/opción "Eliminar publicación" visible únicamente para el propietario de la publicación.
- **HU-PUB-03-FE02**: Crear modal/diálogo de confirmación que solicite la aprobación explícita antes de ejecutar el borrado.
- **HU-PUB-03-FE03**: Gestionar la cancelación en el modal cerrándolo y conservando la vista y datos de la publicación sin cambios.
- **HU-PUB-03-FE04**: Integrar la acción de eliminación con la API, deshabilitando botones y mostrando estado de carga durante el proceso.
- **HU-PUB-03-FE05**: Desplegar notificación (*toast*) de confirmación de éxito y redirigir/remover la publicación del listado local sin recarga manual.
- **HU-PUB-03-FE06**: Mostrar mensajes de error en la interfaz si el backend rechaza la solicitud (fallo de autorización, red o publicación no disponible).

### Integración y QA (INT/QA)
- **HU-PUB-03-INT01**: Definir y documentar el contrato OpenAPI/Swagger para el endpoint `DELETE /api/v1/publicaciones/{id}`.
- **HU-PUB-03-INT02**: Ejecutar pruebas de seguridad para verificar que no se puedan eliminar publicaciones de terceros inyectando IDs ajenos.
- **HU-PUB-03-INT03**: Realizar pruebas end-to-end (E2E) para escenarios de confirmación (verificando exclusión en catálogo/búsquedas) y cancelación del flujo.