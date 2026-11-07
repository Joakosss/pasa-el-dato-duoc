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

## Subtareas

### Backend (BE)

- **HU-PU-01-BE01:** Definir modelos y persistencia (Prisma) para banners.  
  - Modelos tentativos: `BannerPublicidad` y `BannerSede` (relación N:M con `Sede`).  
  - Incluir patrón BASE (`eliminado`, `fechaCreacion`, `fechaModificacion`, `fk_modificado_por` según convención vigente).

- **HU-PU-01-BE02:** Almacenamiento de imagen (1 archivo).  
  - Reusar reglas/validador de imágenes de publicaciones: JPEG/PNG/WebP, máx 5MB.  
  - Definir estrategia: reutilizar uploads existentes vs carpeta dedicada banners.

- **HU-PU-01-BE03:** Endpoint para crear banner (marca autenticada y autorizada).  
  - `POST /api/publicidad/banners` con multipart (imagen) + JSON (mensaje, inicio, fin, sedes).  
  - Estado inicial: `PENDIENTE`.

- **HU-PU-01-BE04:** Validaciones y errores.  
  - Fechas inválidas (fin < inicio).  
  - Sedes inexistentes/inactivas.  
  - Faltan campos requeridos.  
  - 401 sin sesión, 403 sin rol Marca/autorización.

- **HU-PU-01-BE05:** DTOs + Swagger (incluyendo upload multipart).

- **HU-PU-01-BE06:** Pruebas e2e.  
  - Marca crea banner OK → queda pendiente.  
  - Rechaza fechas inválidas.  
  - Rechaza sin sedes / sin imagen / sin mensaje.  
  - Rechaza sede inválida.

- **HU-PU-01-BE07:** Auditoría/logging en `log_api` (creación por cuenta marca).

### Frontend (FE)

- **HU-PU-01-FE01:** Formulario “Crear banner”: imagen, mensaje, inicio/fin, selector de sedes.

- **HU-PU-01-FE02:** Integración con `POST /api/publicidad/banners` (multipart) + manejo de errores.

- **HU-PU-01-FE03:** Vista de estado del banner creado (pendiente/aprobado/rechazado).

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
