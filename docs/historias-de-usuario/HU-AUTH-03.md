# HU-AUTH-03 — Cerrar sesión

**Como** usuario autenticado  
**quiero** cerrar sesión en este dispositivo  
**para** proteger mi cuenta e impedir accesos posteriores sin volver a autenticarme.

## Trazabilidad

- R.1 – Autentificar (iniciar sesión y cerrarla).
- CU001 – Iniciar Sesión (origen de la sesión; no define cierre).
- HU-AUTH-01 — Iniciar sesión.
- HU-AUTH-02 — Reconocer mi rol durante la sesión.
- HU-NAV-01 — Navbar dinámico según sesión (debe volver a estado visitante).

## Criterios de aceptación

- **Dado** que tengo sesión activa,  
  **cuando** elijo cerrar sesión,  
  **entonces** el sistema me pide confirmación antes de cerrar.

- **Dado** que confirmé el cierre de sesión,  
  **cuando** el cierre se completa,  
  **entonces** quedo desconectado y soy llevado a la home pública.

- **Dado** que cancelo la confirmación,  
  **cuando** vuelvo a la plataforma,  
  **entonces** mantengo mi sesión activa sin cambios.

- **Dado** que cerré sesión,  
  **cuando** intento acceder a una sección protegida o reutilizar la sesión anterior,  
  **entonces** el sistema deniega el acceso y me pide iniciar sesión.

- **Dado** que cerré sesión,  
  **cuando** la interfaz se actualiza,  
  **entonces** veo estado de visitante (por ej. “Iniciar sesión” / “Registrarse”) y ya no veo accesos de mi cuenta, sin necesidad de recarga manual.

- **Dado** que cerré sesión,  
  **cuando** se revisa el dispositivo,  
  **entonces** no quedan en local ni en cookies restos de sesión reutilizables para entrar sin credenciales.

- **Dado** que el cierre falla por un error de red,  
  **cuando** intento cerrar sesión,  
  **entonces** el sistema muestra un error y mantiene mi sesión activa.

- **Dado** que no tengo sesión activa,  
  **cuando** navego por la plataforma,  
  **entonces** no se me ofrece cerrar sesión.

## Reglas de negocio

- Solo un usuario con sesión activa puede cerrarla.
- El cierre termina solo la sesión/dispositivo actual; no cierra otras sesiones.
- Tras el cierre exitoso se redirige a la home pública.
- El cierre requiere confirmación previa del usuario.
- No existen preferencias locales a conservar: al cerrar se elimina todo rastro de sesión en local y cookies.
- La sesión anterior no debe servir para volver a entrar sin autenticarse.
- La interfaz solo refleja el cierre; la invalidez real de la sesión la determina el backend.
- No se exponen en mensajes detalles de tokens ni de otros usuarios.

## Dependencias

- HU-AUTH-01 — Iniciar sesión.
- HU-AUTH-02 — Reconocer mi rol durante la sesión.
- HU-NAV-01 — Navbar dinámico según sesión.

## Prioridad sugerida

**Alta**

Seguridad básica del MVP y cierre del ciclo de R.1; protege cuentas en dispositivos compartidos.

## Dudas pendientes

- Ninguna. Aclaraciones aplicadas: solo sesión actual, redirección a home pública, con confirmación, limpieza total de local y cookies, y ante fallo de red se mantiene la sesión con mensaje de error.

## Estado

`lista` — lista para comenzar `explore → proposal → spec + design → tasks → apply-progress → verify-report → archive-report`.
