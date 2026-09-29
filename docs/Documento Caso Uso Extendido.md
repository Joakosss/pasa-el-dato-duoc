# Casos de Uso Alto Nivel:

### **Caso de Uso CU001 – Iniciar Sesión (Alto nivel)**

| Actores | Estudiante, Vendedor, Comprador, Administrador, Marca (todo usuario registrado) |
| :---: | :---- |
| **Precondición** | El usuario debe estar previamente registrado en el sistema con su correo @duocuc.cl (o cuenta de marca autorizada). |
| **Req. No Funcional** | R.22 – Seguridad de acceso (hash de contraseñas con Argon2). |
| **Descripción** | Este caso de uso se inicia cuando el usuario ingresa su correo y contraseña en la pantalla de login y el sistema valida sus credenciales, permitiéndole acceder a su cuenta según su rol. |

### 

### **Caso de Uso CU002 – Registrarse (Alto nivel)**

| Actores | Estudiante |
| :---: | :---- |
| **Precondición** | El usuario debe contar con un correo institucional válido @duocuc.cl. |
| **Req. No Funcional** | R.22 (seguridad), R.35 (términos de servicio). |
| **Descripción** | Este caso de uso se inicia cuando un estudiante completa el formulario de registro con sus datos personales y correo institucional, aceptando los términos de servicio para crear su cuenta. |

### 

### **Caso de Uso CU003 – Recuperar Contraseña (Alto nivel)**

| Actores | Usuario (cualquier rol) |
| :---: | :---- |
| **Precondición** | El usuario debe tener una cuenta registrada previamente. |
| **Req. No Funcional** | R.22 – Seguridad de acceso. |
| **Descripción** | Este caso de uso se inicia cuando el usuario solicita restablecer su contraseña olvidada, indicando su correo institucional para recibir un enlace de recuperación. |

### 

### **Caso de Uso CU004 – Gestionar Perfil de Usuario (Alto nivel)**

| Actores | Estudiante, Vendedor, Comprador, Marca, Administrador |
| :---: | :---- |
| **Precondición** | El usuario debe haber iniciado sesión. |
| **Req. No Funcional** | R.2 – Gestión de usuarios. |
| **Descripción** | Este caso de uso se inicia cuando el usuario accede a su perfil para visualizar o actualizar su información personal (nombre, teléfono, sede, foto). |

### 

### **Caso de Uso CU005 – Publicar Producto o Servicio (Alto nivel)**

| Actores | Vendedor |
| :---: | :---- |
| **Precondición** | El vendedor debe haber iniciado sesión y no estar bloqueado. |
| **Req. No Funcional** | R.28 – El sistema debe estar construido en módulos. |
| **Descripción** | Este caso de uso se inicia cuando un vendedor crea una nueva publicación de producto o servicio, incluyendo imágenes, precio y categoría, para ofrecer a la comunidad Duoc UC. |

### 

### **Caso de Uso CU006 – Editar Publicación (Alto nivel)**

| Actores | Vendedor |
| :---: | :---- |
| **Precondición** | El vendedor debe ser el dueño de la publicación. |
| **Req. No Funcional** | — |
| **Descripción** | Este caso de uso se inicia cuando un vendedor modifica los datos de una publicación existente (precio, descripción, imágenes o estado). |

### 

### **Caso de Uso CU007 – Eliminar Publicación (Alto nivel)**

| Actores | Vendedor |
| :---: | :---- |
| **Precondición** | El vendedor debe ser el dueño de la publicación. |
| **Req. No Funcional** | — |
| **Descripción** | Este caso de uso se inicia cuando un vendedor elimina una publicación propia que ya no desea mantener visible. |

### 

### **Caso de Uso CU008 – Buscar Publicaciones (Alto nivel)**

| Actores | Estudiante |
| :---: | :---- |
| **Precondición** | El estudiante debe haber iniciado sesión. |
| **Req. No Funcional** | R.29 – El sistema debe entregar respuestas rápidamente. |
| **Descripción** | Este caso de uso se inicia cuando un estudiante ingresa un término de búsqueda para encontrar productos o servicios de su interés. |

### 

### **Caso de Uso CU009 – Filtrar Publicaciones (Alto nivel)**

| Actores | Estudiante |
| :---: | :---- |
| **Precondición** | El estudiante debe haber iniciado sesión. |
| **Req. No Funcional** | — |
| **Descripción** | Este caso de uso se inicia cuando un estudiante aplica filtros (categoría, sede, comuna, tipo de venta) para acotar el listado de publicaciones. |

### 

### **Caso de Uso CU010 – Establecer Ubicación (Alto nivel)**

| Actores | Comprador, Vendedor |
| :---: | :---- |
| **Precondición** | El usuario debe haber iniciado sesión. |
| **Req. No Funcional** | R.11 – Geolocalización. |
| **Descripción** | Este caso de uso se inicia cuando el usuario define su ubicación, ya sea automáticamente por GPS o de forma manual, para coordinar el encuentro de una transacción. |

