# HU-PU-05 — Ver banners activos de mi sede

**Como** usuario autenticado
**quiero** ver los banners publicitarios activos de mi sede mientras uso la plataforma
**para** conocer las marcas patrocinadoras de la comunidad Duoc UC.

## Criterios de aceptación

- **Dado** que soy un usuario autenticado asociado a una sede,
  **cuando** navego el catálogo de publicaciones,
  **entonces** el sistema intercala banners activos de la publicidad en el mosaico del catálogo (base vigente del front lo anticipa).

- **Dado** que un banner está activo y corresponde a mi sede dentro de su vigencia,
  **cuando** consulta el catálogo,
  **entonces** el banner se muestra.

- **Dado** que el banner es de otra sede o está fuera de su periodo (antes de la fecha de inicio o después de la fecha fin),
  **cuando** consulta el catálogo,
  **entonces** el banner no se me muestra.

- **Dado** que un banner se muestra según mi sede actual,
  **cuando** cambio de sede en mi perfil a otra donde el banner no está destinado,
  **entonces** el banner deja de mostrarse.

- **Dado** que el banner fue eliminado por la marca después de estar activo,
  **cuando** consulta el catálogo,
  **entonces** ese banner no me muestra.

## Reglas de negocio

Aprobadas documentalmente (R.8, CU018 extendido) y decisiones del proyecto:

- Un banner solo se muestra si está activo (aprobado administrativamente, HU-PU-02).
- Un banner activo se muestra únicamente a los usuarios autenticados de las sedes destinatarias durante su periodo de vigencia (audiencia decidida: cualquier usuario autenticado de la sede, no solo estudiantes).
- Decisión de proyecto: la presentación se alinea con la base vigente del front: banners intercalados en el mosaico del catálogo (`interleaveSponsored` ya existe con datos mock).
- Decisión de proyecto (presentación): banners intercalados en el mosaico del catálogo con la lógica vigente del front (`interleaveSponsored`): primer patrocinio cerca de la posición 4, separación de ~6 posiciones entre patrocinios y sin zona de publicidad al final del mosaico.
- Fuera de alcance de esta HU: métricas de clics o impresiones, el alta de cuentas de marca (HU-MAR-01) y las notificaciones.

Nota técnica de origen (no define diseño): el `schema.prisma` y el backend no tienen módulos de banners, por lo que la persistencia de sedes destinatarias y vigencias se define en spec (basado en las tablas `BANNER_PUBLICIDAD` y `BANNER_SEDE` del MER).

## Subtareas

### Backend (BE)

- **HU-PU-05-BE01:** Query para obtener banners activos por sede del usuario autenticado.  
  - `GET /api/publicidad/banners/activos?limit=&cursor=`  
  - Filtrar por:
    - estado `ACTIVO`
    - sede del usuario
    - `inicio <= now <= fin`
    - `eliminado=false`

- **HU-PU-05-BE02:** Definir payload/DTO de banner para front.  
  - `id`, `imagenUrl`, `mensaje`, `inicio`, `fin`, `marca` (nombre), etc.

- **HU-PU-05-BE03:** Paginación/orden.  
  - Orden sugerido: más reciente o por prioridad (si existe).  
  - Paginación por cursor.

- **HU-PU-05-BE04:** Seguridad.  
  - Requiere sesión.  
  - 401 sin sesión.

- **HU-PU-05-BE05:** DTOs + Swagger.

- **HU-PU-05-BE06:** Pruebas e2e.  
  - Solo banners de mi sede.  
  - No muestra fuera de vigencia.  
  - No muestra eliminados.

### Frontend (FE)

- **HU-PU-05-FE01:** Integrar API `GET /api/publicidad/banners/activos` para sede actual.

- **HU-PU-05-FE02:** Adaptar el intercalado del mosaico para usar datos reales (reemplazar mock `interleaveSponsored`).

- **HU-PU-05-FE03:** Actualizar al cambiar sede: refetch y re-render del mosaico.

## Dependencias

- HU-PU-02 (banners aprobados y activos).
- HU-PU-01 y HU-PU-03 (ciclo de vida del banner).
- Mosaico del catálogo vigente en el front, con intercalado de patrocinios ya anticipado en `lib/mosaic`.

## Prioridad

**Media**

Es la consecuencia visible del ciclo de publicidad para el resto de la plataforma; no bloquea el flujo crear→aprobar.

## Dudas pendientes

- Ninguna bloqueante.

## Estado

`lista` — lista para comenzar `explore → proposal → spec + design → tasks → apply-progress → verify-report → archive-report`. Depende de HU-PU-02.
