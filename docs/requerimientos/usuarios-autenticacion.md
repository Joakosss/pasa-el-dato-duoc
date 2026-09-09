# Requerimientos — Usuarios y Autenticación

## R.1 — Autentificar

**Tipo:** Funcional  
**Actores relacionados:** Todos los actores  
**Estado:** Solicitado

### Descripción

Se requiere que los usuarios puedan iniciar sesión y cerrarla.

---

## R.2 — Gestión de usuarios

**Tipo:** Funcional  
**Actores relacionados:** Estudiante, Administrador, Marca  
**Estado:** Solicitado

### Descripción

Se requiere un CRUD para registrar, leer, actualizar y eliminar datos de usuarios,
según los permisos de cada rol de usuario, validando el correo `@duocuc.cl`.

---

## R.22 — Seguridad de acceso

**Tipo:** No funcional  
**Actor relacionado:** Sistema  
**Estado:** Solicitado

### Descripción

Se requiere aplicar algoritmos de hash para el almacenamiento seguro de las contraseñas.

---

## R.35 — Términos de servicio y política de privacidad

**Tipo:** Funcional  
**Actor relacionado:** Usuario  
**Estado:** Solicitado

### Descripción

Se requiere que el sistema presente los términos de servicio y la política de privacidad
durante el registro, con aceptación obligatoria.

---

## R.36 — Recuperación de contraseña

**Tipo:** Funcional  
**Actor relacionado:** Usuario  
**Estado:** Solicitado

### Descripción

Se requiere que el sistema permita a los usuarios recuperar su contraseña mediante
un enlace de restablecimiento enviado a su correo `@duocuc.cl`.