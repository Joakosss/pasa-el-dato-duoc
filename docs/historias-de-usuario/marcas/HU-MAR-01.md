# HU-MAR-01 — Crear y autorizar cuenta de marca

**Como** administrador
**quiero** crear cuentas de marca con su nombre y autorizarlas
**para** habilitar a patrocinadores de Duoc UC a publicar banners en la plataforma.

## Criterios de aceptación

- **Dado** que soy un administrador autenticado y entrego nombre de la marca, correo, teléfono y una contraseña inicial válida,
  **cuando** confirmo la creación,
  **entonces** el sistema crea la cuenta con rol "Marca" ya autorizada y activa, asociada al nombre entregado.

- **Dado** que la cuenta se creó con su credencial inicial,
  **cuando** concluye la creación,
  **entonces** me queda disponible para entregarla a la marca (la entrega de credenciales se realiza fuera del sistema, en el trato con la marca).

- **Dado** que la creación y la autorización van juntas,
  **cuando** la cuenta se crea,
  **entonces** no requiere un paso de autorización posterior independiente: nace autorizada por la acción del administrador.

- **Dado** que el correo indicado ya pertenece a otra cuenta,
  **cuando** intento crear la cuenta,
  **entonces** el sistema rechaza la operación e indica que el correo ya está registrado.

- **Dado** que falta el nombre de la marca, el correo o el teléfono, o un valor es inválido,
  **cuando** intento crear la cuenta,
  **entonces** el sistema no la crea e indica el campo inválido.

- **Dado** que no estoy autenticado o no tengo rol de administrador,
  **cuando** intento crear cuentas de marca,
  **entonces** el sistema rechaza la operación.

- **Dado** que una marca se bloquea por administración,
  **cuando** intenta iniciar sesión posteriormente,
  **entonces** aplica el comportamiento de bloqueo general del modelo (BASE-EXTRA), no un flujo especial de este dominio.

## Reglas de negocio

Decisiones de negocio aprobadas:

- Solo un administrador autenticado crea cuentas de marca y les entrega el acceso a la marca (creada y autorizada en un solo paso por el admin; las credenciales se entregan fuera del sistema, decisión aprobada).
- La creación y la autorización son una sola acción del administrador: la cuenta nace con rol "Marca" y autorizada (decisión aprobada).
- El correo de la marca no requiere dominio institucional @duocuc.cl: puede ser un correo comercial externo válido. La exigencia @duocuc.cl es exclusiva del registro de estudiantes (decisión aprobada).
- La cuenta de marca se identifica por su nombre y su correo (entidad `MARCA` del MER: `id_cuenta` FK + nombre, sobre `CUENTA` con correo único).
- El rol "Marca" ya existe en el catálogo de roles del backend.
- Fuera de alcance de esta HU: banners (HU-PU-01 y siguientes), bloqueo de cuentas (dominio administración), recuperación de contraseña de la marca (CU003 aplica).

Nota técnica de origen (no define diseño): el catálogo de roles con "Marca" existe en el seed del backend; el modelo `MARCA` del MER (id_cuenta FK + nombre) no está en el `schema.prisma` todavía.

## Subtareas

### Backend (BE)

- **HU-MAR-01-BE01:** Definir entidad `Marca` y su persistencia (Prisma):  
  - agregar modelo `Marca` en `schema.prisma` con `id_cuenta` (FK a `Cuenta`) y `nombre`.  
  - migración correspondiente.

- **HU-MAR-01-BE02:** Endpoint admin para crear cuenta de marca autorizada:  
  - `POST /api/admin/marcas` con `{ nombre, correo, telefono, contrasenaInicial }`.  
  - crea `Cuenta` con rol **Marca**, `aprobada=true`, `bloqueado=false`, `clave_hash` (Argon2) de la contraseña inicial entregada (patrón BASE).  
  - crea registro `Marca` asociado.

- **HU-MAR-01-BE03:** Validaciones + errores:  
  - 400/422 campos inválidos (nombre/correo/teléfono).  
  - 409 si correo ya existe.  
  - 401 sin sesión, 403 sin rol admin.

- **HU-MAR-01-BE04:** Seguridad: aplicar guard de JWT + guard de rol Admin.

- **HU-MAR-01-BE05:** Swagger + DTOs (request/response) para endpoint de administración.

- **HU-MAR-01-BE06:** Pruebas e2e:  
  - crea marca OK  
  - correo duplicado rechaza  
  - 401 sin sesión  
  - 403 sin rol admin

- **HU-MAR-01-BE07:** Auditoría/logging: registrar en `log_api` la creación (cuenta admin) y resultado.

### Frontend (FE)

- **HU-MAR-01-FE01:** Pantalla/formulario admin “Crear marca”: nombre, correo, teléfono (y contraseña inicial si se define en spec).

- **HU-MAR-01-FE02:** Integración con API admin `POST /api/admin/marcas` y manejo de errores (409 correo duplicado, 401/403).

- **HU-MAR-01-FE03:** Feedback UX: loading, success toast, y mantener valores al error.

## Dependencias

- Rol administrador autenticado (módulo auth y roles existentes).
- Modelo `Cuenta` vigente (correo único, patrón BASE/BASE-EXTRA).
- Esta HU desbloquea HU-PU-01 (crear banner exige cuenta de marca autorizada).

## Prioridad

**Alta**

Prerrequisito directo de todo el dominio publicidad: sin cuenta de marca autorizada no hay banners.

## Dudas pendientes

- Dominio del correo y entrega de credenciales: resuelto el dominio (correo comercial externo permitido) y la entrega (contraseña inicial definida por el admin, entregada a la marca fuera del sistema). Ninguna bloqueante.

## Estado

`lista` — lista para comenzar `explore → proposal → spec + design → tasks → apply-progress → verify-report → archive-report`. Dudas restantes se cierran en spec.
