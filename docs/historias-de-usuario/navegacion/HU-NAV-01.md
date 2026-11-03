# HU-NAV-01 — Navbar dinámico según sesión

**Como** visitante y estudiante autenticado  
**quiero** ver un navbar acorde a mi estado de sesión  
**para** saber si estoy dentro de mi cuenta e ir directo a iniciar sesión, registrarme o a mi perfil.

## Trazabilidad

- CU001 – Iniciar Sesión (redirección según rol).
- CU004 – Gestionar Perfil de Usuario (destino del acceso a perfil).
- R.1 – Autentificar, R.2 – Gestión de usuarios.
- HU-REG-01, HU-AUTH-01, HU-AUTH-02.

## Criterios de aceptación

- **Dado** que no tengo sesión activa,  
  **cuando** veo el navbar en vista escritorio,  
  **entonces** veo las opciones “Iniciar sesión” y “Registrarse” y no veo acceso a perfil.

- **Dado** que tengo sesión activa,  
  **cuando** veo el navbar en vista escritorio,  
  **entonces** veo acceso a “Mi perfil” y no veo “Iniciar sesión” ni “Registrarse”.

- **Dado** que estoy en vista móvil,  
  **cuando** veo el navbar,  
  **entonces** veo un icono de perfil en lugar de los textos de escritorio.

- **Dado** que tengo sesión activa y estoy en vista móvil,  
  **cuando** pulso el icono de perfil,  
  **entonces** voy directo a mi perfil sin menú intermedio.

- **Dado** que no tengo sesión activa y estoy en vista móvil,  
  **cuando** pulso el icono de perfil,  
  **entonces** voy directo a iniciar sesión sin menú intermedio.

- **Dado** que inicio o cierro sesión,  
  **cuando** la sesión cambia,  
  **entonces** el navbar cambia de estado sin necesidad de recarga manual.

## Reglas de negocio

- El navbar solo refleja el estado de sesión para navegación; no autoriza ni sustituye validaciones de identidad del back.
- Restricción explícita: la decisión visual interna usa el store local ya existente con `idCuenta` y rol de usuario.
- En el store local nunca se guardan tokens ni datos sensibles.
- Nunca se muestran a la vez “Iniciar sesión / Registrarse” y “Mi perfil”.
- Esta HU no varía por rol: el navbar de la app es para el estudiante; el administrador accede directo al dashboard y no usa este navbar.

## Dependencias

- HU-AUTH-01 — Iniciar sesión.
- HU-AUTH-02 — Reconocer mi rol durante la sesión.
- HU-REG-01 — Registro.

## Prioridad sugerida

**Media**

Mejora orientación y acceso, pero no bloquea el MVP funcional; depende de HU-AUTH-01 y HU-AUTH-02.

## Dudas pendientes

- Ninguna bloqueante para iniciar el flujo.

## Estado

`lista` — lista para comenzar `explore → proposal → spec + design → tasks → apply-progress → verify-report → archive-report`.
