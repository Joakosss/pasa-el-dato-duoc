# CU001 — Iniciar sesión

## Actor principal

Usuario registrado.

## Objetivo

Permitir que un usuario registrado acceda a Pasa el Dato Duoc mediante su correo y contraseña.

## Precondiciones

- La cuenta debe existir.
- La cuenta debe estar activa.
- La cuenta no debe estar bloqueada.

## Postcondiciones

- Si las credenciales son válidas, el usuario queda autenticado y puede acceder a las funcionalidades que correspondan a su rol.
- Si las credenciales no son válidas, no se inicia sesión.

## Flujo principal

1. El usuario accede a la opción de inicio de sesión.
2. El sistema solicita correo y contraseña.
3. El usuario ingresa sus credenciales.
4. El sistema valida que ambos campos estén presentes.
5. El sistema busca la cuenta asociada al correo ingresado.
6. El sistema comprueba la contraseña contra el hash almacenado.
7. El sistema verifica que la cuenta se encuentre activa y no bloqueada.
8. El sistema autentica al usuario.
9. El sistema permite el acceso a las funcionalidades correspondientes.

## Flujos alternativos y excepciones

### Credenciales inválidas

- Si el correo no corresponde a una cuenta registrada o la contraseña es incorrecta, el sistema rechaza el acceso.
- El mensaje presentado no debe revelar cuál de las dos credenciales falló.

### Cuenta inactiva

- Si la cuenta existe pero no está activa, el sistema rechaza el acceso.

### Cuenta bloqueada

- Si la cuenta está bloqueada, el sistema rechaza el acceso.

### Datos incompletos

- Si falta correo o contraseña, el sistema solicita completar los datos requeridos.

## Datos involucrados

- Correo.
- Contraseña ingresada.
- Hash de contraseña almacenado.
- Estado activo de la cuenta.
- Estado de bloqueo.
- Rol asociado al usuario.

## Notas de alcance actuales

- La verificación de correo asociada a HU-REG-02 está postergada.
- Para el MVP actual, una cuenta registrada correctamente se crea con `activa = true`.
- El mecanismo concreto de sesión/JWT se define en diseño técnico y no forma parte de este caso de uso funcional.