### **Caso de Uso CU011 – Reportar Publicación (Alto nivel)**

| Actores | Estudiante |
| :---: | :---- |
| **Precondición** | El estudiante debe haber iniciado sesión. |
| **Req. No Funcional** | — |
| **Descripción** | Este caso de uso se inicia cuando un estudiante reporta una publicación que considera que incumple las normativas institucionales. |

### **Caso de Uso CU012 – Reportar Usuario (Alto nivel)**

| Actores | Estudiante |
| :---: | :---- |
| **Precondición** | El estudiante debe haber iniciado sesión. |
| **Req. No Funcional** | — |
| **Descripción** | Este caso de uso se inicia cuando un estudiante reporta a otro usuario por una conducta indebida durante una transacción o conversación. |

### 

### 

### 

### 

### 

### **Caso de Uso CU013 – Gestionar Reportes de Usuario (Alto nivel)**

| Actores | Administrador |
| :---: | :---- |
| **Precondición** | El administrador debe haber iniciado sesión. |
| **Req. No Funcional** | R.33 – Auditoría y trazabilidad. |
| **Descripción** | Este caso de uso se inicia cuando el administrador revisa los reportes de usuario pendientes y decide bloquear, advertir o descartar el reporte. |

### 

### **Caso de Uso CU014 – Gestionar Reportes de Publicación (Alto nivel)**

| Actores | Administrador |
| :---: | :---- |
| **Precondición** | El administrador debe haber iniciado sesión. |
| **Req. No Funcional** | R.33 – Auditoría y trazabilidad. |
| **Descripción** | Este caso de uso se inicia cuando el administrador revisa los reportes de publicaciones pendientes y decide eliminar, mantener o advertir sobre la publicación. |

### 

### **Caso de Uso CU015 – Comunicarse por Chat (Alto nivel)**

| Actores | Comprador, Vendedor |
| :---: | :---- |
| **Precondición** | Ambos usuarios deben haber iniciado sesión y existir una publicación de interés en común. |
| **Req. No Funcional** | R.10, R.15, R.21 – Comunicación en tiempo real vía WebSockets (Socket.IO). |
| **Descripción** | Este caso de uso se inicia cuando un comprador contacta al vendedor de una publicación para coordinar la compra mediante mensajería instantánea. |

### 

### 

### **Caso de Uso CU016 – Gestionar Favoritos (Alto nivel)**

| Actores | Estudiante |
| :---: | :---- |
| **Precondición** | El estudiante debe haber iniciado sesión. |
| **Req. No Funcional** | — |
| **Descripción** | Este caso de uso se inicia cuando un estudiante marca o desmarca una publicación como favorita para encontrarla fácilmente después. |

### 

### **Caso de Uso CU017 – Calificar Usuario (Alto nivel)**

| Actores | Comprador, Vendedor |
| :---: | :---- |
| **Precondición** | Debe existir una transacción finalizada entre ambos usuarios. |
| **Req. No Funcional** | — |
| **Descripción** | Este caso de uso se inicia cuando, tras finalizar una transacción, un usuario califica la experiencia con la contraparte. |

### 

### **Caso de Uso CU018 – Gestionar Publicidad (Alto nivel)**

| Actores | Marca, Administrador |
| :---: | :---- |
| **Precondición** | La marca debe contar con una cuenta autorizada por Duoc UC. |
| **Req. No Funcional** | — |
| **Descripción** | Este caso de uso se inicia cuando una marca crea, edita o elimina un banner publicitario para mostrarlo a la comunidad estudiantil segmentado por sede. |

### 

### 

### 

### 

### **Caso de Uso CU019 – Gestionar Categorías y Tipos de Venta (Alto nivel)**

| Actores | Administrador |
| :---: | :---- |
| **Precondición** | El administrador debe haber iniciado sesión. |
| **Req. No Funcional** | — |
| **Descripción** | Este caso de uso se inicia cuando el administrador crea, edita o elimina categorías de productos/servicios y tipos de venta disponibles en el sistema. |

### 

### **Caso de Uso CU020 – Visualizar Dashboard Administrativo (Alto nivel)**

| Actores | Administrador |
| :---: | :---- |
| **Precondición** | El administrador debe haber iniciado sesión. |
| **Req. No Funcional** | R.34 – Dashboard administrativo con métricas. |
| **Descripción** | Este caso de uso se inicia cuando el administrador accede al panel de métricas para analizar el uso de la plataforma (usuarios activos, publicaciones, transacciones, reportes). |

### 

### **Caso de Uso CU021 – Recibir Notificaciones (Alto nivel)**

| Actores | Usuario (cualquier rol) |
| :---: | :---- |
| **Precondición** | El usuario debe tener una cuenta activa y notificaciones habilitadas. |
| **Req. No Funcional** | R.14 – Notificaciones. |
| **Descripción** | Este caso de uso se inicia cuando el sistema genera un evento relevante (nuevo mensaje, respuesta a reporte, publicación favorita vendida) y notifica al usuario mediante push y/o correo. |

# Casos de Uso Extendido:

### **Caso de Uso CU001 – Iniciar Sesión**

| Actores |  | Estudiante, Vendedor, Comprador, Administrador, Marca (todo usuario registrado) |  |  |
| :---: | ----- | :---- | ----- | ----- |
| **Objetivo** |  | Permitir que un usuario registrado acceda al sistema de forma segura mediante sus credenciales. |  |  |
| **Precondición** |  | El usuario debe estar previamente registrado en el sistema con su correo @duocuc.cl (o cuenta de marca autorizada). |  |  |
| **PostCondición** |  | El usuario queda autenticado (token JWT) y es redirigido a la pantalla principal según su rol. |  |  |
| **Curso Normal** |  |  |  |  |
| **Paso** | **Acción del Actor** |  | **Paso** | **Respuesta del Sistema** |
| 1 | El usuario ingresa su correo institucional y contraseña. |  | 1 | El sistema valida el formato de los datos ingresados. |
| 2 | El usuario presiona "Iniciar sesión". |  | 2 | El sistema verifica las credenciales contra la base de datos (hash Argon2) y genera un token JWT de sesión. |
| 3 | — |  | 3 | El sistema redirige al usuario a su panel principal según su rol. |
| **Cursos Alternativos** |  |  |  |  |
| **Paso** | **Actor** |  | **Paso** | **Respuesta del Sistema** |
| 1 | Las credenciales son incorrectas. |  | 1 | El sistema muestra un mensaje de error y solicita reingresar los datos. |
| 2 | El usuario no recuerda su contraseña. |  | 2 | El sistema deriva al caso de uso "Recuperar contraseña". |

### 

### **Caso de Uso CU002 – Registrarse**

| Actores |  | Estudiante |  |  |
| :---: | ----- | :---- | :---: | ----- |
| **Objetivo** |  | Permitir que un estudiante cree una cuenta nueva en la plataforma. |  |  |
| **Precondición** |  | El usuario debe contar con un correo institucional válido @duocuc.cl. |  |  |
| **PostCondición** |  | Se crea una nueva cuenta de usuario en estado activo, asociada a su sede. |  |  |
| **Curso Normal** |  |  |  |  |
| **Paso** | **Acción del Actor** |  | **Paso** | **Respuesta del Sistema** |
| 1 | El estudiante completa nombre, apellido, correo @duocuc.cl, teléfono y contraseña. |  | 1 | El sistema valida el formato del correo institucional. |
| 2 | El estudiante selecciona su sede. |  | 2 | El sistema muestra los términos de servicio y política de privacidad. |
| 3 | El estudiante acepta los términos. |  | 3 | El sistema crea la cuenta, encripta la contraseña (Argon2) y envía un correo de verificación. |
| 4 | — |  | 4 | El sistema notifica el registro exitoso y solicita confirmar el correo. |
| **Cursos Alternativos** |  |  |  |  |
| **Paso** | **Actor** |  | **Paso** | **Respuesta del Sistema** |
| 1 | El correo ingresado no pertenece al dominio @duocuc.cl. |  | 1 | El sistema rechaza el registro y muestra un mensaje de error. |
| 2 | El correo ya se encuentra registrado. |  | 2 | El sistema informa que la cuenta ya existe y sugiere iniciar sesión o recuperar la contraseña. |

### 

### **Caso de Uso CU003 – Recuperar Contraseña**

| Actores |  | Usuario (cualquier rol) |  |  |
| :---: | ----- | :---- | :---: | ----- |
| **Objetivo** |  | Permitir a un usuario restablecer su contraseña cuando la ha olvidado. |  |  |
| **Precondición** |  | El usuario debe tener una cuenta registrada previamente. |  |  |
| **PostCondición** |  | La contraseña del usuario queda actualizada y encriptada en el sistema. |  |  |
| **Curso Normal** |  |  |  |  |
| **Paso** | **Acción del Actor** |  | **Paso** | **Respuesta del Sistema** |
| 1 | El usuario selecciona "¿Olvidaste tu contraseña?" e ingresa su correo. |  | 1 | El sistema verifica que el correo exista en la base de datos. |
| 2 | — |  | 2 | El sistema envía un enlace de restablecimiento al correo @duocuc.cl del usuario. |
| 3 | El usuario accede al enlace y define una nueva contraseña. |  | 3 | El sistema valida los requisitos de seguridad de la nueva contraseña. |
| 4 | — |  | 4 | El sistema encripta (Argon2) y actualiza la contraseña, confirmando el cambio. |
| **Cursos Alternativos** |  |  |  |  |
| **Paso** | **Actor** |  | **Paso** | **Respuesta del Sistema** |
| 1 | El correo ingresado no está registrado. |  | 1 | El sistema muestra un mensaje genérico de confirmación, sin revelar si el correo existe (por seguridad). |
| 2 | El enlace de recuperación expiró. |  | 2 | El sistema informa que el enlace venció y ofrece generar uno nuevo. |

### **Caso de Uso CU004 – Gestionar Perfil de Usuario**

