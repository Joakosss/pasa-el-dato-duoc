# HU-PERF-01 — Consultar mi perfil

**Como** usuario autenticado  
**quiero** ver los datos de mi perfil  
**para** confirmar la información con la que cuento en la plataforma.

## Criterios de aceptación

- **Dado** que tengo una sesión válida,  
  **cuando** accedo a mi perfil,  
  **entonces** obtengo mis datos: RUN, nombres, apellidos, correo, teléfono, sede, carrera y rol.

- **Dado** que tengo una sesión válida,  
  **cuando** consulto mi perfil,  
  **entonces** los datos de autenticación sensibles (`clave_hash`, tokens) no aparecen en la respuesta.

- **Dado** que tengo una sesión válida,  
  **cuando** consulto mi perfil,  
  **entonces** obtengo solo mi propia información y no la de otras cuentas.

- **Dado** que no tengo una sesión válida,  
  **cuando** intento acceder al perfil,  
  **entonces** el sistema rechaza la solicitud por autenticación requerida.

- **Dado** que tengo una cuenta sin registro de usuario asociado o sin sede, carrera o rol asignado,  
  **cuando** consulto mi perfil,  
  **entonces** el sistema responde sin error y marca esos campos como no disponibles.

## Reglas de negocio

- Solo un usuario autenticado puede consultar su propio perfil.
- `clave_hash` y datos internos de autenticación nunca se exponen en las respuestas de la API.
- El modelo vigente separa `Cuenta` y `Usuario`; no se debe crear una tabla adicional de `Perfil`.
- Datos visibles permitidos: RUN, nombres, apellidos, correo, teléfono, sede, carrera y rol.
- La sede se muestra únicamente por su nombre, sin la jerarquía Región → Ciudad → Comuna.
- Esta HU es exclusivamente de lectura: no incluye edición de datos.
- Sin fotografía de perfil: no crear campo, modelo, almacenamiento ni endpoint para imágenes de usuario.
- Sin consulta de perfiles de terceros: no crear vistas públicas ni endpoints para consultar perfiles ajenos.

## Dependencias

- **HU-REG-01**: Cuenta y usuario existentes.
- Documentación técnica: CU004 y `docs/requerimientos/perfil-usuario.md`.

## Prioridad

**Alta**  
Base para verificar el registro, insumo necesario para la edición de perfil (HU-PERF-02) y para la visualización de identidad en publicaciones y chat.

## Dudas pendientes

- Ninguna.

## Estado

`lista` — lista para comenzar `explore → proposal → spec + design → tasks → apply-progress → verify-report → archive-report`.

---

## Subtareas para Jira

### Backend (BE)
- **HU-PERF-01-BE01**: Crear endpoint protegido `GET /api/v1/perfil/me` que identifique al usuario mediante su token/sesión.
- **HU-PERF-01-BE02**: Mapear la consulta a `Cuenta` y `Usuario` para retornar RUN, nombres, apellidos, correo, teléfono, carrera, rol y nombre de la sede (omitiendo jerarquía territorial).
- **HU-PERF-01-BE03**: Manejar campos opcionales ausentes (sede, carrera, rol) respondiendo con valores `null`/no disponibles sin fallar la petición.
- **HU-PERF-01-BE04**: Configurar la serialización del DTO de respuesta para excluir estrictamente `clave_hash` y datos sensibles de autenticación.
- **HU-PERF-01-BE05**: Desarrollar pruebas unitarias e integración para validar restricciones de autenticación, aislamiento de datos y estructura del DTO.

### Frontend (FE)
- **HU-PERF-01-FE01**: Crear la vista/pantalla "Mi Perfil" en el área privada.
- **HU-PERF-01-FE02**: Configurar la protección de la ruta impidiendo el acceso a usuarios no autenticados.
- **HU-PERF-01-FE03**: Maquetar el despliegue de datos de perfil (RUN, nombres, apellidos, correo, teléfono, sede, carrera y rol).
- **HU-PERF-01-FE04**: Formatear el despliegue visual para campos nulos o no asignados (ej. "No asignado").
- **HU-PERF-01-FE05**: Implementar estados de carga (*skeleton/loader*) y manejo de errores de red en la UI.

### Integración y QA (INT/QA)
- **HU-PERF-01-INT01**: Definir y documentar el contrato OpenAPI/Swagger para la consulta de perfil propio.
- **HU-PERF-01-INT02**: Verificar en QA que la identidad se extraiga únicamente del token y no por parámetros en la URL.
- **HU-PERF-01-INT03**: Ejecutar pruebas end-to-end (E2E) para perfiles completos, incompletos y manejo de sesiones expiradas.