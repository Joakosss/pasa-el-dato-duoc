# Propuesta técnica: backend para web y aplicación mobile

## Objetivo

Definir cómo debe integrarse la aplicación móvil con el backend sin afectar la aplicación web ni duplicar de manera peligrosa la lógica, autenticación, chat y acceso a bases de datos.

---

# Situación actual

Actualmente existe una sola API NestJS:

```text
pasa-el-dato-back
```

Esta API es utilizada por:

```text
pasa-el-dato-front   → aplicación web Next.js
pasa-el-dato-mobile  → aplicación Expo / React Native
```

Y se conecta a recursos compartidos:

```text
PostgreSQL → usuarios, publicaciones, estados, perfiles, etc.
MongoDB    → conversaciones y mensajes.
uploadsdata → imágenes/publicaciones.
JWT        → autenticación.
Socket.IO  → chat en tiempo real.
```

El archivo `compose.yaml` actual levanta un servicio backend único:

```yaml
back:
  build:
    context: ./pasa-el-dato-back
  ports:
    - "0.0.0.0:${API_PORT}:${API_PORT}"
```

Por lo tanto, actualmente web y mobile consumen la misma lógica de negocio y las mismas bases de datos.

---

# Restricción planteada

La preocupación es válida:

> Los cambios necesarios para mobile no deben romper ni cambiar de forma inesperada el comportamiento que ya utiliza la web.

Sin embargo, hay una diferencia importante entre:

```text
No modificar contratos existentes de web.
```

y:

```text
No tocar nunca ningún archivo original del backend.
```

La primera regla es recomendable y alcanzable.

La segunda regla es muy difícil de cumplir para funcionalidades compartidas, porque autenticación, publicaciones, chat, reglas de negocio y bases de datos ya viven en el backend original.

---

# Alternativa A: un único backend con contratos compatibles

## Descripción

Mantener:

```text
pasa-el-dato-back
```

como única API para web y mobile.

Las funcionalidades mobile se agregan de forma compatible:

- endpoints nuevos;
- campos nuevos opcionales en respuestas;
- rutas versionadas o específicas de mobile;
- DTOs nuevos;
- módulos/adaptadores nuevos;
- sin eliminar ni cambiar rutas ya consumidas por web.

Ejemplo:

```text
Web existente:
POST /api/auth/refresh
usa cookies HttpOnly.

Mobile:
POST /api/mobile/auth/refresh
usa refresh token enviado desde SecureStore.
```

O, cuando sea seguro, un mismo endpoint compatible:

```text
POST /api/auth/refresh

Prioridad:
1. cookie HttpOnly para web;
2. body refreshToken para mobile.
```

## Ventajas

- Una única fuente de verdad para reglas de negocio.
- Un solo esquema PostgreSQL.
- Un solo origen de chat MongoDB.
- Un solo sistema de JWT y revocación.
- Un solo servidor Socket.IO.
- No se duplica código de usuarios, publicaciones, permisos o estados.
- Menor costo de mantenimiento.
- Menor riesgo de que web y mobile se comporten distinto.

## Riesgos

- Requiere modificar algunos archivos existentes cuando se amplía un endpoint o un módulo actual.
- Es necesario revisar cuidadosamente compatibilidad hacia atrás.
- Cambios de comportamiento global no deben incorporarse sin aprobación.

## Reglas técnicas propuestas

1. **No eliminar rutas actuales.**
2. **No cambiar nombres, tipos ni significado de campos existentes.**
3. **Campos nuevos en respuestas deben ser opcionales.**
4. **Endpoints mobile nuevos deben usar una ruta explícita:**

   ```text
   /api/mobile/...
   ```

   o nombres nuevos sin colisionar con los existentes.

5. **Las cookies web deben conservar prioridad** cuando un endpoint compartido reciba también tokens de mobile.
6. **No modificar respuestas web existentes de forma semántica.**
7. **Cambios globales de negocio deben ser aprobados por responsable backend/web.**
8. **Cada cambio debe incluir prueba de regresión web y prueba mobile.**

## Recomendación

Esta es la alternativa recomendada para el proyecto.

---

# Alternativa B: Backend for Frontend (BFF) para mobile

## Descripción

Crear un servicio separado:

```text
pasa-el-dato-back-mobile
```

pero **no copiar el backend principal**.

Este servicio funcionaría como una capa adaptadora para React Native:

```text
Mobile
  ↓ REST / Socket.IO
pasa-el-dato-back-mobile (puerto 3002)
  ↓ REST interno
pasa-el-dato-back (puerto 3001)
  ↓
PostgreSQL / MongoDB
```

El BFF debe:

- adaptar formatos de respuesta para mobile;
- reunir datos de varios endpoints si mobile lo necesita;
- delegar la lógica y persistencia al backend principal;
- no acceder directamente a PostgreSQL ni MongoDB;
- no crear su propio sistema de JWT;
- no modificar entidades ni estados directamente.

## Ventajas

- Separa los contratos específicamente pensados para mobile.
- Evita llenar controladores web con decisiones de interfaz mobile.
- Permite transformar respuestas sin cambiar la respuesta original para web.
- Puede ser útil si la app mobile necesitará muchas pantallas o agregaciones distintas.

## Desventajas

- Hay dos servicios que desplegar, monitorear y documentar.
- Agrega latencia:

  ```text
  Mobile → BFF → Backend principal
  ```

- Autenticación se vuelve más compleja.
- Para Socket.IO se necesita diseñar correctamente el reenvío de eventos.
- Si el BFF empieza a escribir directamente en las bases de datos, se duplicará lógica y se pierde consistencia.
- No elimina todos los cambios necesarios en el backend principal: algunos contratos base deben estar disponibles para mobile.

## Requisito clave para tiempo real

Si existen dos procesos Socket.IO:

```text
pasa-el-dato-back
pasa-el-dato-back-mobile
```

no pueden emitir/recibir eventos entre sí automáticamente.

Para escalar o separar Socket.IO se requeriría un adaptador compartido, normalmente:

```text
Redis + @socket.io/redis-adapter
```

Actualmente Redis no existe en la arquitectura implementada.

Por eso, crear un BFF con Socket.IO ahora agrega complejidad innecesaria.

## Uso recomendado

Usar esta alternativa solamente si:

- web y mobile requieren contratos muy distintos;
- existe un equipo responsable de infraestructura;
- se acepta mantener dos servicios;
- se diseña una estrategia de tiempo real compartido;
- el BFF no duplica lógica de negocio ni acceso a datos.

---

# Alternativa C: copiar todo el backend a `pasa-el-dato-back-mobile`

## Descripción

Copiar completamente:

```text
pasa-el-dato-back
```

a:

```text
pasa-el-dato-back-mobile
```

y modificar la copia para mobile.

## No recomendada

Esta alternativa parece simple al comienzo, pero es la más riesgosa.

## Problemas

### 1. Dos fuentes de verdad

Se duplican:

```text
auth
JWT
usuarios
publicaciones
chat
permisos
validaciones
DTOs
reglas de negocio
```

Cada corrección futura tendría que hacerse dos veces.

Ejemplo:

```text
Se corrige una vulnerabilidad de autenticación en web.
También debe corregirse manualmente en mobile.
```

Si alguien olvida hacerlo, los comportamientos se separan.

### 2. Conflictos sobre las mismas bases de datos

Ambos backend podrían leer y escribir:

```text
PostgreSQL
MongoDB
```

El riesgo no es que las bases no puedan recibir dos conexiones; el problema es que dos códigos distintos apliquen reglas distintas sobre los mismos datos.

Ejemplo:

```text
Web acepta estado "Pausada".
Mobile acepta estado "Pausado".
```

La misma publicación se comportaría diferente según el cliente.

### 3. Conflictos de JWT

Si ambos servicios emiten o validan tokens:

- deben compartir exactamente secretos y configuración;
- deben compartir la misma estrategia de revocación;
- deben mantener compatibilidad de payloads;
- deben responder igual frente a cuentas bloqueadas, eliminadas o no aprobadas.

Cualquier diferencia puede causar sesiones inválidas entre clientes.

### 4. Socket.IO duplicado

Dos servidores Socket.IO separados necesitan infraestructura adicional para sincronizar eventos. Sin Redis adapter, un mensaje emitido por un servicio no llega a clientes conectados en el otro.

### 5. Duplicación de despliegue

Se necesitarían:

```text
Dos Dockerfiles.
Dos servicios Compose.
Dos puertos.
Dos healthchecks.
Dos configuraciones de variables.
Dos ciclos de pruebas.
Dos procesos de actualización.
```

## Conclusión de esta alternativa