| Actores |  | Estudiante, Vendedor, Comprador, Marca, Administrador |  |  |
| :---: | ----- | :---- | :---: | ----- |
| **Objetivo** |  | Permitir al usuario visualizar y mantener actualizados sus datos personales. |  |  |
| **Precondición** |  | El usuario debe haber iniciado sesión. |  |  |
| **PostCondición** |  | Los datos del perfil quedan actualizados en la base de datos. |  |  |
| **Curso Normal** |  |  |  |  |
| **Paso** | **Acción del Actor** |  | **Paso** | **Respuesta del Sistema** |
| 1 | El usuario accede a la sección "Mi perfil". |  | 1 | El sistema muestra los datos actuales del usuario. |
| 2 | El usuario edita los campos deseados (teléfono, sede, foto). |  | 2 | El sistema valida el formato de los datos ingresados. |
| 3 | El usuario guarda los cambios. |  | 3 | El sistema actualiza el registro del usuario y confirma los cambios. |
| **Cursos Alternativos** |  |  |  |  |
| **Paso** | **Actor** |  | **Paso** | **Respuesta del Sistema** |
| 1 | El usuario ingresa datos con formato inválido (ej. teléfono).  |  | 1 | El sistema muestra un mensaje de error y no guarda los cambios. |
| 2 | El administrador bloquea al usuario mientras edita. |  | 2 | El sistema cierra la sesión del usuario y le impide continuar. |

### 

### **Caso de Uso CU005 – Publicar Producto o Servicio**

| Actores |  | Vendedor |  |  |
| :---: | ----- | :---- | :---: | ----- |
| **Objetivo** |  | Permitir a un vendedor publicar un producto o servicio para su venta. |  |  |
| **Precondición** |  | El vendedor debe haber iniciado sesión y no estar bloqueado. |  |  |
| **PostCondición** |  | La publicación queda creada en estado "en curso" y visible para otros usuarios. |  |  |
| **Curso Normal** |  |  |  |  |
| **Paso** | **Acción del Actor** |  | **Paso** | **Respuesta del Sistema** |
| 1 | El vendedor selecciona "Nueva publicación" e ingresa nombre, descripción y precio. |  | 1 | El sistema muestra el formulario de publicación. |
| 2 | El vendedor selecciona categoría y tipo de venta (producto/servicio, nuevo/usado). |  | 2 | El sistema solicita al menos una imagen. |
| 3 | El vendedor toma una fotografía o selecciona una imagen almacenada. |  | 3 | El sistema consulta la Gemini API para sugerir un precio de referencia (opcional). |
| 4 | El vendedor confirma la publicación.El vendedor confirma la publicación. |  | 4 | El sistema guarda la publicación en estado "en curso" y la hace visible en el catálogo. |
| **Cursos Alternativos** |  |  |  |  |
| **Paso** | **Actor** |  | **Paso** | **Respuesta del Sistema** |
| 1 | El vendedor no adjunta ninguna imagen.  |  | 1 | El sistema no permite publicar y solicita al menos una imagen. |
| 2 | El texto de la publicación contiene palabras bloqueadas. |  | 2 | El sistema rechaza la publicación y notifica al vendedor el motivo. |

### **Caso de Uso CU006 – Editar Publicación**

| Actores |  | Vendedor |  |  |
| :---: | ----- | :---- | :---: | ----- |
| **Objetivo** |  | Permitir al vendedor actualizar la información de una publicación propia. |  |  |
| **Precondición** |  | El vendedor debe ser el dueño de la publicación. |  |  |
| **PostCondición** |  | Los datos de la publicación quedan actualizados. |  |  |
| **Curso Normal** |  |  |  |  |
| **Paso** | **Acción del Actor** |  | **Paso** | **Respuesta del Sistema** |
| 1 | El vendedor accede a "Mis ventas" y selecciona la publicación a editar. |  | 1 | El sistema muestra el formulario con los datos actuales. |
| 2 | El vendedor modifica los campos deseados (precio, descripción, imágenes, estado). |  | 2 | El sistema valida los datos ingresados. |
| 3 | El vendedor guarda los cambios. |  | 3 | El sistema actualiza la publicación y confirma los cambios. |
| **Cursos Alternativos** |  |  |  |  |
| **Paso** | **Actor** |  | **Paso** | **Respuesta del Sistema** |
| 1 | El vendedor intenta editar una publicación que no le pertenece. |  | 1 | El sistema deniega el acceso. |
| 2 | El nuevo texto contiene palabras bloqueadas. |  | 2 | El sistema rechaza el cambio y notifica el motivo. |

### 

### **Caso de Uso CU007 – Eliminar Publicación**

