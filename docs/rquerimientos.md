# Planilla de Requerimientos Iniciales

| R-N° | Nombre del Requerimiento | Tipo Requerimiento | Actores Usuarios Relacionados | Descripción corta del requerimiento | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **R.1** | Autentificar | Funcional | Todos los actores | Se requiere que los usuarios puedan iniciar sesión y cerrarla | Solicitado |
| **R.2** | Gestión de usuarios | Funcional | Estudiante, Administrador, Marca | Se requiere un CRUD (Registrar, leer, actualizar, eliminar) datos de usuarios, según los permisos de cada rol de usuario, validando el correo @duocuc.cl. | Solicitado |
| **R.3** | Gestión de publicaciones | Funcional | Comprador, Vendedor | Se requiere un CRUD (Registrar, leer, actualizar, eliminar) los datos de productos y servicios con imágenes, según los permisos de cada rol de usuario. | Solicitado |
| **R.4** | Reportar publicación | Funcional | Estudiante | Se requiere que los estudiantes sean capaces de reportar publicaciones para que la administración evalúe si cumple con las normativas | Solicitado |
| **R.5** | Reportar usuario | Funcional | Estudiante | Se requiere que los estudiantes sean capaces de reportar usuarios para que la administración evalúe si cumple con las normativas | Solicitado |
| **R.6** | Gestión de reportes de usuario | Funcional | Administrador | Se requiere un CRUD (Registrar, leer, actualizar, eliminar) para gestionar bloqueos de usuarios y generar reportes. | Solicitado |
| **R.7** | Gestión de reportes de publicación | Funcional | Administrador | Se requiere un CRUD (Registrar, leer, actualizar, eliminar) para gestionar bloqueos de publicación y generar reportes. | Solicitado |
| **R.8** | Gestión de publicidad | Funcional | Marca, Administrador | Se requiere un CRUD (Registrar, leer, actualizar, eliminar) los datos y banners de patrocinadores. | Solicitado |
| **R.9** | Búsqueda y filtrado | Funcional | Estudiante | Se requiere que el sistema permita buscar y filtrar publicaciones por categoría, sede y tipo de venta. | Solicitado |
| **R.10** | Comunicación por chat | Funcional | Comprador, Vendedor | Se requiere que el sistema provea un chat en tiempo real para la comunicación entre usuarios. | Solicitado |
| **R.11** | Geolocalización | Funcional | Comprador, Vendedor | Se requiere que el sistema permita al usuario establecer su ubicación mediante GPS o seleccionarla manualmente. | Solicitado |
| **R.12** | Gestión de favoritos | Funcional | Estudiante | Se requiere que el sistema permita guardar las publicaciones de interés. | Solicitado |
| **R.13** | Gestión de calificaciones | Funcional | Comprador, Vendedor | Se requiere que el sistema permita a los usuarios calificarse mutuamente tras finalizar una transacción. | Solicitado |
| **R.14** | Notificaciones | Funcional | Usuario | Se requiere que el sistema envíe notificaciones push y correos automáticos relevantes con su cuenta (publicaciones y mensajes). | Solicitado |
| **R.15** | Moderación de contenido | Funcional | Administrador | Se requiere que el sistema aplique un filtro automático para bloquear palabras sensibles en el chat y publicaciones. | Solicitado |
| **R.16** | Sugerencia inteligente de precios por IA | Funcional | Vendedor | Se requiere que el sistema se encuentre vinculado a una IA externa para sugerir precios al publicar. | Solicitado |
| **R.17** | Recomendación personalizada de productos por IA | Funcional | Estudiante | Se requiere que el sistema se encuentre vinculado a una IA externa para recomendar productos personalizados. | Solicitado |
| **R.18** | Ecosistema multiplataforma | No Funcional | Sistema | Se requiere que el sistema esté disponible en arquitectura web y aplicación móvil (Android/iOS). | Solicitado |
| **R.19** | Persistencia relacional | No Funcional | Sistema | Se requiere utilizar una base de datos SQL para estructurar usuarios y publicaciones. | Solicitado |
| **R.20** | Persistencia de mensajería | No Funcional | Sistema | Se requiere utilizar una base de datos NoSQL con escalabilidad horizontal para el manejo del chat. | Solicitado |
| **R.21** | Protocolo de comunicación | No Funcional | Sistema | Se requiere que la comunicación en tiempo real opere obligatoriamente mediante WebSockets. | Solicitado |
| **R.22** | Seguridad de acceso | No Funcional | Sistema | Se requiere aplicar algoritmos de hash para el almacenamiento seguro de las contraseñas. | Solicitado |
| **R.23** | El sistema debe ser responsivo | No Funcional | Sistema | El sistema debe garantizar su usabilidad en cualquier dispositivo ya sea móvil o de escritorio | Sugerido |
| **R.24** | El sistema debe contar con colores amigables | No Funcional | Sistema | El sistema debe estar construido con colores agradables. | Sugerido |
| **R.25** | El sistema debe estar siempre en funcionamiento | No Funcional | Sistema | El sistema debe estar operacional 24*7 | Sugerido |
| **R.26** | Estados de publicación | Funcional | Vendedor | Se requiere que el vendedor pueda cambiar el estado de una publicación (En curso, pausado, vendido, eliminado). | Sugerido |
| **R.27** | Captura y carga de imágenes | Funcional | Vendedor | Se requiere que el sistema pueda permitir seleccionar una imagen almacenada o tomar una fotografía para asociarla a una publicación. | Sugerido |
| **R.28** | El sistema debe estar construido en módulos | No Funcional | Sistema | El sistema debe ser desarrollado modularmente. | Sugerido |
| **R.29** | El sistema debe entregar respuestas rápidamente | No Funcional | Sistema | El sistema deberá entregar respuestas en el menor tiempo posible. | Sugerido |
| **R.30** | Gestión multisede | Funcional | Estudiante, Administrador | Se requiere que el sistema permita gestionar y filtrar publicaciones por sede, comuna, ciudad y región de Duoc UC. | Solicitado |
| **R.31** | Gestión de categorías de productos/servicios | Funcional | Administrador, Vendedor | Se requiere un CRUD (Registrar, leer, actualizar, eliminar) de categorías de productos/servicios asociados a las publicaciones. | Solicitado |
| **R.32** | Gestión de tipos de venta | Funcional | Administrador, Vendedor | Se requiere un CRUD (Registrar, leer, actualizar, eliminar) de tipos de venta (nuevo, usado) asociados a las publicaciones. | Solicitado |
| **R.33** | Auditoría y trazabilidad | No Funcional | Sistema | Se requiere que el sistema genere un registro de auditoría con logs de todas las transacciones, reportes y acciones administrativas para fines de cumplimiento institucional. | Solicitado |
| **R.34** | Dashboard administrativo con métricas | Funcional | Administrador | Se requiere que el panel de administración incluya dashboards con métricas (usuarios activos, publicaciones por categoría/sede, transacciones totales, reportes resueltos) para análisis de Duoc UC. | Solicitado |
| **R.35** | Términos de servicio y política de privacidad | Funcional | Usuario | Se requiere que el sistema presente términos de servicio y política de privacidad en el registro, con aceptación obligatoria. | Solicitado |
| **R.36** | Recuperación de contraseña | Funcional | Usuario | Se requiere que el sistema permita a usuarios recuperar su contraseña mediante enlace de reset enviado a su correo @duocuc.cl. | Solicitado |
