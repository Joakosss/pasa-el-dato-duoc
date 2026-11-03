# HU-AUTH-02 — Reconocer mi rol durante la sesión

**Como** usuario autenticado  
**quiero** que el sistema reconozca mi rol actual a partir de mi sesión  
**para** ver y usar solo las funcionalidades y secciones que me corresponden.

## Trazabilidad

- CU001 – Iniciar Sesión (token JWT y redirección según rol).
- CU004, CU005/CU006/CU007, CU008/CU009, CU015, CU016 (exigen sesión y distinguen por actor).
- CU013, CU014, CU019, CU020, CU018 (funciones solo-Administrador / Marca).
- R.1 – Autentificar, R.2 – Gestión de usuarios según permisos de cada rol, R.22 – Seguridad de acceso.
- R.6, R.7, R.8, R.31, R.32, R.34 (ejemplos de funciones restringidas por rol).

## Criterios de aceptación

- **Dado** que tengo una sesión vigente,  
  **cuando** el sistema necesita saber quién soy / qué rol tengo,  
  **entonces** obtiene mi rol desde mi sesión sin pedirme datos adicionales.

- **Dado** que tengo una sesión vigente,  
  **cuando** se consulta mi rol,  
  **entonces** recibo un único rol válido con su descripción.

- **Dado** que no tengo sesión o mi sesión está vencida o es inválida,  
  **cuando** se consulta mi rol o intento entrar a una sección protegida,  
  **entonces** el sistema me trata como no autenticado y me pide iniciar sesión, sin exponer datos de otros usuarios.

- **Dado** que estoy autenticado con un rol determinado,  
  **cuando** intento acceder a una sección o acción que no corresponde a mi rol,  
  **entonces** el sistema me niega el acceso y me redirige o muestra mensaje de acceso denegado.

- **Dado** que estoy autenticado,  
  **cuando** accedo a una sección permitida para mi rol,  
  **entonces** puedo verla y operarla con normalidad.

## Reglas de negocio

- Fuente de verdad: sesión vigente originada en CU001 / HU-AUTH-01.
- Restricción explícita: la consulta no requiere que el usuario envíe datos; el rol se deriva del token guardado en cookie.
- En esta HU: un usuario tiene un único rol activo con descripción única.
- La protección visible en front no sustituye la autorización en backend.
- No revelar si un correo existe ni detalles del token en mensajes de error.

## Dependencias

- HU-REG-01 — Registro.
- HU-AUTH-01 — Iniciar sesión.
- Catálogo de roles y su descripción única pendiente de confirmación.

## Prioridad sugerida

**Alta**

Base de autorización. Bloquea: perfil, publicaciones, reportes, administración, publicidad y todo control por sede/rol.

## Dudas pendientes

1. ¿La lista cerrada de roles es: Estudiante, Vendedor, Comprador, Marca, Administrador?
2. ¿Vendedor/Comprador son roles distintos o son acciones del Estudiante?
3. ¿Un usuario puede tener solo un rol a la vez, como pide esta HU?
4. ¿Qué debe hacer el front al denegar acceso por rol: redirigir a home, a login, o mostrar 403?
5. ¿El valor “descripción de rol” ya tiene nombres exactos definidos?

## Estado

`requiere aclaración` — por dudas 1-3 sobre modelo de roles.

Una vez aclarado, queda `lista` para comenzar `explore → proposal → spec + design → tasks → apply-progress → verify-report → archive-report`.