| Actores |  | Vendedor |  |  |
| :---: | ----- | :---- | :---: | ----- |
| **Objetivo** |  | Permitir al vendedor eliminar una publicación propia. |  |  |
| **Precondición** |  | El vendedor debe ser el dueño de la publicación. |  |  |
| **PostCondición** |  | La publicación queda marcada como "eliminada" y deja de ser visible en el catálogo. |  |  |
| **Curso Normal** |  |  |  |  |
| **Paso** | **Acción del Actor** |  | **Paso** | **Respuesta del Sistema** |
| 1 | El vendedor selecciona "Eliminar" en la publicación deseada. |  | 1 | El sistema solicita confirmación de la acción.  |
| 2 | El vendedor confirma la eliminación. |  | 2 | El sistema cambia el estado de la publicación a "eliminado" y la retira del catálogo. |
| **Cursos Alternativos** |  |  |  |  |
| **Paso** | **Actor** |  | **Paso** | **Respuesta del Sistema** |
| 1 | El vendedor cancela la confirmación. |  | 1 | El sistema mantiene la publicación sin cambios. |
| 2 | La publicación tiene una conversación de chat activa asociada. |  | 2 | El sistema notifica al comprador que la publicación fue eliminada. |

### 

### **Caso de Uso CU008 – Buscar Publicaciones**

| Actores |  | Estudiante |  |  |
| :---: | ----- | :---- | :---: | ----- |
| **Objetivo** |  | Permitir al estudiante encontrar publicaciones específicas mediante texto de búsqueda. |  |  |
| **Precondición** |  | El estudiante debe haber iniciado sesión. |  |  |
| **PostCondición** |  | Se muestra un listado de publicaciones que coinciden con la búsqueda. |  |  |
| **Curso Normal** |  |  |  |  |
| **Paso** | **Acción del Actor** |  | **Paso** | **Respuesta del Sistema** |
| 1 | El estudiante ingresa un término en la barra de búsqueda.  |  | 1 | El sistema consulta las publicaciones activas que coincidan con el término. |
| 2 | — |  | 2 | El sistema muestra el listado de resultados ordenado por relevancia, incluyendo recomendaciones personalizadas (Gemini API). |
| **Cursos Alternativos** |  |  |  |  |
| **Paso** | **Actor** |  | **Paso** | **Respuesta del Sistema** |
| 1 | No existen publicaciones que coincidan con la búsqueda. |  | 1 | El sistema muestra un mensaje indicando que no hay resultados. |

### 

### **Caso de Uso CU009 – Filtrar Publicaciones**

| Actores |  | Estudiante |  |  |
| :---: | ----- | :---- | :---: | ----- |
| **Objetivo** |  | Permitir al estudiante acotar el listado de publicaciones según criterios específicos. |  |  |
| **Precondición** |  | El estudiante debe haber iniciado sesión. |  |  |
| **PostCondición** |  | Se muestra el listado de publicaciones filtradas según los criterios seleccionados. |  |  |
| **Curso Normal** |  |  |  |  |
| **Paso** | **Acción del Actor** |  | **Paso** | **Respuesta del Sistema** |
| 1 | El estudiante selecciona "Filtros" en el listado de publicaciones.  |  | 1 | El sistema muestra las opciones disponibles (categoría, sede, comuna, ciudad, región, tipo de venta). |
| 2 | El estudiante selecciona uno o más filtros y confirma. |  | 2 | El sistema consulta las publicaciones que cumplen todos los criterios seleccionados. |
| 3 | — |  | 3 | El sistema muestra el listado filtrado. |
| **Cursos Alternativos** |  |  |  |  |
| **Paso** | **Actor** |  | **Paso** | **Respuesta del Sistema** |
| 1 | Ningún resultado cumple los filtros seleccionados. |  | 1 | El sistema informa que no hay coincidencias y sugiere ampliar los criterios. |

### 

### **Caso de Uso CU010 – Establecer Ubicación**

| Actores |  | Comprador, Vendedor |  |  |
| :---: | ----- | :---- | :---: | ----- |
| **Objetivo** |  | Permitir al usuario establecer su ubicación para coordinar encuentros de compraventa. |  |  |
| **Precondición** |  | El usuario debe haber iniciado sesión. |  |  |
| **PostCondición** |  | La ubicación queda asociada a la publicación o conversación correspondiente. |  |  |
| **Curso Normal** |  |  |  |  |
| **Paso** | **Acción del Actor** |  | **Paso** | **Respuesta del Sistema** |
| 1 | El usuario selecciona "Usar mi ubicación actual".  |  | 1 | El sistema solicita permiso de geolocalización al dispositivo. |
| 2 | El usuario acepta el permiso. |  | 2 | El sistema obtiene las coordenadas GPS y las asocia a la publicación/chat mediante Mapbox. |
| **Cursos Alternativos** |  |  |  |  |
| **Paso** | **Actor** |  | **Paso** | **Respuesta del Sistema** |
| 1 | El usuario rechaza el permiso de GPS. |  | 1 | El sistema permite seleccionar manualmente una ubicación en el mapa (Mapbox). |
| 2 | El GPS del dispositivo no está disponible. |  | 2 | El sistema solicita ingresar la ubicación manualmente. |

### 

### **Caso de Uso CU011 – Reportar Publicación**

