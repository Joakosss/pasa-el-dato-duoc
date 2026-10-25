# HU-UBI-01 — Especificación funcional del catálogo territorial

**Fecha:** 2026-10-25  
**Alcance de este documento:** comportamiento y contratos observables. No define arquitectura, migraciones, seeds ni implementación.  
**Historia de usuario:** `docs/historias-de-usuario/HU-UBI-01.md`

## 1. Alcance y comportamiento esperado

El sistema expone un catálogo territorial de solo lectura con esta jerarquía efectiva:

`Región → Comuna → Sede`

`Ciudad` es un catálogo de apoyo asociado a una región y, cuando corresponde, a una comuna.

Comportamiento esperado:

- El catálogo cubre las 16 regiones y las 345 comunas de los datasets existentes.
- El catálogo de ciudades incluye únicamente las 271 entidades CPAC 2024 con `CATEGORIA = "Ciudad"`.
- Cada ciudad oficial se identifica por `idEntidad` y se asocia a su comuna mediante el CUT normalizado a cinco dígitos.
- Una comuna puede tener cero, una o varias ciudades.
- Las 19 sedes base de la HU quedan asociadas a su comuna y con `activa = true`.
- Las consultas son públicas, de solo lectura y sin autenticación.
- No existen endpoints para crear, editar o eliminar regiones, ciudades, comunas o sedes.

## 2. Contratos de endpoints

### 2.1 `GET /api/regiones`

**Parámetros:** ninguno obligatorio.

**Respuesta 200:**

```json
[
  {
    "id": 1,
    "nombre": "Tarapacá",
    "codigoSubdere": "01"
  }
]
```

Reglas del contrato:

- Devuelve las 16 regiones.
- Campos: `id`, `nombre`, `codigoSubdere`.
- Orden: `nombre` ascendente; empate por `id` ascendente.
- No incluye comunas ni ciudades anidadas.

**Errores:** no se define un 404 para este endpoint.

### 2.2 `GET /api/ciudades?regionId=`

**Parámetros:**

| Parámetro | Obligatorio | Tipo | Validación |
|---|---|---|---|
| `regionId` | Sí | entero | `>= 1` |

**Respuesta 200:**

```json
[
  {
    "id": 1,
    "idEntidad": "1310100100101",
    "nombre": "SANTIAGO",
    "regionId": 13
  }
]
```

Reglas del contrato:

- Devuelve todas las ciudades cuyo `regionId` coincide con el parámetro.
- Incluye ciudades legacy con `idEntidad = null`, si existen en la región.
- `idEntidad` es string para ciudades oficiales y `null` para registros antiguos sin identificador oficial.
- No devuelve comunas anidadas.
- No pagina.
- Si la región existe pero no tiene ciudades, responde `200 []`.
- Orden: `nombre` ascendente; empate por `id` ascendente.

**Errores:**

| Caso | HTTP | Condición |
|---|---:|---|
| `regionId` ausente | 400 | Falta el parámetro obligatorio |
| `regionId` no entero, vacío, `0` o negativo | 400 | Validación de tipo/rango |
| `regionId` inexistente | 404 | La región no existe |

Mensaje de referencia para 404: `Región no existe`.

### 2.3 `GET /api/comunas`

Debe recibir **exactamente uno** de `regionId` o `ciudadId`.

| Parámetro | Obligatorio | Tipo | Validación |
|---|---|---|---|
| `regionId` | Uno de los dos | entero | `>= 1` |
| `ciudadId` | Uno de los dos | entero | `>= 1` |

**Respuesta 200:**

```json
[
  {
    "id": 1,
    "nombre": "Santiago",
    "codigoSubdere": "13101",
    "regionId": 13
  }
]
```

Reglas del contrato:

- `regionId`: devuelve todas las comunas de la región, incluidas las 110 comunas sin ciudad.
- `ciudadId`: devuelve la comuna asociada a la ciudad.
- Si la ciudad existe pero no tiene comuna asociada, responde `200 []`.
- No devuelve `ciudadId` ni ciudades anidadas.
- No pagina.
- Orden: `nombre` ascendente; empate por `id` ascendente.

**Errores:**

| Caso | HTTP | Condición |
|---|---:|---|
| Sin `regionId` ni `ciudadId` | 400 | Debe indicarse exactamente uno |
| Con ambos parámetros | 400 | Debe indicarse exactamente uno |
| Parámetro no entero, vacío, `0` o negativo | 400 | Validación de tipo/rango |
| `regionId` inexistente | 404 | La región no existe |
| `ciudadId` inexistente | 404 | La ciudad no existe |

Mensajes de referencia:

- 400: debe indicar exactamente uno de `regionId` o `ciudadId`.
- 404 región: `Región no existe`.
- 404 ciudad: `Ciudad no existe`.

### 2.4 `GET /api/sedes?comunaId=&soloDisponibles=`

Contrato existente que se mantiene, sin agregar ciudad.

