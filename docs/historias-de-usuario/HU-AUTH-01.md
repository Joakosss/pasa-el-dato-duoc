# HU-AUTH-01 — Iniciar sesión con correo y contraseña

**Como** usuario registrado  
**quiero** iniciar sesión con mi correo institucional y contraseña  
**para** acceder a las funcionalidades que corresponden a mi rol.

## Criterios de aceptación

- **Dado** que tengo una cuenta activa y no bloqueada,  
  **cuando** ingreso mi correo `@duocuc.cl` y mi contraseña correcta,  
  **entonces** quedo autenticado y puedo acceder a las funcionalidades de mi rol.

- **Dado** que el correo no está registrado o la contraseña es incorrecta,  
  **cuando** intento iniciar sesión,  
  **entonces** el sistema rechaza el acceso con un mensaje genérico que no indica cuál de las dos credenciales falló.

- **Dado** que mi cuenta existe pero no está activa,  
  **cuando** intento iniciar sesión con credenciales correctas,  
  **entonces** el sistema rechaza el acceso por cuenta inactiva.

- **Dado** que mi cuenta está bloqueada,  
  **cuando** intento iniciar sesión con credenciales correctas,  
  **entonces** el sistema rechaza el acceso por cuenta bloqueada.

- **Dado** que falta el correo o la contraseña,  
  **cuando** intento iniciar sesión,  
  **entonces** el sistema solicita completar los datos requeridos y no inicia sesión.

## Reglas de negocio

- Correo y contraseña son obligatorios.
- El mensaje de credenciales inválidas no debe revelar si falló el correo o la contraseña.
- Solo una cuenta activa y no bloqueada puede iniciar sesión.
- La sesión autenticada debe mantener la relación con el rol del usuario para habilitar sus funcionalidades.
- Para el MVP actual, una cuenta registrada correctamente se considera activa (`activa = true`), según lo documentado en CU001. La verificación de correo (HU-REG-02) está postergada y no bloquea esta historia.

## Dependencias

- HU-REG-01 — Registro con correo institucional.
- Cuenta y usuario existentes.
- HU-REG-02 — Verificación de correo: postergada, no bloquea el MVP.

## Prioridad sugerida

**Alta**

Base del MVP y desbloquea perfil, publicaciones, búsqueda, favoritos, chat y resto del flujo.

## Dudas pendientes

- Ninguna bloqueante para iniciar el flujo.

## Estado

`lista` — lista para comenzar `explore → proposal → spec + design → tasks → apply-progress → verify-report → archive-report`.