| Actores |  | Estudiante |  |  |
| :---: | ----- | :---- | :---: | ----- |
| **Objetivo** |  | Permitir a un estudiante alertar a la administración sobre una publicación indebida. |  |  |
| **Precondición** |  | El estudiante debe haber iniciado sesión. |  |  |
| **PostCondición** |  | Se genera un reporte de publicación en estado pendiente para revisión administrativa. |  |  |
| **Curso Normal** |  |  |  |  |
| **Paso** | **Acción del Actor** |  | **Paso** | **Respuesta del Sistema** |
| 1 | El estudiante selecciona "Reportar" en la publicación y describe el motivo. |  | 1 | El sistema registra el reporte asociado a la publicación y al usuario reportante. |
| 2 | — |  | 2 | El sistema notifica al administrador la existencia de un nuevo reporte pendiente. |
| **Cursos Alternativos** |  |  |  |  |
| **Paso** | **Actor** |  | **Paso** | **Respuesta del Sistema** |
| 1 | El estudiante ya reportó previamente esa misma publicación. |  | 1 | El sistema informa que ya existe un reporte propio en curso. |

### 

### **Caso de Uso CU012 – Reportar Usuario**

| Actores |  | Estudiante |  |  |
| :---: | ----- | :---- | :---: | ----- |
| **Objetivo** |  | Permitir a un estudiante alertar a la administración sobre la conducta indebida de otro usuario. |  |  |
| **Precondición** |  | El estudiante debe haber iniciado sesión. |  |  |
| **PostCondición** |  | Se genera un reporte de usuario en estado pendiente para revisión administrativa. |  |  |
| **Curso Normal** |  |  |  |  |
| **Paso** | **Acción del Actor** |  | **Paso** | **Respuesta del Sistema** |
| 1 | El estudiante selecciona "Reportar usuario" desde el perfil o el chat y describe el motivo. |  | 1 | El sistema registra el reporte asociado al usuario reportado y al reportante. |
| 2 | — |  | 2 | El sistema notifica al administrador la existencia de un nuevo reporte pendiente. |
| **Cursos Alternativos** |  |  |  |  |
| **Paso** | **Actor** |  | **Paso** | **Respuesta del Sistema** |
| 1 | El usuario intenta reportarse a sí mismo. |  | 1 | El sistema rechaza la acción. |

### 

### **Caso de Uso CU013 – Gestionar Reportes de Usuario**

| Actores |  | Administrador |  |  |
| :---: | ----- | :---- | :---: | ----- |
| **Objetivo** |  | Permitir al administrador gestionar los reportes realizados contra usuarios. |  |  |
| **Precondición** |  | El administrador debe haber iniciado sesión. |  |  |
| **PostCondición** |  | El reporte queda resuelto (bloqueo, advertencia o descarte) y registrado en el log de auditoría. |  |  |
| **Curso Normal** |  |  |  |  |
| **Paso** | **Acción del Actor** |  | **Paso** | **Respuesta del Sistema** |
| 1 | El administrador accede al panel de reportes de usuario. |  | 1 | El sistema muestra el listado de reportes pendientes con su descripción y usuario involucrado. |
| 2 | El administrador selecciona un reporte y revisa el detalle. |  | 2 | El sistema muestra el historial del usuario reportado. |
| 3 | El administrador decide bloquear al usuario y confirma. |  | 3 | El sistema bloquea la cuenta, marca el reporte como resuelto y genera un registro de auditoría. |
| **Cursos Alternativos** |  |  |  |  |
| **Paso** | **Actor** |  | **Paso** | **Respuesta del Sistema** |
| 1 | El administrador determina que el reporte es infundado. |  | 1 | El sistema marca el reporte como descartado sin sancionar al usuario. |
| 2 | El administrador opta por solo advertir al usuario. |  | 2 | El sistema envía una notificación de advertencia y marca el reporte como resuelto. |

### 

### **Caso de Uso CU014 – Gestionar Reportes de Publicación**

| Actores |  | Administrador |  |  |
| :---: | ----- | :---- | :---: | ----- |
| **Objetivo** |  | Permitir al administrador gestionar los reportes realizados contra publicaciones. |  |  |
| **Precondición** |  | El administrador debe haber iniciado sesión. |  |  |
| **PostCondición** |  | El reporte queda resuelto y, si corresponde, la publicación es eliminada del catálogo. |  |  |
| **Curso Normal** |  |  |  |  |
| **Paso** | **Acción del Actor** |  | **Paso** | **Respuesta del Sistema** |
| 1 | El administrador accede al panel de reportes de publicación. |  | 1 | El sistema muestra el listado de reportes pendientes con la publicación asociada. |
| 2 | El administrador revisa el contenido de la publicación reportada. |  | 2 | El sistema muestra el detalle completo de la publicación. |
| 3 | El administrador decide eliminar la publicación y confirma. |  | 3 | El sistema cambia el estado de la publicación a "eliminado", marca el reporte como resuelto y genera un log de auditoría. |
| **Cursos Alternativos** |  |  |  |  |
| **Paso** | **Actor** |  | **Paso** | **Respuesta del Sistema** |
| 1 | El administrador determina que la publicación cumple las normativas. |  | 1 | El sistema marca el reporte como descartado y mantiene la publicación activa. |

