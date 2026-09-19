# HU-REG-01 — Registro con correo institucional

**Como** estudiante  
**quiero** crear una cuenta con RUN, nombre, apellidos, correo institucional, teléfono, sede y contraseña  
**para** registrarme en la plataforma y poder activar mi cuenta mediante mi correo institucional.

## Criterios de aceptación

- **Dado** que ingreso datos válidos, un correo `@duocuc.cl` no registrado y un RUN no registrado,  
  **cuando** acepto los términos y confirmo el registro,  
  **entonces** el sistema crea una cuenta en estado pendiente, asociada a una sede, asigna automáticamente el rol Estudiante, envía el correo de verificación y notifica que el registro fue exitoso.

- **Dado** que ingreso un correo que no pertenece al dominio `@duocuc.cl`,  
  **cuando** intento registrarme,  
  **entonces** el sistema rechaza el registro por dominio inválido.

- **Dado** que el correo o el RUN ya se encuentran registrados,  
  **cuando** intento registrarme,  
  **entonces** el sistema rechaza el registro por duplicidad.  
  En caso de correo duplicado, debe sugerir iniciar sesión o recuperar la contraseña.

- **Dado** que la contraseña tiene menos de 8 caracteres, más de 64, o no contiene al menos una mayúscula, una minúscula y un número,  
  **cuando** intento registrarme,  
  **entonces** el sistema rechaza el registro por contraseña inválida.

- **Dado** que el RUN tiene un formato inválido, el teléfono no cumple el formato chileno definido o falta un campo obligatorio,  
  **cuando** intento registrarme,  
  **entonces** el sistema rechaza el registro por validación.

- **Dado** que no he aceptado los términos de servicio y la política de privacidad,  
  **cuando** intento registrarme,  
  **entonces** el sistema no crea la cuenta.

- **Dado** que el registro fue exitoso,  
  **cuando** se consulta el estado de la cuenta,  
  **entonces** la cuenta se encuentra en estado pendiente y no activa.

## Reglas de negocio

- El correo debe pertenecer exclusivamente al dominio `@duocuc.cl`.
- Son obligatorios:
  - RUN.
  - Primer nombre.
  - Primer apellido.
  - Segundo apellido.
  - Correo.
  - Teléfono.
  - Sede.
  - Contraseña.
- RUN y correo deben ser únicos.
- El RUN debe validarse y almacenarse en un formato normalizado y consistente.
- El teléfono es obligatorio y debe cumplir un formato chileno válido.
- La sede es obligatoria y podrá modificarse posteriormente desde el perfil.
- El rol `Estudiante` se asigna automáticamente; el usuario no puede seleccionar su rol durante el registro.
- La contraseña debe tener entre 8 y 64 caracteres e incluir al menos una mayúscula, una minúscula y un número.
- La cuenta se crea inicialmente en estado pendiente.
- La cuenta solo puede pasar a estado activa después de una verificación de correo válida.
- Los términos de servicio y la política de privacidad deben presentarse durante el registro y su aceptación es obligatoria.
- El identificador del usuario es generado por el sistema mediante UUID.

## Seguridad

- La contraseña debe almacenarse mediante hash Argon2.

## Dependencias

- Catálogo de sedes disponible.
- Términos de servicio y política de privacidad publicados.
- Servicio de envío de correo de verificación operativo.

## Prioridad

**Alta**

Forma parte de la base del MVP y es necesaria para activar cuentas, iniciar sesión, gestionar perfiles y utilizar las funcionalidades principales de la plataforma.

## Subtareas Backend
- Crear modelo/esquema necesario para usuario, rol y sede.
- Configurar persistencia en PostgreSQL mediante Prisma.
- Crear validaciones de RUN, correo, teléfono y contraseña.
- Implementar registro de usuario.
- Asignar rol Estudiante automáticamente.
- Crear cuenta en estado pendiente.
- Aplicar hash Argon2 a la contraseña.
- Validar unicidad de RUN y correo.
- Integrar envío de correo de verificación.
- Crear pruebas del flujo de registro.

## Subtareas Frontend
- Crear pantalla/formulario de registro.
- Agregar campos obligatorios.
- Cargar catálogo de sedes.
- Validar campos antes de enviar.
- Mostrar términos y política de privacidad.
- Exigir aceptación de términos.
- Consumir API de registro.
- Mostrar errores de validación y duplicidad.
- Mostrar confirmación de registro y aviso de verificación de correo.
- Crear pruebas del formulario cuando corresponda.

## Subtareas de integración
- Acordar contrato request/response del registro.
- Verificar integración frontend-backend.
- Probar flujo completo de registro.