**Parámetros:**

| Parámetro | Obligatorio | Tipo | Validación |
|---|---|---|---|
| `comunaId` | No | entero | `>= 1` |
| `soloDisponibles` | No | booleano | `true`/`false` |

**Respuesta 200:**

```json
[
  {
    "id": 1,
    "nombre": "Puente Alto",
    "activa": true
  }
]
```

Reglas:

- Sin filtros devuelve todas las sedes, incluidas inactivas o eliminadas, conservando el comportamiento histórico.
- `comunaId` filtra por comuna.
- `soloDisponibles=true` devuelve solo sedes activas y no eliminadas.
- La respuesta no incluye ciudad, comuna ni región.
- No se agrega `Sede.ciudadId`.

**Errores:**

| Caso | HTTP | Condición |
|---|---:|---|
| `comunaId` no entero, `0` o negativo | 400 | Validación |
| `comunaId` inexistente | 404 | `Comuna no existe` |

## 3. Validaciones transversales

- Los parámetros numéricos se interpretan como enteros.
- Valores vacíos, decimales, texto, `0` o negativos producen 400.
- La validación de forma ocurre antes de consultar la existencia del recurso.
- Los errores 404 solo se emiten cuando el parámetro tiene forma válida pero el recurso no existe.
- Las respuestas de listado siempre son arreglos JSON, nunca `null`.
- Los listados no incluyen paginación en esta HU.
- No se exponen datos internos de persistencia.

## 4. Reglas para comunas sin ciudades y con varias ciudades

### Comunas sin ciudades

- Son válidas y forman parte del catálogo.
- `GET /api/comunas?regionId=` debe devolverlas.
- No se crean ciudades ficticias, genéricas ni placeholders.
- No se bloquea el seed ni la implementación por su existencia.
- No se asignan sedes a una ciudad inventada.

### Comunas con varias ciudades

- Se conservan todas las ciudades asociadas.
- `GET /api/ciudades?regionId=` devuelve todas.
- `GET /api/comunas?ciudadId=` devuelve la comuna asociada a la ciudad consultada.
- No existe una ciudad “principal” en el contrato.
- La comuna sigue siendo la referencia territorial de la sede.

### Referencia provisional de ciudad para sedes

- En comunas de sede con varias ciudades, se usa como referencia documental la ciudad cuyo nombre coincide con el nombre de la comuna, comparando sin distinguir mayúsculas, minúsculas ni tildes.
- La referencia solo se usa si la coincidencia es exacta tras normalizar.
- No se inventa una coincidencia.
- La referencia no se expone como relación obligatoria de `Sede` ni se agrega `Sede.ciudadId`.
- Los cuatro casos multi-sede del dataset resuelven por esta regla: Melipilla, San Bernardo, Valparaíso y Puerto Montt.
- Casos sin coincidencia o con más de una coincidencia deben quedar documentados como ambiguos y no resolverse automáticamente.

## 5. Criterios de aceptación verificables

### Regiones

- **Dado** el catálogo cargado, **cuando** se consulta `GET /api/regiones`, **entonces** responde 200 con 16 regiones y cada una tiene `id`, `nombre` y `codigoSubdere`.
- **Dado** el catálogo cargado, **cuando** se consulta regiones, **entonces** no hay `codigoSubdere` duplicado.

### Ciudades

- **Dado** una región válida, **cuando** se consulta `GET /api/ciudades?regionId=`, **entonces** responde 200 y todas las ciudades pertenecen a esa región.
- **Dado** una región sin ciudades, **cuando** se consulta, **entonces** responde 200 con `[]`.
- **Dado** una región inexistente, **cuando** se consulta, **entonces** responde 404.
- **Dado** una solicitud sin `regionId`, con texto, `0` o negativo, **cuando** se consulta, **entonces** responde 400.
- **Dado** una ciudad oficial, **entonces** su `idEntidad` no es nulo y es único.
- **Dado** una ciudad legacy sin identificador, **entonces** `idEntidad` es `null` y el registro no se elimina.

### Comunas

- **Dado** una región válida, **cuando** se consulta `GET /api/comunas?regionId=`, **entonces** responde 200 con todas sus comunas, incluidas las que no tienen ciudad.
- **Dado** una ciudad válida con comuna, **cuando** se consulta `GET /api/comunas?ciudadId=`, **entonces** responde 200 con su comuna.
- **Dado** una ciudad válida sin comuna, **cuando** se consulta, **entonces** responde 200 con `[]`.
- **Dado** una solicitud sin parámetros o con ambos, **cuando** se consulta comunas, **entonces** responde 400.
- **Dado** una región o ciudad inexistente con parámetro válido, **entonces** responde 404 con el mensaje correspondiente.
- **Dado** una comuna, **entonces** expone `regionId` y no expone `ciudadId`.
- **Dado** una región, **entonces** todas sus comunas tienen el mismo `regionId` que la región consultada.

