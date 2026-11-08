# HU-ADM-04 — Visualizar dashboard administrativo de métricas

**Como** administrador
**quiero** consultar métricas agregadas de uso de la plataforma con filtros de fecha y sede
**para** tomar decisiones institucionales sobre el marketplace.

## Criterios de aceptación

- **Dado** que soy un administrador autenticado,
  **cuando** accedo al dashboard,
  **entonces** el sistema calcula y muestra las métricas agregadas: usuarios activos, publicaciones por categoría y sede, transacciones totales y reportes resueltos.

- **Dado** que filtro por rango de fechas o por sede,
  **cuando** aplico el filtro,
  **entonces** las métricas se recalculan y muestran según el criterio aplicado.

- **Dado** que no existen datos suficientes para el periodo o sede elegidos,
  **cuando** consulto el dashboard,
  **entonces** el sistema lo informa con un mensaje claro de falta de datos.

- **Dado** que intento acceder sin sesión o sin rol de administrador,
  **cuando** consulto el dashboard,
  **entonces** el sistema rechaza la operación.

## Reglas de negocio

Aprobadas documentalmente (R.34, CU020 extendido, R.33):

- Solo un administrador autenticado consulta el dashboard.
- Métricas: usuarios activos, publicaciones por categoría/sede, transacciones totales y reportes resueltos; además, filtros por rango de fechas y sede (CU020).
- La métrica de transacciones totales cuenta las ventas cerradas vía HU-COM-01 (decisión aprobada).
- Sin datos para el periodo/filtro, el sistema lo informa (CU020, curso alternativo 1).
- Fuera de alcance de esta HU: exportación o reportes descargables, notificaciones y acciones correctivas (gestión que sigue al análisis).

Nota técnica de origen (no define diseño): no existe módulo de métricas; el cálculo se apoya en las entidades vigentes (usuario, publicacion con fk_user_comprador y estado, reportes cuando existan). "Fechas" se sustenta en los campos `BASE` del modelo (fecha_creacion, fecha_modificacion).

## Subtareas

### Backend (BE)

- **HU-ADM-04-BE01:** Definir el contrato de métricas y filtros por rango de fechas y sede, especificando límites y formato de fechas.
- **HU-ADM-04-BE02:** Implementar un endpoint protegido por rol administrador que agregue usuarios activos, publicaciones por categoría/sede, transacciones cerradas y reportes resueltos.
- **HU-ADM-04-BE03:** Aplicar los filtros solicitados en cada métrica y devolver valores agregados sin exponer datos personales innecesarios.
- **HU-ADM-04-BE04:** Definir y documentar la regla para periodos/sedes sin datos y el formato de respuesta en Swagger.
- **HU-ADM-04-BE05:** Agregar pruebas unitarias/e2e para autorización, filtros de fecha/sede, agrupaciones, cálculos de transacciones y reportes, y respuesta sin datos.
- **HU-ADM-04-BE06:** Resolver en spec/design la estrategia bajo demanda o precalculada y la granularidad temporal de distribuciones.

### Frontend (FE)

- **HU-ADM-04-FE01:** Crear el dashboard administrativo con secciones para las métricas aprobadas.
- **HU-ADM-04-FE02:** Implementar controles de filtro por periodo y sede, integrados con los catálogos disponibles.
- **HU-ADM-04-FE03:** Consultar el endpoint al aplicar o cambiar filtros y actualizar las visualizaciones con la respuesta.
- **HU-ADM-04-FE04:** Mostrar carga, ausencia de datos, errores de autorización y fallos de red con mensajes claros.
- **HU-ADM-04-FE05:** Presentar métricas agregadas y distribuciones de manera accesible, sin añadir exportación u otras acciones fuera de alcance.

## Dependencias

- Rol administrador autenticado (módulo auth existente).
- Usuarios, publicaciones y transacciones en la BD para computar; para "reportes resueltos" depende de HU-ADM-01 y HU-ADM-02 (y su prerrequisito de reportes del estudiante).
- HU-PUB-01 y HU-PUB-05 (publicaciones consultables para métricas por catálogo).
- HU-COM-01 (transacciones cerradas para la métrica de transacciones totales).

## Prioridad

**Media**

Toma de decisiones institucional (R.34); no bloquea la operación del resto del módulo, aunque cierra el ciclo de control.

## Dudas pendientes

- ¿El dashboard se calcula bajo demanda o precalculado? Definir en spec (no bloqueante).
- Grupos de tiempo de las distribuciones (día, semana): definirse en spec.

## Estado

`lista` — lista para comenzar `explore → proposal → spec + design → tasks → apply-progress → verify-report → archive-report`. Depende de HU-COM-01 (métrica de transacciones) y de HU-ADM-01/02 con su prerrequisito de reportes para "reportes resueltos".
