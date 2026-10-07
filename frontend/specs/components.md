# Especificación de componentes

## Funcionalidad 1 — Filtro de rango de fechas en el dashboard principal

### 1. Propósito
Permitir filtrar los datos del dashboard por una fecha inicial, una fecha final o ambas, mostrando al usuario el rango disponible en el dataset.

### 2. Componentes
- `DashboardDateFilter`: presenta los inputs opcionales de inicio y fin.
- `AvailableDateRange`: presenta el rango disponible obtenido de facets.

### 3. Props de cada componente

| Nombre | Tipo | Obligatoria | Descripción |
|---|---|---|---|
| `DashboardDateFilter.value` | `DateRangeFilter` | Sí | Valores actuales. Si solo se rellena una fecha, conserva ese límite y deja vacío el otro; envía únicamente el parámetro correspondiente. El efecto unilateral sobre `GET /api/metrics` queda pendiente de verificar. |
| `AvailableDateRange.facets` | `FacetsResponse` | Sí | Usa `min_date` y `max_date` para mostrar, por ejemplo, “Rango disponible: 2025-10-02 – 2026-09-28”. Ambas fechas tienen formato `YYYY-MM-DD`. |

### 4. Estados

| Cargando | Vacío | Error | Dato parcial o inválido |
|---|---|---|---|
| Inputs de fecha deshabilitados mientras se cargan facets; se muestra “Cargando rango disponible…”. | Si no hay movimientos para el filtro, se muestra “No hay movimientos para el rango seleccionado”; los dos inputs vacíos significan todos los datos disponibles. | Si falla facets, se muestra “No se pudo cargar el rango disponible”; no se muestran límites inventados. | Con solo una fecha, se conserva el input rellenado y se omite el otro parámetro. Una fecha que no tenga formato `YYYY-MM-DD` muestra “Introduce una fecha válida (YYYY-MM-DD)”. Si falta `min_date` o `max_date`, se muestra “Rango disponible incompleto”. |

### 5. Decisiones aplicadas (de verification.md)
- Decisión 6: conservar los nombres que ya acepte el endpoint de métricas; si no acepta fechas, añadir `start_date` y `end_date`. La existencia y semántica de esos parámetros en `GET /api/metrics` siguen sin verificar.
- El pedido permite ambos inputs vacíos. El tratamiento de un único límite como filtro unilateral está especificado para la interfaz, pero debe confirmarse contra el endpoint de métricas.

## Funcionalidad 2 — Tabla de alertas de anomalías

### 1. Propósito
Mostrar los períodos en los que el gasto supera el umbral configurado junto con el gasto, su media base y el incremento porcentual.

### 2. Componentes
- `AlertsSection`: coordina parámetros y resultados de alertas.
- `AlertsTable`: presenta las cuatro columnas de cada anomalía.

### 3. Props de cada componente

| Nombre | Tipo | Obligatoria | Descripción |
|---|---|---|---|
| `AlertsSection.params` | `AlertsParams` | Sí | Incluye `threshold` y los límites opcionales `start_date` / `end_date` para `GET /api/metrics/alerts`. El umbral permitido por la decisión de producto es `0.01–1.0`, aunque OpenAPI solo declara mínimo `0` y no declara máximo. |
| `AlertsTable.alerts` | `AlertsResponse` | Sí | Lista de `AlertEntry` obtenida de `GET /api/metrics/alerts`; renderiza las columnas siguientes sin sustituir campos faltantes por cero. |

Columnas de `AlertsTable`:

| Columna | Tipo de dato | Formato de visualización |
|---|---|---|
| Período (`period`) | `string` | Mostrar el texto devuelto, por ejemplo `2025-12`; OpenAPI no confirma un formato fijo. |
| Outcome registrado (`outcome_total`) | `number` | Dos decimales, por ejemplo `103378.98`; sin símbolo de moneda porque la moneda no está especificada. |
| Media base (`baseline_average`) | `number` | Dos decimales, por ejemplo `51174.10`; sin símbolo de moneda por la misma razón. |
| Incremento (`increase_ratio`) | `number` | Convertir el ratio a porcentaje multiplicando por 100 y mostrar dos decimales y `%`; `1.0201` se muestra como `102.01%`. |

### 4. Estados

| Cargando | Vacío | Error | Dato parcial o inválido |
|---|---|---|---|
| Se muestra el encabezado de la tabla y cuatro filas skeleton. | Se muestra explícitamente “No se detectaron anomalías para el umbral 0.30” usando el umbral actual en lugar de ocultar la tabla. | Se muestra “No se pudieron cargar las alertas”; no se presenta una lista vacía como si la petición hubiera tenido éxito. | Si una respuesta carece de algún campo de `AlertEntry`, se muestra “No se pudieron mostrar algunas alertas por datos incompletos” y se omite la fila inválida. Si `threshold` está fuera de `0.01–1.0`, se rechaza con “El umbral debe estar entre 0.01 y 1.0”; no se solicita ni se presenta el resultado para ese valor. |