### Sedes

- **Dado** el catálogo de sedes cargado, **entonces** existen exactamente 19 sedes base, todas activas.
- **Dado** una sede base, **entonces** tiene una comuna existente y esa comuna pertenece a la región de referencia de la HU.
- **Dado** una comuna válida, **cuando** se consulta `GET /api/sedes?comunaId=`, **entonces** solo devuelve sedes de esa comuna.
- **Dado** una comuna inexistente, **entonces** responde 404.
- **Dado** una sede, **entonces** la respuesta no contiene `ciudadId`, `comunaId` ni objetos territoriales anidados.
- **Dado** una comuna con varias ciudades, **entonces** la sede no requiere una ciudad única para existir.

### Datos y seeds

- **Dado** el catálogo territorial cargado, **entonces** hay 16 regiones, 345 comunas y 271 ciudades.
- **Dado** el catálogo de ciudades, **entonces** ninguna tiene categoría Pueblo, Aldea, Caserío u otra distinta de Ciudad.
- **Dado** una ciudad oficial, **entonces** su CUT tiene cinco dígitos y corresponde a una comuna existente.
- **Dado** una comuna sin ciudad, **entonces** sigue existiendo y es consultable por región.
- **Dado** una comuna con varias ciudades, **entonces** todas sus ciudades se conservan.
- **Dado** que el seed territorial se ejecuta dos veces, **entonces** los conteos y relaciones no cambian y no hay duplicados.
- **Dado** que el seed de sedes se ejecuta dos veces, **entonces** siguen existiendo 19 sedes y no hay duplicados.
- **Dado** una inconsistencia de comuna, región o ciudad en el seed, **entonces** el proceso falla de forma controlada sin crear una sede incompleta.
- **Dado** el seed dev, **entonces** no carga el catálogo territorial completo ni las 19 sedes.

## 6. Requisitos funcionales de los datos territoriales y sedes

### Regiones y comunas

- Fuente de regiones y comunas: datasets existentes basados en SUBDERE.
- 16 regiones.
- 345 comunas.
- Códigos SUBDERE únicos.
- No se incorpora Antártica.
- Cada comuna pertenece a una región.

### Ciudades

- Fuente: CPAC 2024, `Base_urbanos_CPV24.csv`, contrastada con el diccionario de glosas.
- Solo `CATEGORIA = "Ciudad"`: 271 registros.
- Se excluyen Pueblo, Aldea, Caserío y categorías rurales.
- Cada ciudad oficial tiene `idEntidad` del dataset; no se inventan identificadores.
- La relación con la comuna se resuelve por CUT de cinco dígitos.
- `idEntidad` es nullable para preservar registros antiguos.
- No se usan nombres como clave única.
- No se carga una ciudad por comuna de forma automática.

### Sedes

- 19 sedes base definidas en `HU-UBI-01.md`.
- Todas con `activa = true`.
- Todas asociadas a una comuna existente.
- La comuna se resuelve por código SUBDERE, no por nombre literal.
- La comuna debe tener al menos una ciudad para validar la referencia territorial, salvo que el seed reporte el caso como inconsistencia.
- La ciudad de referencia es documental y provisional; no se persiste en `Sede`.
- No se usan IDs fijos de sede.
- La clave de idempotencia de sede es su nombre.

## 7. Exclusiones explícitas

- No se agrega `Sede.ciudadId`.
- No se agregan endpoints administrativos ni de escritura.
- No se agrega frontend.
- No se agregan Pueblo, Aldea, Caserío ni localidades rurales.
- No se agregan métricas censales al catálogo.
- No se agrega Antártica.
- No se crean ciudades para las 110 comunas sin ciudad.
- No se define una ciudad principal para comunas multi-ciudad.
- No se resuelven manualmente todas las comunas de Chile.
- No se modifica autenticación, publicaciones, perfiles, búsqueda ni filtros.
- No se agrega paginación.
- No se agregan relaciones territoriales anidadas en las respuestas.

## 8. Incógnitas para `design`

- Mensaje literal final para el 400 de `GET /api/comunas` cuando falta o sobran parámetros; la especificación solo exige que indique que debe enviarse exactamente uno.
- Forma exacta de representar `idEntidad` en OpenAPI cuando es nullable.
- Estrategia de migración y backfill de `Comuna.regionId` y `Ciudad.idEntidad` preservando datos existentes.
- Validación de la referencia provisional de ciudad de sede en el seed: ¿fallar todo el seed o solo registrar la ambigüedad? La HU exige no crear relaciones incompletas; la decisión operativa queda para `design`.
- Tratamiento de futuras ciudades legacy con `idEntidad = null` en consultas y reportes internos.

## 9. Pendientes

- `design` debe definir DTOs, validación exacta, migración segura, estructura de seeds y pruebas.
- `tasks` debe dividir la implementación.
- No se ha modificado código, esquema, migraciones, seeds ni base de datos.
