# HU-MAR-01 — Crear y autorizar cuenta de marca

**Como** administrador
**quiero** crear cuentas de marca con su nombre y autorizarlas
**para** habilitar a patrocinadores de Duoc UC a publicar banners en la plataforma.

## Criterios de aceptación

- **Dado** que soy un administrador autenticado y entrego nombre de la marca, correo y teléfono válidos,
  **cuando** confirmo la creación,
  **entonces** el sistema crea la cuenta con rol "Marca" ya autorizada y activa, asociada al nombre entregado.

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

- Solo un administrador autenticado crea cuentas de marca (decisión aprobada).
- La creación y la autorización son una sola acción del administrador: la cuenta nace con rol "Marca" y autorizada (decisión aprobada).
- La cuenta de marca se identifica por su nombre y su correo (entidad `MARCA` del MER: `id_cuenta` FK + nombre, sobre `CUENTA` con correo único).
- El rol "Marca" ya existe en el catálogo de roles del backend.
- Fuera de alcance de esta HU: banners (HU-PU-01 y siguientes), bloqueo de cuentas (dominio administración), recuperación de contraseña de la marca (CU003 aplica).

Nota técnica de origen (no define diseño): el catálogo de roles con "Marca" existe en el seed del backend; el modelo `MARCA` del MER (id_cuenta FK + nombre) no está en el `schema.prisma` todavía.

## Dependencias

- Rol administrador autenticado (módulo auth y roles existentes).
- Modelo `Cuenta` vigente (correo único, patrón BASE/BASE-EXTRA).
- Esta HU desbloquea HU-PU-01 (crear banner exige cuenta de marca autorizada).

## Prioridad

**Alta**

Prerrequisito directo de todo el dominio publicidad: sin cuenta de marca autorizada no hay banners.

## Dudas pendientes

1. ¿Dominio del correo de marca? El modelo CU0002 exige @duocuc.cl solo para estudiantes; la marca puede requerir un correo comercial externo. Definir en spec.
2. ¿Cómo obtiene la marca sus credenciales iniciales (contraseña provisional definida por el admin, correo de activación)? Definir en spec.

## Estado

`lista` — lista para comenzar `explore → proposal → spec + design → tasks → apply-progress → verify-report → archive-report`. Dudas restantes se cierran en spec.
