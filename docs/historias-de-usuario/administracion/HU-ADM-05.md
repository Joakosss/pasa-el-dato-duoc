# HU-ADM-05 — Gestionar lista de palabras bloqueadas

**Como** administrador
**quiero** crear y eliminar palabras bloqueadas de una lista del sistema
**para** que el filtro automático de moderación proteja chat y publicaciones según las normativas institucionales.

## Criterios de aceptación

- **Dado** que soy un administrador autenticado,
  **cuando** agrego una palabra a la lista,
  **entonces** el sistema la registra y pasa a bloquear su uso en los envíos de mensajes (HU-CHAT-05) y al validar contenido de publicaciones según el dominio que corresponda.

- **Dado** que el nombre de la palabra ya existe en la lista,
  **cuando** intento agregarla de nuevo,
  **entonces** el sistema rechaza la operación e indica duplicado.

- **Dado** que elimino una palabra de la lista,
  **cuando** confirmo,
  **entonces** el sistema la retira y los usos posteriores no se bloquean por esa palabra (los mensajes anteriores permanecen intactos).

- **Dado** que no hay palabras en la lista,
  **cuando** la consulto,
  **entonces** el sistema la muestra vacía y no bloquea envíos ni publicaciones por ese motivo.

- **Dado** que intento agregar o eliminar sin sesión o sin rol de administrador,
  **cuando** ejecuto la acción,
  **entonces** el sistema rechaza la operación.

## Reglas de negocio

Aprobadas documentalmente (R.15) y resoluciones previas del proyecto:

- El sistema aplica un filtro automático que bloquea palabras sensibles en chat y publicaciones (R.15).
- La lista pertenece al dominio administración, es global (una única lista para toda la plataforma, decisión aprobada) y es consumida por el filtro de HU-CHAT-05 (y el filtrado de contenido en publicaciones en su dominio correspondiente).
- La coincidencia es exacta según la decisión tomada en chat: no detecta variantes con espacios o símbolos, hasta que se decida distinto (decisión vigente de HU-CHAT-05).
- Eliminar un término no modifica el historial ya almacenado (conversaciones, mensajes o publicaciones).
- Fuera de alcance: aplicar manualmente moderación o sanciones (HU-ADM-01/02) y la moderación del contenido ya publicado.

Nota técnica de origen (no define diseño): no existe tabla o módulo de palabras bloqueadas; su persistencia se define en spec (PostgreSQL, consistente con el resto de la administración).

## Dependencias

- HU-CHAT-05 (consumidor del filtro) y su dominio correspondiente en publicaciones cuando exista.
- Rol administrador autenticado (módulo auth existente).

## Prioridad

**Alta**

R.15 es requerimiento solicitado. El dominio chat ya apunta a esta lista para completar su dominio. Sin ella, elementos con palabras sensibles circularían sin control.

## Dudas pendientes

- Variantes de una misma palabra (plurales, tildes): la coincidencia exacta vigente no las cubre; decisión explícita pendiente si se quiere cubrir.

## Estado

`lista` — lista para comenzar `explore → proposal → spec + design → tasks → apply-progress → verify-report → archive-report`.
