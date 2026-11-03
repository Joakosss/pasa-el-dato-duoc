# HU-UBI-01 — Catálogo de ubicación Región → Ciudad → Comuna → Sede

**Como** estudiante

**quiero** seleccionar una ubicación encadenada por región, ciudad, comuna y sede válida

**para** publicar, mantener mi perfil, buscar y filtrar con ubicación consistente en todo Chile.

## Criterios de aceptación

- **Dado** que los catálogos territoriales están cargados,
    
    **cuando** consulto regiones, ciudades y comunas,
    
    **entonces** obtengo cobertura de todo Chile, sin registros vacíos, sin duplicados por código SUBDERE en región y comuna, y sin duplicados según la regla de unicidad definida para ciudad.
    
- **Dado** que selecciono una región válida,
    
    **cuando** solicito sus ciudades,
    
    **entonces** obtengo únicamente las ciudades cuyo `Ciudad.regionId` corresponde a la región seleccionada.
    
- **Dado** que selecciono una ciudad válida,
    
    **cuando** solicito sus comunas,
    
    **entonces** obtengo únicamente las comunas cuyo `Comuna.ciudadId` corresponde a la ciudad seleccionada.
    
- **Dado** que selecciono una comuna válida,
    
    **cuando** solicito sus sedes,
    
    **entonces** obtengo únicamente las sedes cuyo `Sede.comunaId` corresponde a la comuna seleccionada.
    
- **Dado** que consulto la ubicación de una sede,
    
    **cuando** el sistema obtiene sus relaciones territoriales,
    
    **entonces** resuelve la ubicación mediante la cadena: `Sede → Comuna → Ciudad → Región`.
    
- **Dado** que los catálogos territoriales y de sedes están cargados,
    
    **cuando** consulto las sedes disponibles,
    
    **entonces** obtengo las 19 sedes base definidas en esta HU, asociadas a su comuna correspondiente y con estado `activa = true`.
    
- **Dado** una combinación inconsistente (como comuna de otra ciudad, ciudad de otra región, sede de otra comuna o código/identificador inexistente),
    
    **cuando** intento utilizarla en publicación, perfil, búsqueda o filtro,
    
    **entonces** el sistema rechaza la operación por ubicación inválida.
    
- **Dado** que el seed de catálogos territoriales y sedes se ejecuta más de una vez,
    
    **cuando** reviso los datos cargados,
    
    **entonces** el sistema crea o actualiza los registros mediante sus identificadores únicos, mantiene sus relaciones y no genera duplicados.
    
- **Dado** que el seed intenta cargar una sede cuya comuna no existe, cuya comuna no pertenece a la región de referencia o cuya relación territorial no puede resolverse,
    
    **cuando** se ejecuta el proceso de carga,
    
    **entonces** el sistema rechaza esa carga de forma controlada y no crea una sede con ubicación incompleta o inconsistente.
    
- **Dado** un usuario o administrador durante el MVP,
    
    **cuando** intenta crear, editar o eliminar una región, ciudad o comuna mediante interfaz o API,
    
    **entonces** dicha opción no existe.
    

## Reglas de negocio

### Fuente y catálogos territoriales

- La fuente oficial de regiones y comunas es **SUBDERE**.
    
- Región y comuna deben conservar su código oficial SUBDERE.
    
- El catálogo `Ciudad` existente se conserva como catálogo interno de ciudades del sistema (no provienen de SUBDERE y utiliza identificador propio).
    
- La regla exacta de unicidad de `Ciudad` se definirá durante `spec + design` según el modelo vigente.
    
- El catálogo territorial debe cubrir todo Chile y no limitarse a zonas con sede Duoc.
    

### Jerarquía territorial

- La única jerarquía permitida es: `Región → Ciudad → Comuna → Sede`.
    
    - Una región tiene muchas ciudades; una ciudad pertenece a una región.
        
    - Una ciudad tiene muchas comunas; una comuna pertenece a una ciudad.
        
    - Una comuna tiene muchas sedes; una sede pertenece a una comuna.
        
- La relación territorial de una sede se resuelve mediante: `Sede → Comuna → Ciudad → Región`.
    

### Sedes

- `Sede` es un catálogo independiente relacionado territorialmente mediante `Comuna` (`Sede.comunaId`).
    