### 

### **Caso de Uso CU015 – Comunicarse por Chat**

| Actores |  | Comprador, Vendedor |  |  |
| :---: | ----- | :---- | :---: | ----- |
| **Objetivo** |  | Permitir la comunicación en tiempo real entre comprador y vendedor para coordinar una transacción. |  |  |
| **Precondición** |  | Ambos usuarios deben haber iniciado sesión y existir una publicación de interés en común. |  |  |
| **PostCondición** |  | Se registra la conversación y los mensajes intercambiados en MongoDB. |  |  |
| **Curso Normal** |  |  |  |  |
| **Paso** | **Acción del Actor** |  | **Paso** | **Respuesta del Sistema** |
| 1 | El comprador selecciona "Contactar vendedor" en una publicación. |  | 1 | El sistema crea o recupera la conversación asociada a esa publicación y a ambos usuarios. |
| 2 | El comprador escribe y envía un mensaje. |  | 2 | El sistema transmite el mensaje en tiempo real vía Socket.IO y lo almacena en MongoDB. |
| 3 | El vendedor responde el mensaje. |  | 3 | El sistema entrega el mensaje al comprador en tiempo real y actualiza el estado de lectura. |
| **Cursos Alternativos** |  |  |  |  |
| **Paso** | **Actor** |  | **Paso** | **Respuesta del Sistema** |
| 1 | El mensaje contiene palabras bloqueadas por el filtro de moderación. |  | 1 | El sistema impide el envío y notifica al usuario el motivo. |
|  | El destinatario está desconectado. |  | 2 | El sistema almacena el mensaje y lo entrega junto con una notificación push al reconectarse. |

### **Caso de Uso CU016 – Gestionar Favoritos**

| Actores |  | Estudiante |  |  |
| :---: | ----- | :---- | :---: | ----- |
| **Objetivo** |  | Permitir al estudiante guardar publicaciones de interés para revisarlas posteriormente. |  |  |
| **Precondición** |  | El estudiante debe haber iniciado sesión. |  |  |
| **PostCondición** |  | La publicación queda asociada a la lista de favoritos del usuario (o se remueve de ella). |  |  |
| **Curso Normal** |  |  |  |  |
| **Paso** | **Acción del Actor** |  | **Paso** | **Respuesta del Sistema** |
| 1 | El estudiante selecciona el ícono favorito en una publicación.  |  | 1 | El sistema agrega la publicación a la lista de favoritos del usuario. |
| 2 | El estudiante accede a "Mis favoritos". |  | 2 | El sistema muestra el listado de publicaciones marcadas. |
| **Cursos Alternativos** |  |  |  |  |
| **Paso** | **Actor** |  | **Paso** | **Respuesta del Sistema** |
| 1 | El estudiante desmarca una publicación ya guardada. |  | 1 | El sistema la remueve de la lista de favoritos. |
| 2 | La publicación favorita fue eliminada por el vendedor. |  | 2 | El sistema la muestra como no disponible dentro de la lista de favoritos. |

### 

### **Caso de Uso CU017 – Calificar Usuario**

| Actores |  | Comprador, Vendedor |  |  |
| :---: | ----- | :---- | :---: | ----- |
| **Objetivo** |  | Permitir a los usuarios calificarse mutuamente tras una transacción, generando confianza en la comunidad. |  |  |
| **Precondición** |  | Debe existir una transacción finalizada entre ambos usuarios. |  |  |
| **PostCondición** |  | La calificación queda registrada y visible en el perfil del usuario calificado. |  |  |
| **Curso Normal** |  |  |  |  |
| **Paso** | **Acción del Actor** |  | **Paso** | **Respuesta del Sistema** |
| 1 | El usuario accede a la publicación finalizada y selecciona "Calificar". |  | 1 | El sistema muestra el formulario de calificación (puntaje y comentario). |
| 2 | El usuario ingresa el puntaje y comentario, y confirma. |  | 2 | El sistema guarda la calificación y actualiza el promedio del usuario calificado. |
| **Cursos Alternativos** |  |  |  |  |
| **Paso** | **Actor** |  | **Paso** | **Respuesta del Sistema** |
| 1 | El usuario intenta calificar una transacción ya calificada previamente. |  | 1 | El sistema impide una segunda calificación para la misma transacción. |

### 

### **Caso de Uso CU018 – Gestionar Publicidad**

