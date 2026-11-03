# HU-PUB-04 — Cambiar estado de publicación

**Como** usuario propietario autenticado  
**quiero** cambiar el estado de mi publicación entre en curso, pausada y vendida  
**para** controlar su visibilidad y reflejar el avance de mi venta.

## Criterios de aceptación

- **Dado** que soy el propietario autenticado de una publicación no eliminada,
  **cuando** cambio su estado a uno de los estados permitidos para el propietario,
  **entonces** el sistema actualiza el estado y confirma el cambio.

- **Dado** que intento cambiar el estado de una publicación que no me pertenece,
  **cuando** ejecuto el cambio,
  **entonces** el sistema rechaza la operación.

- **Dado** que la publicación no existe o está eliminada,
  **cuando** intento cambiar su estado,
  **entonces** el sistema no realiza el cambio.

- **Dado** que indico un estado que no existe o no es asignable por el propietario,
  **cuando** intento cambiar el estado,
  **entonces** el sistema rechaza el cambio por estado inválido.

- **Dado** que una publicación queda en un estado distinto de en curso,
  **cuando** se consulta el flujo normal del marketplace,
  **entonces** su disponibilidad responde a las reglas del estado definidas para el MVP.

## Reglas de negocio

Aprobadas documentalmente (requerimientos publicaciones, R.25):

- El sistema contempla estados de publicación como en curso, pausada y vendida según el modelo vigente.
- El cambio de estado respeta la propiedad de la publicación; acciones administrativas (bloqueo) se tratan por separado.

Aprobadas MVP para esta HU:

- Estados gestionables por el propietario: en curso, pausada, vendida.
- Aplica solo a publicaciones no eliminadas; `eliminado = true` es bandera de borrado lógico, no un estado (decisión definida en HU-PUB-02 y HU-PUB-03).
- Una publicación en cualquier estado distinto de eliminada permanece editable (definido en HU-PUB-02).

Pendiente de decisión antes de especificar:

- Catálogo definitivo de estados y sus reglas de visibilidad en el flujo normal del marketplace (una publicación pausada o vendida: ¿se oculta, se ve marcada o solo la ve su dueño?).
- Si existe un estado adicional inicial distinto de `Publicada` definido en HU-PUB-01 y cómo se relaciona con “en curso”.

Fuera de alcance: compra/cierre de venta con comprador (dominio compras), bloqueo administrativo (dominio administración).

## Dependencias

- HU-PUB-01 — Crear publicación.
- HU-PUB-02 — Editar publicación (reserva esta HU para el estado).
- Catálogo de estados de publicación disponible.
- Usuarios autenticados.

## Prioridad

**Media**

Cierra el ciclo de vida de la publicación tras CRUD básico; no bloquea crear/editar/eliminar.

## Dudas pendientes

- Catálogo definitivo de estados y reglas de visibilidad por estado (no bloquea explorar, bloquea especificar).
- Relación entre estado inicial `Publicada` (HU-PUB-01) y “en curso”.

## Subtareas
### Backend (BE)
- **HU-PUB-04-BE01**: Definir/implementar catálogo de estados permitidos para propietario (en curso, pausada, vendida) y su validación a nivel de servicio/DTO.
- **HU-PUB-04-BE02**: Crear endpoint protegido para cambio de estado (p. ej. `PATCH /api/v1/publicaciones/{id}/estado` o equivalente), vinculando la acción a la sesión del usuario.
- **HU-PUB-04-BE03**: Validar que la publicación exista, pertenezca al usuario autenticado (desde token), y no tenga `eliminado = true`.
- **HU-PUB-04-BE04**: Rechazar estados inválidos o no asignables por propietario (código/razón coherente con el estándar de la API).
- **HU-PUB-04-BE05**: Ajustar servicios/consultas del “flujo normal del marketplace” para aplicar reglas de visibilidad por estado (según decisión MVP pendiente) y asegurar consistencia con `eliminado = true`.
- **HU-PUB-04-BE06**: Desarrollar pruebas unitarias e integración para: cambio válido, publicación ajena, no encontrada, eliminada y estado inválido.

### Frontend (FE)
- **HU-PUB-04-FE01**: Agregar UI de cambio de estado disponible solo para el propietario (en detalle y/o “mis publicaciones”): selector/botones (en curso/pausada/vendida).
- **HU-PUB-04-FE02**: Implementar validación de UI para evitar estados no permitidos (alineado al catálogo definido) y mapear labels.
- **HU-PUB-04-FE03**: Integrar la acción con la API (mutación), deshabilitando controles y mostrando estado de carga durante el cambio.
- **HU-PUB-04-FE04**: Actualizar el estado en la vista (optimista o con refetch) y mostrar notificación (*toast*) de éxito.
- **HU-PUB-04-FE05**: Manejar errores de API (no autorizado, ajena, eliminada/no existe, estado inválido, red) mostrando mensajes accionables.

### Integración y QA (INT/QA)
- **HU-PUB-04-INT01**: Definir y documentar el contrato OpenAPI/Swagger para el cambio de estado (path, payload, respuestas de éxito/error).
- **HU-PUB-04-INT02**: Pruebas de seguridad: confirmar que no se pueda cambiar el estado de publicaciones de terceros (IDs ajenos) ni sin autenticación.
- **HU-PUB-04-INT03**: Pruebas E2E de cambios de estado y verificación de reglas de visibilidad en “flujo normal” (según decisión final para pausada/vendida).

## Estado

`requiere aclaración` — puede iniciar `explore` para levantar el modelo actual, pero la especificación necesita resolver los pendientes.
