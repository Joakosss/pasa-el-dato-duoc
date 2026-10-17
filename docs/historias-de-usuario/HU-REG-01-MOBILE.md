# HU-REG-01-MOBILE — Registro con correo institucional en app móvil

**Como** estudiante
**quiero** crear una cuenta desde la app móvil con RUN, nombre, apellidos, correo institucional, teléfono, sede y contraseña
**para** registrarme en la plataforma y acceder a sus funcionalidades.

## Criterios de aceptación

- **Dado** que ingreso datos válidos, un correo `@duocuc.cl` no registrado y un RUN no registrado,
  **cuando** acepto los términos y confirmo el registro desde la app móvil,
  **entonces** el sistema crea la cuenta con rol Estudiante, asociada a una sede, en estado activa, y la app notifica que el registro fue exitoso.

- **Dado** que ingreso un correo que no pertenece al dominio `@duocuc.cl`,
  **cuando** intento registrarme,
  **entonces** la app rechaza el registro por dominio inválido e indica el campo.

- **Dado** que el correo o el RUN ya se encuentran registrados,
  **cuando** intento registrarme,
  **entonces** la app rechaza el registro por duplicidad.
  En caso de correo duplicado, sugiere iniciar sesión o recuperar la contraseña.

- **Dado** que la contraseña tiene menos de 8 caracteres, más de 64, o no contiene al menos una mayúscula, una minúscula y un número,
  **cuando** intento registrarme,
  **entonces** la app rechaza el registro por contraseña inválida.

- **Dado** que el RUN tiene formato inválido, el teléfono no cumple el formato chileno definido o falta un campo obligatorio,
  **cuando** intento registrarme,
  **entonces** la app rechaza el registro por validación e indica el campo.

- **Dado** que no he aceptado los términos de servicio y la política de privacidad,
  **cuando** intento registrarme,
  **entonces** la app no envía el registro.

- **Dado** que no hay conexión o el backend no responde,
  **cuando** intento registrarme,
  **entonces** la app muestra un error reintentable y no deja la cuenta en estado inconsistente.

## Reglas de negocio

- Alcance reducido al MVP móvil: solo rol Estudiante.
- El correo debe pertenecer exclusivamente al dominio `@duocuc.cl`.
- Son obligatorios: RUN, primer nombre, primer apellido, segundo apellido, correo, teléfono, sede, contraseña.
- RUN y correo deben ser únicos.
- El RUN se valida y almacena en formato normalizado y consistente, según criterio vigente del backend.
- El teléfono es obligatorio y debe cumplir formato chileno válido.
- La sede es obligatoria y podrá modificarse posteriormente desde el perfil.
- El rol `Estudiante` se asigna automáticamente; el usuario no puede seleccionar su rol.
- La contraseña debe tener entre 8 y 64 caracteres e incluir al menos una mayúscula, una minúscula y un número.
- Sin verificación por correo en este alcance: la cuenta queda activa al registrarse. La verificación queda postergada a HU-REG-02.
- Los términos de servicio y la política de privacidad deben presentarse durante el registro y su aceptación es obligatoria.
- Se reutiliza el backend existente; esta historia no crea ni modifica el registro en servidor.

## Dependencias

- Backend de registro operativo y reutilizado sin cambios.
- Contrato request/response del registro estable.
- Catálogo de sedes disponible vía API.
- Términos de servicio y política de privacidad publicados y visualizables en móvil.
- Base app móvil en rama `mobile` (`pasa-el-dato-mobile`, Expo + expo-router): navegación, pantalla `app/auth/register.tsx`, cliente REST HTTPS, manejo de errores y sin conexión.
- HU-REG-01 como referencia funcional; HU-REG-02 futura para verificación postergada.

## Prioridad sugerida

**Alta**

Base del MVP móvil y necesaria para iniciar sesión, perfil y resto del flujo en app.

## Estado

`lista` — lista para comenzar `explore → proposal → spec + design → tasks → apply-progress → verify-report → archive-report`.