| Actores |  | Marca, Administrador |  |  |
| :---: | ----- | :---- | :---: | ----- |
| **Objetivo** |  | Permitir a una marca gestionar sus banners publicitarios dentro de la plataforma. |  |  |
| **Precondición** |  | La marca debe contar con una cuenta autorizada por Duoc UC. |  |  |
| **PostCondición** |  | El banner queda creado/actualizado y programado para su periodo de vigencia. |  |  |
| **Curso Normal** |  |  |  |  |
| **Paso** | **Acción del Actor** |  | **Paso** | **Respuesta del Sistema** |
| 1 | La marca accede a "Mis banners" y selecciona "Nuevo banner". |  | 1 | El sistema muestra el formulario (imagen, mensaje, fecha inicio/fin, sede(s)). |
| 2 | La marca completa los datos y confirma. |  | 2 | El sistema guarda el banner y lo somete a aprobación del administrador. |
| 3 | El administrador aprueba el banner. |  | 3 | El sistema activa el banner y lo muestra a los estudiantes de las sedes seleccionadas durante el periodo definido. |
| **Cursos Alternativos** |  |  |  |  |
| **Paso** | **Actor** |  | **Paso** | **Respuesta del Sistema** |
| 1 | El administrador rechaza el banner por incumplir normativas. |  | 1 | El sistema notifica a la marca el motivo del rechazo. |
| 2 | El periodo de vigencia ingresado es inválido (fecha fin anterior a inicio). |  | 2 | El sistema rechaza el formulario y solicita corregir las fechas. |

### 

### **Caso de Uso CU019 – Gestionar Categorías y Tipos de Venta**

| Actores |  | Administrador |  |  |
| :---: | ----- | :---- | :---: | ----- |
| **Objetivo** |  | Permitir al administrador mantener actualizado el catálogo de categorías y tipos de venta. |  |  |
| **Precondición** |  | El administrador debe haber iniciado sesión. |  |  |
| **PostCondición** |  | Las categorías y/o tipos de venta quedan actualizados y disponibles para los vendedores al publicar. |  |  |
| **Curso Normal** |  |  |  |  |
| **Paso** | **Acción del Actor** |  | **Paso** | **Respuesta del Sistema** |
| 1 | El administrador selecciona "Nueva categoría" o "Nuevo tipo de venta". |  | 1 | El sistema muestra el formulario correspondiente.  |
| 2 | El administrador ingresa el nombre y confirma. |  | 2 | El sistema guarda el nuevo registro y lo hace disponible en los formularios de publicación. |
| **Cursos Alternativos** |  |  |  |  |
| **Paso** | **Actor** |  | **Paso** | **Respuesta del Sistema** |
| 1 | El administrador intenta eliminar una categoría en uso por publicaciones activas. |  | 1 | El sistema advierte del conflicto y solicita reasignar las publicaciones antes de eliminarlas. |

### 

### 

### 

### 

### 

### **Caso de Uso CU020 – Visualizar Dashboard Administrativo**

| Actores |  | Administrador |  |  |
| :---: | ----- | :---- | :---: | ----- |
| **Objetivo** |  | Proveer al administrador información agregada para la toma de decisiones institucionales. |  |  |
| **Precondición** |  | El administrador debe haber iniciado sesión. |  |  |
| **PostCondición** |  | Se despliegan las métricas solicitadas en pantalla. |  |  |
| **Curso Normal** |  |  |  |  |
| **Paso** | **Acción del Actor** |  | **Paso** | **Respuesta del Sistema** |
| 1 | El administrador accede a "Dashboard".  |  | 1 | El sistema consulta y calcula las métricas agregadas (usuarios activos, publicaciones por categoría/sede, transacciones totales, reportes resueltos). |
| 2 | El administrador filtra por rango de fechas o sede. |  | 2 | El sistema calcula y muestra las métricas según el filtro aplicado. |
| **Cursos Alternativos** |  |  |  |  |
| **Paso** | **Actor** |  | **Paso** | **Respuesta del Sistema** |
| 1 | No existen datos suficientes para el periodo seleccionado. |  | 1 | El sistema muestra un mensaje indicando la falta de datos. |

### 

### 

### 

### 

### 

### **Caso de Uso CU021 – Recibir Notificaciones**

| Actores |  | Usuario (cualquier rol) |  |  |
| :---: | ----- | :---- | :---: | ----- |
| **Objetivo** |  | Mantener informado al usuario sobre eventos relevantes de su cuenta en tiempo oportuno. |  |  |
| **Precondición** |  | El usuario debe tener una cuenta activa y notificaciones habilitadas. |  |  |
| **PostCondición** |  | El usuario recibe la notificación y esta queda registrada en su historial. |  |  |
| **Curso Normal** |  |  |  |  |
| **Paso** | **Acción del Actor** |  | **Paso** | **Respuesta del Sistema** |
| 1 | —  |  | 1 | El sistema detecta un evento relevante (ej. nuevo mensaje de chat). |
| 2 | — |  | 2 | El sistema genera una notificación push y, si corresponde, un correo automático al usuario. |
| 3 | El usuario abre la notificación. |  | 3 | El sistema lo redirige a la sección correspondiente (chat, publicación, reporte). |
| **Cursos Alternativos** |  |  |  |  |
| **Paso** | **Actor** |  | **Paso** | **Respuesta del Sistema** |
| 1 | El usuario tiene las notificaciones push deshabilitadas. |  | 1 | El sistema solo envía la notificación por correo electrónico. |