- La comuna, ciudad y región de una sede se obtienen desde sus relaciones; no se deben duplicar como textos en la tabla `Sede`.
    
- Todas las sedes base deben cargarse con `activa = true`. Solo las sedes activas están disponibles para selección.
    
- Una sede no puede existir sin una comuna válida. El seed debe validar que la comuna pertenezca a una ciudad y región válidas.
    
- El seed debe resolver comunas mediante códigos SUBDERE o identificadores únicos confiables (sin referencias literales).
    

### Administración y carga

- Los catálogos son de **solo lectura** para usuarios y administradores durante el MVP.
    
- No se debe crear interfaz ni endpoint para administrar manualmente regiones, ciudades o comunas.
    
- Las actualizaciones de catálogos se realizan exclusivamente mediante un seed versionado e idempotente gestionado por desarrollo.
    
- El seed debe poder ejecutarse múltiples veces sin crear duplicados ni registros vacíos, actualizando por clave única.
    
- No utilizar IDs fijos de sedes si pueden generar conflictos con datos existentes en la base de datos.
    

### Validación de ubicación

- Región, ciudad, comuna y sede deben ser estrictamente consistentes entre sí al usarse en publicaciones, perfiles, búsquedas y filtros.
    

## Datos base de sedes (19 sedes iniciales)

|**ID de ref.**|**Nombre**|**Comuna de referencia**|**Región de referencia**|**Estado**|
|---|---|---|---|---|
|1|Alameda|Santiago|Metropolitana|Activa|
|2|Antonio Varas|Providencia|Metropolitana|Activa|
|3|Maipú|Maipú|Metropolitana|Activa|
|4|Melipilla|Melipilla|Metropolitana|Activa|
|5|Padre Alonso de Ovalle|Santiago|Metropolitana|Activa|
|6|Plaza Norte|Huechuraba|Metropolitana|Activa|
|7|Plaza Oeste|Cerrillos|Metropolitana|Activa|
|8|Plaza Vespucio|La Florida|Metropolitana|Activa|
|9|Puente Alto|Puente Alto|Metropolitana|Activa|
|10|San Bernardo|San Bernardo|Metropolitana|Activa|
|11|San Carlos de Apoquindo|Las Condes|Metropolitana|Activa|
|12|San Joaquín|San Joaquín|Metropolitana|Activa|
|13|Valparaíso|Valparaíso|Valparaíso|Activa|
|14|Viña del Mar|Viña del Mar|Valparaíso|Activa|
|15|Campus Arauco|Arauco|Biobío|Activa|
|16|Campus Nacimiento|Nacimiento|Biobío|Activa|
|17|San Andrés de Concepción|Concepción|Biobío|Activa|
|18|Campus Villarrica|Villarrica|La Araucanía|Activa|
|19|Puerto Montt|Puerto Montt|Los Lagos|Activa|

## Reglas para el seed de sedes

- El seed debe cargar o actualizar las 19 sedes base.
    
- Debe buscar y asociar la comuna real correspondiente validándola contra su código SUBDERE y su región de referencia.
    
- Debe comprobar que cada comuna esté relacionada con una ciudad existente.
    
- Debe asignar `activa = true` a todas las sedes base.
    
- Debe usar una clave única (preferentemente el nombre de la sede) para garantizar idempotencia.
    
- Si una comuna no se resuelve o es inconsistente con ciudad/región, el seed debe fallar con un error explícito sin crear la sede.
    

## Dependencias

- Catálogo `Ciudad` existente y relacionado con región.
    
- Modelos `Región` y `Comuna` cargados con códigos SUBDERE.
    
- Relaciones `Comuna.ciudadId` y `Ciudad.regionId`.
    
- Tabla `Sede` con relación `Sede.comunaId`.
    
- Seed territorial ejecutado previo al seed de sedes.
    
- **HU-REG-01**, **HU-PUB-01**, **HU-PERF-01**, **HU-PERF-02**, Búsqueda y filtros (R.9 y R.30).
    

## Prioridad

**Alta**

Base del MVP. Bloquea publicaciones con ubicación válida, actualización de sede en perfil, búsqueda y filtros multisede.

## Dudas pendientes

- Ninguna bloqueante. La regla de unicidad de `Ciudad` se afinará en `spec + design`.
    

## Estado

`lista` — lista para comenzar `explore → proposal → spec + design → tasks → apply-progress → verify-report → archive-report`.