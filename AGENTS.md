# Pasa el Dato Duoc

Marketplace para la comunidad Duoc.

## Estado actual

Proyecto en etapa inicial de desarrollo.

Actualmente solo existen las estructuras base de:

- `pasa-el-dato-front/`: frontend web.
- `pasa-el-dato-back/`: backend.

El resto de las tecnologías definidas en la arquitectura se incorporarán
de forma incremental durante el desarrollo.

No asumir que una tecnología, módulo, dependencia, endpoint, entidad,
servicio o funcionalidad ya está implementada sin inspeccionar el repositorio.

## Estructura

- `pasa-el-dato-front/`: aplicación web.
- `pasa-el-dato-back/`: API backend.
- `.opencode/agents/`: agentes del flujo de desarrollo.

## Arquitectura objetivo

### Clientes

#### Aplicación web
- Next.js
- Comunicación con backend mediante REST API sobre HTTPS.

#### Aplicación móvil
- React Native
- Comunicación REST con backend.
- Comunicación en tiempo real mediante WebSocket.

La aplicación móvil forma parte de la arquitectura objetivo y puede no
estar implementada todavía.

### Backend

- Node.js
- TypeScript
- NestJS
- REST API
- Express
- JWT para autenticación
- Argon2 para seguridad de contraseñas
- Socket.IO para comunicación en tiempo real

### Base de datos relacional

- PostgreSQL
- Prisma ORM

Responsable principalmente de información estructurada como:

- usuarios;
- perfiles;
- roles;
- publicaciones;
- categorías;
- sedes y ubicación;
- favoritos;
- calificaciones;
- reportes;
- administración;
- publicidad.

### Base de datos documental

- MongoDB
- Mongoose ODM

Se utiliza principalmente para el sistema de chat:

- conversaciones;
- mensajes;
- estado de lectura;
- información necesaria para comunicación en tiempo real.

### Servicios externos

#### Mapbox
- mapas;
- geolocalización;
- funcionalidades relacionadas con ubicación.

#### Gemini API / Embeddings
- recomendaciones inteligentes;
- funcionalidades de IA.

Su utilización es opcional y debe implementarse solamente cuando el
requerimiento correspondiente lo necesite.

### Control de versiones

- Git
- GitHub

## Comunicación

- REST API / HTTPS para comunicación cliente-backend.
- WebSocket / Socket.IO para funcionalidades en tiempo real.
- SQL mediante Prisma hacia PostgreSQL.
- Mongoose hacia MongoDB para chat.
- APIs externas solamente cuando la funcionalidad las requiera.

## Dominios principales

- usuarios y autenticación;
- perfiles;
- publicaciones;
- categorías;
- sedes y ubicación;
- búsqueda y filtros;
- favoritos;
- chat;
- compras y ventas;
- calificaciones;
- reportes;
- administración;
- publicidad;
- recomendaciones y funcionalidades de IA.

## Flujo de desarrollo

Para funcionalidades nuevas:

`user-story → explore → proposal → spec + design → tasks → apply → verify → archive`

- `00-user-story`: prepara o revisa la Historia de Usuario.
- `01-explorer`: investiga el estado actual.
- `02-proposer`: define objetivo y alcance.
- `03-specifier`: define qué debe hacer el sistema.
- `04-designer`: define cómo se integrará técnicamente.
- `05-planner`: divide el cambio en tareas.
- `06-applier`: implementa.
- `07-verifier`: verifica.
- `08-archiver`: registra y cierra el cambio.

`spec` y `design` parten de la propuesta y pueden trabajarse de forma independiente.

No es necesario ejecutar el flujo completo cuando se retoma un cambio existente.

## Reglas

- Inspeccionar antes de asumir.
- Diferenciar entre arquitectura objetivo y tecnologías realmente implementadas.
- No instalar ni configurar tecnologías solo porque aparezcan en la arquitectura.
- Incorporar una tecnología cuando la funcionalidad o tarea correspondiente lo requiera.
- Respetar requerimientos e Historias de Usuario aprobadas.
- No inventar reglas de negocio.
- Cada agente debe respetar su fase.
- No adelantar responsabilidades de fases posteriores.
- Cambiar solo lo necesario.
- Mantener separación entre frontend, backend y persistencia.
- Reutilizar patrones existentes cuando corresponda.
- No introducir dependencias sin justificación.
- Reportar bloqueos en lugar de inventar decisiones.
- Mantener respuestas breves y evitar repetir información ya establecida.