### 5. Decisiones aplicadas (de verification.md)
- Decisión sobre `threshold`: opción A, rechazar valores fuera de `0.01–1.0` con error de validación. OpenAPI declara mínimo `0`, no declara máximo y solo se probó `0.3`; el comportamiento runtime fuera del rango aún no está verificado.
- `start_date` y `end_date` están confirmados como parámetros opcionales de `/api/metrics/alerts` y usan formato `YYYY-MM-DD`.

## Funcionalidad 3 — Vista comparativa B2B vs B2C

### 1. Propósito
Comparar en paralelo las cinco categorías de ingresos principales de B2B y B2C y mostrar debajo el total de ingresos de cada grupo en un único gráfico.

### 2. Componentes
- `BusinessComparisonPage`: dispone los dos paneles en paralelo y el gráfico debajo; en pantallas estrechas apila los paneles.
- `BusinessCategoryPanel`: muestra la tabla de categorías de una línea de negocio.
- `BusinessComparisonChart`: compara los totales agregados de ingresos de B2B y B2C.

### 3. Props de cada componente

| Nombre | Tipo | Obligatoria | Descripción |
|---|---|---|---|
| `BusinessComparisonPage.facets` | `FacetsResponse` | Sí | Proporciona las categorías disponibles desde `categories`. |
| `BusinessComparisonPage.params` | `TopCategoriesParams` | Sí | Solicita `operation_type: 'income'`, `limit: 5`, el rango de fechas y `business_type` para cada grupo. |
| `BusinessCategoryPanel.businessType` | `BusinessType` | Sí | Identifica el panel como `B2B` o `B2C`. |
| `BusinessCategoryPanel.entries` | `TopCategoriesResponse` | Sí | Categorías recibidas de `/api/metrics/categories/top`; cada fila usa `category` y `total_amount`, y calcula su porcentaje respecto al total del grupo. |
| `BusinessCategoryPanel.availableCategories` | `FacetsResponse['categories']` | Sí | Lista de categorías disponibles obtenida de `/api/metrics/facets`. |
| `BusinessCategoryPanel.groupTotalIncome` | `number` (pendiente de contrato) | Sí | Total de ingresos del grupo, necesario para calcular el porcentaje. La decisión pide añadir el total agregado a la API, pero no existe todavía un campo de respuesta verificado ni un tipo correspondiente en `api-types.ts`. |
| `BusinessComparisonChart.b2bTotalIncome` | `number` (pendiente de contrato) | Sí | Total agregado de ingresos B2B; valor destinado al punto B2B del gráfico. La propiedad de respuesta de la API aún no está verificada. |
| `BusinessComparisonChart.b2cTotalIncome` | `number` (pendiente de contrato) | Sí | Total agregado de ingresos B2C; valor destinado al punto B2C del gráfico. La propiedad de respuesta de la API aún no está verificada. |

El gráfico contiene dos puntos: B2B representa el total agregado de ingresos de esa línea de negocio y B2C representa el total agregado de la otra. No se deben derivar esos totales sumando solo el top 5, ni sustituir un total ausente por cero.

### 4. Estados

| Cargando | Vacío | Error | Dato parcial o inválido |
|---|---|---|---|
| Se muestran dos paneles con skeletons de tabla y un skeleton para el gráfico. | Si la lista de un panel está vacía, ese panel muestra “No hay categorías de ingresos para B2B en el rango seleccionado” o “No hay categorías de ingresos para B2C en el rango seleccionado”, según corresponda; el otro panel sigue visible. Si ambas están vacías, el gráfico muestra “No hay ingresos comparables para el rango seleccionado”. | Se muestra “No se pudo cargar la comparación B2B/B2C”; no se reemplaza un fallo de petición por tablas vacías. | Si solo una lista está vacía, su panel muestra el mensaje vacío y el otro conserva sus filas. Si falta uno de los totales agregados, el gráfico indica “Total B2B no disponible” o “Total B2C no disponible” y no inventa el punto faltante. Si faltan campos de una fila, se omite esa fila y se informa “Hay categorías con datos incompletos”. |

### 5. Decisiones aplicadas (de verification.md)
- Decisión sobre el total B2B/B2C: opción B, añadir a la API un total agregado por grupo. La respuesta verificada de `/api/metrics/categories/top` solo contiene categorías con `total_amount`; no confirma un total global. Los tipos de total del gráfico quedan pendientes de verificar y añadir al contrato API.
- El endpoint top acepta `business_type` con valores `B2B` o `B2C`, `operation_type` con `income` o `outcome`, `limit` entre `1` y `20`, y `start_date` / `end_date` opcionales.