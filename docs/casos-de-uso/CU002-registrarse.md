# CU002 — Registrarse

## Actor

Estudiante

## Objetivo

Permitir que un estudiante cree una cuenta nueva en la plataforma.

## Precondición

El usuario debe contar con un correo institucional válido `@duocuc.cl`.

## Postcondición

Se crea una nueva cuenta de usuario en estado activo, asociada a su sede.

## Requerimientos relacionados

- R.2 — Gestión de usuarios
- R.22 — Seguridad de acceso
- R.35 — Términos de servicio y política de privacidad

## Curso normal

1. El estudiante completa:
   - nombre;
   - apellido;
   - correo `@duocuc.cl`;
   - teléfono;
   - contraseña.

2. El sistema valida el formato del correo institucional.

3. El estudiante selecciona su sede.

4. El sistema muestra los términos de servicio y la política de privacidad.

5. El estudiante acepta los términos.

6. El sistema crea la cuenta.

7. El sistema protege la contraseña utilizando Argon2.

8. El sistema envía un correo de verificación.

9. El sistema notifica que el registro fue exitoso y solicita confirmar el correo.

## Cursos alternativos

### Correo no institucional

Si el correo ingresado no pertenece al dominio `@duocuc.cl`:

- el sistema rechaza el registro;
- el sistema muestra un mensaje de error.

### Correo ya registrado

Si el correo ya se encuentra registrado:

- el sistema informa que la cuenta ya existe;
- el sistema sugiere iniciar sesión o recuperar la contraseña.

## Observación pendiente

Existe una posible inconsistencia en el caso de uso:

- la postcondición indica que la cuenta se crea en estado **activo**;
- el curso normal indica que se envía un correo de verificación y se solicita al usuario confirmarlo.

Debe definirse si:

1. la cuenta puede utilizarse inmediatamente después del registro; o
2. la cuenta permanece pendiente/inactiva hasta verificar el correo.

No asumir una de estas opciones hasta que el equipo tome una decisión.