No se recomienda copiar el backend completo.

---

# Alternativa D: revertir los cambios y hacer que mobile use solo el contrato web actual

## Descripción

Revertir los cambios backend y limitar mobile a lo que ya existe.

## Ventajas

- No hay impacto en código web/backend existente.
- Menor riesgo de conflicto inmediato.

## Desventajas

- Mobile pierde funcionalidades o debe depender de soluciones frágiles.
- React Native no maneja cookies de navegador como la web.
- El chat en tiempo real puede no autenticarse correctamente.
- Se limita el cierre/renovación de sesión móvil.
- Algunas necesidades mobile quedarían sin contrato oficial.

## Uso recomendado

Solo como medida temporal mientras se define una API compatible formal.

---

# Comparación de alternativas

| Criterio | A. Un backend compatible | B. BFF mobile | C. Copia total backend | D. Solo contrato actual |
|---|---:|---:|---:|---:|
| Riesgo para web | Bajo si se revisa | Bajo-medio | Alto | Bajo |
| Duplicación de código | Baja | Baja-media | Muy alta | Baja |
| Complejidad de infraestructura | Baja | Media-alta | Alta | Baja |
| Compatibilidad JWT | Simple | Media | Compleja | Limitada |
| Socket.IO | Un solo servidor | Complejo sin Redis | Complejo sin Redis | Limitado |
| Mantenimiento | Bajo | Medio | Muy alto | Bajo |
| Recomendación | **Sí** | Solo si crece la necesidad | **No** | Temporal |

---

# Recomendación final

## Elegir alternativa A

Mantener un solo backend:

```text
pasa-el-dato-back
```

y proteger el funcionamiento web mediante contratos compatibles.

La separación adecuada no es duplicar la API completa, sino separar responsabilidades dentro del mismo backend:

```text
src/mobile/
  auth/
  chat/
  publicaciones/
  dto/
```

o mediante rutas explícitas:

```text
/api/mobile/auth/refresh
/api/mobile/auth/logout
/api/mobile/chat/...
/api/mobile/publicaciones/...
```

Esto permite que:

- la web siga usando sus contratos actuales;
- mobile tenga endpoints propios;
- PostgreSQL y MongoDB mantengan una sola fuente de verdad;
- JWT y Socket.IO sigan centralizados;
- los cambios sean revisables y aislables por Git.

---

# Plan de implementación seguro

## Fase 1: proteger la web

1. Identificar los endpoints usados por web.
2. Congelar sus contratos:
   - métodos;
   - URLs;
   - request body;
   - response body;
   - cookies;
   - eventos Socket.IO.
3. Agregar pruebas de regresión para esos contratos.

## Fase 2: aislar contratos mobile

1. Crear módulos o controladores mobile nuevos.
2. Crear DTOs mobile nuevos.
3. Usar rutas nuevas bajo:

   ```text
   /api/mobile
   ```

4. Delegar la lógica a servicios existentes sin duplicarla.
5. Agregar pruebas específicas para mobile.

## Fase 3: revisar cambios actuales

1. Restaurar la codificación UTF-8 en `chat.gateway.ts`.
2. Revisar el filtro que oculta conversaciones vacías:
   - si web requiere verlas, mover esa regla a endpoint mobile;
   - no cambiar la respuesta del endpoint web existente.
3. Revisar el estado `Pausado`:
   - confirmar valor oficial de catálogo;
   - actualizar web si usa el valor incorrecto;
   - centralizar estados en una constante o catálogo.
4. Revisar endpoints nuevos y documentarlos.

## Fase 4: validación

1. Ejecutar pruebas backend.
2. Probar login, refresh y logout en web.
3. Probar login, refresh y logout en mobile.
4. Probar chat web ↔ mobile.
5. Probar cambio de estado de publicación desde ambos clientes.
6. Revisar los cambios con la responsable del backend/web antes de merge.

---

# Decisión sugerida para el equipo

> No se recomienda crear una copia completa llamada `pasa-el-dato-back-mobile`. Duplicaría la lógica y pondría en riesgo la consistencia de autenticación, chat, publicaciones y bases de datos.
>
> Se recomienda mantener un backend único y crear contratos mobile aislados, preferiblemente bajo `/api/mobile`, sin modificar ni eliminar contratos que la web ya consume. Los cambios de reglas compartidas deben aprobarse y probarse en ambos clientes.
