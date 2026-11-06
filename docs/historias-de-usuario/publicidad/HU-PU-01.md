# HU-PU-01 — Crear banner publicitario

**Como** marca autorizada por Duoc UC
**quiero** crear un banner publicitario con imagen, mensaje, vigencia y sedes destinatarias
**para** presentar mi marca a la comunidad estudiantil de las sedes que elijo.

## Criterios de aceptación

- **Dado** que soy una marca con cuenta autorizada y autenticada, entrego imagen, mensaje, fecha de inicio y fin, y una o más sedes válidas,
  **cuando** confirmo la creación,
  **entonces** el sistema guarda el banner y lo deja en espera de aprobación del administrador (no se muestra a los estudiantes).

- **Dado** que el periodo ingresado es inválido (fecha fin anterior a la fecha inicio),
  **cuando** intento crear el banner,
  **entonces** el sistema rechaza el formulario y solicita corregir las fechas.

- **Dado** que no selecciono ninguna sede destinataria, o la imagen o el mensaje faltan,
  **cuando** intento crear el banner,
  **entonces** el sistema no lo crea e indica el campo inválido.

- **Dado** que indico una sede que no existe o está inactiva en el catálogo,
  **cuando** intento crear el banner,
  **entonces** el sistema rechaza la creación por sede inválida.

- **Dado** que no estoy autenticado o mi cuenta no corresponde a una marca autorizada,
  **cuando** intento crear un banner,
  **entonces** el sistema rechaza la operación.

- **Dado** que creo el banner con datos válidos,
  **cuando** reviso su estado,
  **entonces** está pendiente de aprobación (no activo), asociado a mi cuenta de marca.

## Reglas de negocio

Aprobadas documentalmente (R.8, CU018 extendido, MER):

- Solo una cuenta de marca autorizada por Duoc UC puede crear banners (precondición CU018).
- El banner queda asociado a la marca que lo creó (entidad `BANNER_PUBLICIDAD` con `fk_marca`, más campos `BASE`).
- El banner se define con imagen, mensaje, fecha inicio, fecha fin y una o más sedes (forma `BANNER_SEDE`).
- La vigencia requiere fecha fin posterior a la fecha de inicio (CU018, curso alternativo 2).
- Todo banner nuevo nace pendiente de aprobación administrativa; no se publica sin aprobación (CU018, curso normal).
- La imagen del banner sigue la misma regla que las publicaciones: única imagen, formatos JPEG, PNG o WebP y máximo 5 MB (decisión aprobada; el MER define un campo imagen por banner).
- Límite de banners activos simultáneos por marca: 3 (decisión de proyecto). Se comprueba al aprobar (ver HU-PU-02).

Fuera de alcance de esta HU: aprobar o rechazar (HU-PU-02), edición (HU-PU-03) y eliminación (HU-PU-04), visualización a estudiantes (HU-PU-05).

Nota técnica de origen (no define diseño): no existe módulo de banners en el backend ni tablas en el `schema.prisma`; el MER del proyecto define `BANNER_PUBLICIDAD` y `BANNER_SEDE` como tablas de negocio.

## Dependencias

- HU-MAR-01: cuenta de marca creada y autorizada por el administrador (decisión aprobada: el admin crea y autoriza las cuentas en un solo paso).
- Catálogo de sedes disponible (implementado en backend).

## Prioridad

**Alta**

Inicio del ciclo de vida de la publicidad (R.8). Sin creación no hay qué aprobar ni mostrar.

## Dudas pendientes

- Ninguna bloqueante.

## Estado

`lista` — lista para comenzar `explore → proposal → spec + design → tasks → apply-progress → verify-report → archive-report`. Depende de HU-MAR-01.
