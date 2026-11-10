# HU-FAV-02 — Subtareas Backend (NestJS + Prisma)

Fuente: `docs/historias-de-usuario/favoritos/HU-FAV-02.md`  
Objetivo: exponer el listado paginado de favoritos del usuario autenticado, conservar en el resultado las publicaciones no disponibles y documentar el contrato REST en Swagger.

## Checklist de subtareas

### 0) Descubrimiento y decisiones de contrato
- [x] Revisar convenciones existentes: paginación `items/page/pageSize/total/nextPage`, DTOs con Swagger y validación de query mediante `class-validator`.
- [x] Reutilizar `PublicacionListaRespuestaDto` y sus DTOs anidados para los campos de tarjeta: título, descripción, precio, imágenes, sede, estado, tipo de venta y categoría.
- [x] Definir el orden implementado como fecha de guardado descendente (`Favorito.fechaCreacion DESC`) con `id DESC` como desempate estable. Es un orden técnico del endpoint, no una regla de negocio aprobada por la HU.
- [x] Representar los elementos no disponibles con `disponible: false`, manteniendo en el listado los datos de la publicación.
- [x] Aplicar al campo `disponible` la visibilidad pública existente: publicación no eliminada, estado “En curso” y cuenta del dueño aprobada, activa y no bloqueada. Publicaciones pausadas, vendidas o eliminadas lógicamente se incluyen como no disponibles.

### 1) Contrato REST y paginación
- [x] Añadir `GET /api/favoritos` al `FavoritosController` existente, protegido por `JwtAuthGuard`.
- [x] Obtener `idCuenta` desde la sesión autenticada; no aceptar identificadores de usuario desde el cliente.
- [x] Definir paginación por número de página:
  - `page`: entero desde 1, por defecto 1.
  - `pageSize`: aceptar únicamente 10 o 20; documentar el valor predeterminado acordado.
  - La web solicita páginas de 20 y el móvil páginas de 10. El cliente envía `pageSize`, porque el backend no puede determinar el tipo de dispositivo de forma fiable.
- [x] Seguir el patrón paginado del backend: `items`, `page`, `pageSize`, `total` y `nextPage`.
- [x] Responder `200` con `items: []` y metadatos de paginación cuando el usuario no tiene favoritos.

### 2) DTOs y validación
- [x] Crear `ListarFavoritosQueryDto` para `page` y `pageSize`, con conversión, validación y valores permitidos 10/20.
- [x] Crear DTOs de respuesta para el listado y sus elementos, con decoradores Swagger.
- [x] Componer el elemento a partir de la tarjeta de publicación existente y agregar:
  - identificador/fecha del favorito, solo si el contrato de frontend los necesita;
  - `disponible` (o el campo acordado) para distinguir publicaciones disponibles de no disponibles.
- [x] Documentar propiedades, tipos anidados, indicador `disponible` y `nextPage` nullable en Swagger. Los datos de publicaciones eliminadas lógicamente se conservan por soft delete.

### 3) Servicio de listado
- [x] Añadir `FavoritosService.listarFavoritos` con cuenta autenticada, página y tamaño.
- [x] Consultar solo filas de `Favorito` pertenecientes a esa cuenta y con `eliminado: false`.
- [x] Incluir publicación, estado, sede, tipo de venta, categoría e imágenes ordenadas ascendentemente.
- [x] Calcular el total con el mismo filtro y aplicar `skip`/`take`.
- [x] Ordenar por fecha de guardado descendente y `id` descendente como desempate estable.
- [x] Marcar la disponibilidad sin excluir publicaciones no disponibles del resultado.
- [x] Mantener aislamiento entre cuentas con filtro por el usuario autenticado.
- [x] Confirmar el límite del esquema actual: el soft delete (`Publicacion.eliminado=true`) conserva favorito y publicación; el borrado físico cascada y elimina ambos. La HU está implementada para el soft delete usado por el backend. Si se requiere conservar favoritos tras borrado físico, se necesita una decisión/cambio de esquema fuera de este alcance.

### 4) Controller e integración del módulo
- [x] Conectar `GET /favoritos` al servicio y a `ListarFavoritosQueryDto`.
- [x] Mantener `JwtAuthGuard` y obtener `idCuenta` desde `request.user`.
- [x] Reutilizar el módulo Favoritos existente, sin duplicar providers ni guards.
- [x] Mantener sin cambios el contrato de HU-FAV-01 (`GET/POST/DELETE /favoritos/:publicacionId`); sus pruebas siguen pasando.

### 5) Documentación Swagger
- [x] Etiquetar el controller bajo `Favoritos`.
- [x] Documentar operación, `page`, `pageSize`, tamaños web/móvil y valores permitidos.
- [x] Documentar autenticación por cookie `accessToken`.
- [x] Documentar `200` con el DTO paginado y la tarjeta de publicación.
- [x] Documentar `401` por sesión inválida y `400` por parámetros de paginación inválidos.
- [x] Verificar mediante prueba que Swagger expone la ruta, parámetros, seguridad por cookie y respuesta `200`.

### 6) Pruebas e2e
- [x] Extender `pasa-el-dato-back/test/favoritos.e2e-spec.ts` siguiendo el patrón e2e vigente.
- [x] Verificar `GET /api/favoritos` sin sesión → `401`.
- [x] Verificar aislamiento entre dos cuentas.
- [x] Verificar los campos de tarjeta y el indicador de disponibilidad.
- [x] Verificar que publicaciones pausadas y eliminadas lógicamente permanecen con `disponible: false`.
- [x] Verificar respuesta vacía y metadatos.
- [x] Verificar paginación con `pageSize=20` y `pageSize=10`, incluyendo páginas consecutivas sin duplicados.
- [x] Verificar parámetros inválidos → `400`.
- [x] Verificar orden determinista por fecha de favorito e ID mediante la consulta implementada.

### 7) Verificación y cierre técnico
- [x] Ejecutar pruebas e2e en el contenedor backend: suite específica de favoritos **8/8** y suite completa **26 suites / 200 tests** aprobados.
- [x] Ejecutar lint y verificación de tipos en el contenedor backend. Lint: 0 errores y 8 advertencias preexistentes fuera de favoritos; `tsc --noEmit`: exit code 0.
- [x] Verificar el contrato Swagger y las respuestas con la prueba e2e agregada.
- [x] Registrar el límite del borrado físico en la tarea de servicio: el listado retiene publicaciones eliminadas lógicamente; la cascada del esquema actual borra favoritos con el borrado físico.

---

## Alcance y límites

- Esta HU solo agrega la consulta paginada de “Mis favoritos”; marcar y quitar favoritos pertenece a HU-FAV-01.
- El backend entrega `200` con una lista vacía; el mensaje visual de estado vacío y la redirección al inicio de sesión corresponden al frontend.
- No se agregan filtros ni ordenamientos seleccionables por el usuario.
- No se requieren cambios de esquema Prisma mientras el modelo e índices actuales cubran la consulta; reevaluar índices únicamente si el diseño o las pruebas de rendimiento lo justifican.
- No se agregan dependencias nuevas.
