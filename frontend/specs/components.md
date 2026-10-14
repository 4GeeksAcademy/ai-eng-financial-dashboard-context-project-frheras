# Especificación de componentes

La interacción y navegación descritas son especificaciones para implementar en React; en esta revisión se implementan los contratos backend y sus pruebas, no los componentes de UI.

Reglas comunes de fechas para dashboard y comparativa: validar las fechas del calendario en formato `YYYY-MM-DD`, el orden cuando ambos límites estén presentes y cada límite rellenado contra `min_date` / `max_date` de las facets globales. Ambos vacíos siguen significando sin filtros. Si un límite está invertido o fuera del rango, bloquear Aplicar y no consultar los recursos de datos ni cambiar el rango aplicado o la URL. No ajustar fechas silenciosamente.

- Formato o fecha de calendario inválidos: “Formato de fecha incorrecto, utilizar el formato YYYY-MM-DD”.
- Inicio posterior al fin: “La fecha de inicio es posterior a la fecha de fin. El rango de fecha indicado no es correcto, por favor, seleccione un rango de fechas entre [min_date] y [max_date]”.
- Límite fuera del dataset: “El rango de fecha indicado está fuera de las fechas disponibles, por favor, seleccione un rango de fechas entre [min_date] y [max_date]”.
- Si faltan las facets globales necesarias para validar límites no vacíos, bloquear su aplicación con “No se pudo cargar el rango disponible”. Con ambas fechas null y sin movimientos, mostrar “No hay fechas disponibles” y no aceptar límites no vacíos. Esta política es de UI, no una nueva validación del backend.

Todos los números visibles usan `es-ES`. Importes, porcentajes y umbral confirmado se presentan con dos decimales; sin moneda para importes. Fechas de los parámetros mantienen `YYYY-MM-DD` y los valores enviados a la API conservan su representación técnica, por ejemplo `threshold=0.3`.

## Funcionalidad 1 — Filtro de rango de fechas en el dashboard principal

### 1. Propósito
Permitir filtrar los datos del dashboard por una fecha inicial, una fecha final o ambas, mostrando al usuario el rango disponible en el dataset.

### 2. Componentes
- `DashboardDateFilter`: presenta los inputs opcionales de inicio y fin.
- `AvailableDateRange`: presenta el rango disponible obtenido de facets.

Situar los controles de fecha en la parte superior del dashboard, antes de los KPIs y gráficos. `AvailableDateRange` se muestra junto a los dos inputs, dentro del mismo bloque de controles; en móvil puede ocupar la línea inmediatamente siguiente, sin trasladarse a otra sección.

Los inputs mantienen un rango en edición separado del rango aplicado. Cambiar un input no consulta la API. Al pulsar **Aplicar**, se valida el formato y se envían únicamente los límites rellenados a `GET /api/metrics` y `GET /api/metrics/alerts`. Con ambos vacíos se omiten los dos parámetros.

Cada aplicación recarga ambos recursos y recalcula ingresos, gastos, beneficio, margen y los datos mensuales de los dos gráficos existentes a partir de los nuevos movimientos; también actualiza la tabla de alertas. La etiqueta del encabezado refleja el rango aplicado. La referencia de fechas disponibles procede de facets **sin filtros**, no del rango recién seleccionado. No mezclar resultados de distintos rangos: ignorar respuestas de peticiones anteriores y no presentar datos antiguos como actuales si falla la carga.

### 3. Props de cada componente

| Nombre | Tipo | Obligatoria | Descripción |
|---|---|---|---|
| `DashboardDateFilter.value` | `DateRangeFilter` | Sí | Rango en edición. Una sola fecha funciona como límite unilateral inclusivo; la otra se omite. |
| `DashboardDateFilter.onApply` | `(filter: MetricsParams) => void` | Sí | Notifica el rango confirmado solo al pulsar Aplicar para recargar todos los datos del dashboard. |
| `AvailableDateRange.facets` | `FacetsResponse` | Sí | Facets globales sin filtros: mostrar “Rango disponible: [min_date] – [max_date]” en `YYYY-MM-DD`; si ambas fechas son null, mostrar “No hay fechas disponibles”. |

### 4. Estados

| Cargando | Vacío | Error | Dato parcial o inválido |
|---|---|---|---|
| “Cargando rango disponible…” durante facets; skeletons de KPIs, gráficos y alertas al aplicar; botón Aplicar deshabilitado durante la carga. | “No hay movimientos para el rango seleccionado”. Facets globales con ambas fechas null: “No hay fechas disponibles”; inputs vacíos siguen representando ausencia de filtros. | Error local a cada recurso según la política de fallos parciales; no ocultar recursos correctos del mismo rango. | Una sola fecha válida conserva el límite y omite el otro. Bloquear formato inválido, fechas invertidas o fuera de límites con los avisos comunes; mantener los resultados del rango previamente aplicado. Una sola fecha null en facets, o campos ausentes: “Rango disponible incompleto”. |

Fallos parciales del dashboard: si falla movimientos, mostrar “No se pudieron cargar los datos del rango seleccionado” en KPIs y gráficos, pero conservar alertas correctas del mismo rango. Si fallan alertas, mostrar “No se pudieron cargar las alertas” en su bloque y conservar KPIs y gráficos correctos. Un fallo de facets globales afecta a la referencia y a la aplicación de nuevos límites, no elimina resultados ya cargados. Nunca reutilizar datos del rango anterior como si fueran del nuevo.

### 5. Decisiones aplicadas (de verification.md)
- 1A: aplicación explícita con botón Aplicar; recargar movimientos y alertas y actualizar todos los KPIs y gráficos existentes.
- Conservar `start_date` y `end_date`: ya aceptados por `/api/metrics`, opcionales e inclusivos; `MetricsParams` refleja ese contrato.
- Facets sin movimientos: arrays vacíos y fechas null, no error ni fechas inventadas.
- Fechas inválidas: bloquear formato incorrecto, orden invertido o límites fuera del dataset antes de consultar.
- Fallos parciales: estados independientes para movimientos, alertas y facets; mostrar resultados válidos del mismo rango.

## Funcionalidad 2 — Tabla de alertas de anomalías

### 1. Propósito
Mostrar los períodos en los que el gasto supera el umbral configurado junto con el gasto, su media base y el incremento porcentual.

### 2. Componentes
- `AlertsSection`: coordina parámetros y resultados de alertas.
- `AlertThresholdControl`: input numérico del umbral y botón Aplicar umbral.
- `AlertsTable`: presenta las cuatro columnas de cada anomalía.

Situar `AlertsSection` debajo de los dos gráficos existentes. Dentro de este bloque, el control del umbral precede a la tabla. Implementar el control como input numérico, con valor inicial `0.3`, mínimo `0.01` y máximo `1.0` inclusivos. Mantener el valor en edición separado del umbral aplicado: editar no consulta la API. Pulsar **Aplicar umbral** valida el valor y recarga únicamente las alertas con el rango de fechas ya aplicado; no recarga KPIs ni gráficos. Aplicar nuevas fechas utiliza el umbral aplicado, no una edición sin confirmar. Los resultados y el mensaje vacío indican siempre el umbral confirmado.

El dashboard solicita `group_by=month`. Para cada período `t`, la API calcula `baseline = (outcome[t-1] + outcome[t-2] + outcome[t-3]) / 3` y `increase_ratio = (outcome[t] - baseline) / baseline`. Emite una alerta solo si el ratio sin redondear es estrictamente mayor que `threshold`. Las fechas filtran las alertas después del cálculo: se incluyen períodos que solapen el rango, con su gasto completo y con histórico previo al inicio seleccionado.

Los huecos internos del calendario entre el primer y último período del dataset cuentan como gasto cero. Los primeros tres períodos no son evaluables; tampoco un período con media cero. No se generan filas para esos casos ni se simulan períodos anteriores al comienzo del dataset. Mostrar una nota informativa general: “Las alertas requieren 3 períodos anteriores y una media mayor que cero”. La API no devuelve metadatos para atribuir cobertura insuficiente a períodos individuales.

### 3. Props de cada componente

| Nombre | Tipo | Obligatoria | Descripción |
|---|---|---|---|
| `AlertsSection.params` | `AlertsParams` | Sí | `threshold` en `0.01–1.0`, default `0.3`, `group_by=month` y el mismo rango aplicado al dashboard. |
| `AlertThresholdControl.value` | `NonNullable<AlertsParams['threshold']>` | Sí | Umbral numérico en edición, inicializado en `0.3`; no se aplica automáticamente. |
| `AlertThresholdControl.onApply` | `(threshold: NonNullable<AlertsParams['threshold']>) => void` | Sí | Confirma solo un valor válido al pulsar Aplicar umbral; recarga alertas con el rango aplicado. |
| `AlertsTable.alerts` | `AlertsResponse` | Sí | Lista de `AlertEntry` obtenida de `GET /api/metrics/alerts`; renderiza las columnas siguientes sin sustituir campos faltantes por cero. |

Columnas de `AlertsTable`:

| Columna | Tipo de dato | Formato de visualización |
|---|---|---|
| Período (`period`) | `string` | Mostrar el texto devuelto, por ejemplo `2025-12`; OpenAPI no confirma un formato fijo. |
| Outcome registrado (`outcome_total`) | `number` | `es-ES`, dos decimales y separadores de miles: `103378.98` se muestra como `103.378,98`; sin moneda. |
| Media móvil de los 3 períodos anteriores (`baseline_average`) | `number` | Media de exactamente tres gastos previos; `es-ES`, dos decimales sin moneda, por ejemplo `51.174,10`. |
| Incremento (`increase_ratio`) | `number` | Porcentaje `es-ES` con dos decimales; el ratio `1.0201` se muestra como `102,01 %`. |

### 4. Estados

| Cargando | Vacío | Error | Dato parcial o inválido |
|---|---|---|---|
| Se muestra el encabezado de la tabla y cuatro filas skeleton. | “No se detectaron anomalías para el umbral 0,30” para el valor aplicado `0.3`; usar siempre `es-ES` y dos decimales en el mensaje. | “No se pudieron cargar las alertas” en el bloque de alertas; conservar KPIs y gráficos válidos. | Campos incompletos: “No se pudieron mostrar algunas alertas por datos incompletos”, omitiendo filas inválidas sin simular un resultado vacío. Umbral fuera de rango: “El umbral debe estar entre 0,01 y 1,00”; no consultar ni aplicar el valor. |

Un input vacío o no numérico muestra “Introduce un umbral numérico entre 0,01 y 1,00” y no modifica el umbral aplicado. El control usa configuración regional `es-ES`; el modelo conserva un número, no un string formateado. Deshabilitar Aplicar umbral durante la carga y descartar respuestas anteriores si cambia el rango aplicado.

### 5. Decisiones aplicadas (de verification.md)
- `threshold` inválido: rechazo, sin ajuste silencioso; backend HTTP 422 fuera de `0.01–1.0`.
- 2A: conservar histórico anterior al filtro, calcular primero y filtrar alertas después.
- 3A: no generar alerta con menos de tres períodos previos o media cero; nota general de cobertura.
- 4A: períodos de calendario consecutivos; huecos internos con gasto cero.
- Control del umbral 1A: input numérico y confirmación explícita mediante Aplicar umbral, recargando solo alertas.
- Ubicación exigida por el brief: bloque de alertas bajo los gráficos existentes.
- Formato visible: `es-ES` para importes, porcentajes y umbral confirmado, incluidos mensajes de error y vacío.

## Funcionalidad 3 — Vista comparativa B2B vs B2C

### 1. Propósito
Comparar en paralelo las cinco categorías de ingresos principales de B2B y B2C y mostrar debajo el total de ingresos de cada grupo en un único gráfico.

### 2. Componentes
- `BusinessComparisonPage`: dispone los dos paneles en paralelo y el gráfico debajo; en pantallas estrechas apila los paneles.
- `ComparisonDateFilter`: dos inputs opcionales de fecha y botón Aplicar, propios de la comparativa.
- `AvailableDateRange`: referencia de fechas globales junto a los inputs de la comparativa.
- `BusinessCategoryPanel`: muestra la tabla de categorías de una línea de negocio.
- `BusinessComparisonChart`: compara los totales agregados de ingresos de B2B y B2C.

Acceso desde una navegación compartida con enlaces **Dashboard** (`/`) y **B2B vs B2C** (`/comparison`); marcar el enlace activo. La comparativa permite entrada directa por URL y retorno al dashboard. El despliegue de la SPA debe servir su punto de entrada al abrir directamente `/comparison`.

En la parte superior de `/comparison`, antes de ambos paneles, colocar los dos inputs de fecha, el rango disponible global y el botón **Aplicar**. El control no comparte el estado de fechas con el dashboard. `BusinessComparisonPage` conserva localmente el rango en edición; el rango aplicado se guarda en los parámetros de URL `start_date` y `end_date`, con formato `YYYY-MM-DD`. Al abrir o recargar la página se recuperan las fechas aplicadas desde la URL y se inicializan los inputs con ellas; un parámetro ausente significa límite sin definir.

Editar un input no cambia la URL ni consulta la API. Pulsar Aplicar valida según las reglas comunes, confirma el rango, añade una entrada al historial del navegador y recarga los dos rankings, las facets de cada grupo y los totales con las mismas fechas. Una sola fecha aplica solo ese límite; ambos inputs vacíos eliminan ambos parámetros. La referencia global junto a los inputs se obtiene de facets sin filtros, separada de las consultas filtradas de cada panel.

Atrás/Adelante restaura el rango de la URL visitada tanto en el estado aplicado como en los inputs, descartando ediciones no confirmadas, y vuelve a cargar los recursos para ese rango. No añadir otra entrada al historial al restaurar. Validar también las fechas recuperadas de la URL: si son inválidas, mostrar el aviso correspondiente sin consultar datos ni mostrar resultados anteriores como si pertenecieran a esa URL.

Para el rango aplicado, obtener los totales mediante `GET /api/metrics/income/totals`, las tablas con `GET /api/metrics/categories/top?operation_type=income&limit=5&business_type=[grupo]` y las categorías disponibles con `GET /api/metrics/facets?operation_type=income&business_type=[grupo]`, añadiendo las mismas fechas en todas las consultas. No usar la lista global de categorías como si fuera específica de un panel.

### 3. Props de cada componente

| Nombre | Tipo | Obligatoria | Descripción |
|---|---|---|---|
| `ComparisonDateFilter.value` | `DateRangeFilter` | Sí | Rango local en edición, inicializado desde el rango aplicado en la URL. |
| `ComparisonDateFilter.onApply` | `(filter: DateRangeFilter) => void` | Sí | Confirma el rango al pulsar Aplicar; actualiza la URL y recarga todos los recursos comparativos. |
| `AvailableDateRange.facets` | `FacetsResponse` | Sí | Facets globales para mostrar el rango disponible junto a los inputs, no el rango filtrado de un panel. |
| `BusinessComparisonPage.b2bFacets` | `FacetsResponse` | No | Facets B2B del rango; pueden faltar mientras cargan o si falla ese recurso. |
| `BusinessComparisonPage.b2cFacets` | `FacetsResponse` | No | Facets B2C del rango; pueden faltar mientras cargan o si falla ese recurso. |
| `BusinessComparisonPage.params` | `TopCategoriesParams` | Sí | Solicita `operation_type: 'income'`, `limit: 5`, el rango de fechas y `business_type` para cada grupo. |
| `BusinessComparisonPage.totals` | `IncomeTotalsResponse` | No | Dos totales del rango; ausentes durante carga/error. No bloquear rankings válidos por su ausencia. |
| `BusinessCategoryPanel.businessType` | `BusinessType` | Sí | Identifica el panel como `B2B` o `B2C`. |
| `BusinessCategoryPanel.entries` | `TopCategoriesResponse` | Sí | Categorías recibidas de `/api/metrics/categories/top`; cada fila usa `category` y `total_amount`, y calcula su porcentaje respecto al total del grupo. |
| `BusinessCategoryPanel.availableCategories` | `FacetsResponse['categories']` | No | Categorías del grupo y rango, mostradas en una lista separada del top 5; ausencia no equivale a lista vacía. |
| `BusinessCategoryPanel.groupTotalIncome` | `IncomeTotalEntry['total_income']` | No | Denominador del grupo; sin él se muestran categorías e importes pero no porcentajes calculados. |
| `BusinessComparisonChart.totals` | `IncomeTotalsResponse` | Sí | Punto B2B y punto B2C identificados por `business_type`, con valor `total_income`. |

El gráfico contiene dos puntos: B2B representa el total agregado de ingresos de esa línea de negocio y B2C representa el total agregado de la otra. No se deben derivar esos totales sumando solo el top 5, ni sustituir un total ausente por cero.

Cada porcentaje de categoría es `100 * total_amount / total_income` del mismo grupo y rango, en `es-ES` con dos decimales. Si el total es cero, no dividir por cero: mostrar “No aplicable” si existe una fila. Un cero confirmado es un punto válido cuando al menos un ranking tiene categorías. Si ambos rankings se recibieron correctamente y están vacíos, prevalece “No hay ingresos comparables para el rango seleccionado”: no dibujar dos ceros. Un ranking fallido o inválido no cuenta como vacío.

Los importes de las tablas y los valores visibles del gráfico, incluidas etiquetas y tooltips, usan formato numérico español (`es-ES`), separadores de miles y exactamente dos decimales: `1132097.38` se muestra como `1.132.097,38`. No añadir símbolo ni código de moneda, ni abreviar como miles o millones: la API no identifica una moneda. El formato de visualización no modifica los números usados para cálculos.

### 4. Estados

| Cargando | Vacío | Error | Dato parcial o inválido |
|---|---|---|---|
| Se muestran dos paneles con skeletons de tabla y un skeleton para el gráfico. | Si la lista de un panel está vacía, ese panel muestra “No hay categorías de ingresos para B2B en el rango seleccionado” o “No hay categorías de ingresos para B2C en el rango seleccionado”, según corresponda; el otro panel sigue visible. Si ambas están vacías, el gráfico muestra “No hay ingresos comparables para el rango seleccionado”. | Se muestra “No se pudo cargar la comparación B2B/B2C”; no se reemplaza un fallo de petición por tablas vacías. | Si solo una lista está vacía, su panel muestra el mensaje vacío y el otro conserva sus filas. Si falta uno de los totales agregados, el gráfico indica “Total B2B no disponible” o “Total B2C no disponible” y no inventa el punto faltante. Si faltan campos de una fila, se omite esa fila y se informa “Hay categorías con datos incompletos”. |

Deshabilitar Aplicar durante la recarga comparativa. Los paneles y gráfico muestran siempre el mismo rango aplicado, nunca la edición no confirmada; ignorar respuestas antiguas y mantener el rango aplicado en la URL aunque falle una petición.

Política de fallos parciales de la comparativa:
- Ranking de un grupo fallido: mostrar “No se pudieron cargar las categorías de ingresos de [grupo]” solo en ese panel; conservar el ranking correcto del otro grupo.
- Totales fallidos: conservar las filas de rankings correctos con importes; mostrar “Porcentaje no disponible” en lugar de calcular porcentajes y “No se pudieron cargar los totales comparativos” en el gráfico. No usar la suma del top 5 como sustituto.
- Ranking fallido pero totales válidos: el gráfico puede mostrar ambos totales confirmados; el error del ranking permanece en su panel. No deducir que el grupo tiene cero ingresos.
- Facets de un grupo fallidas: mostrar “No se pudieron cargar las categorías disponibles de [grupo]” y conservar su ranking correcto. El estado vacío del panel depende de la respuesta correcta del ranking, no de facets.
- Facets globales fallidas: mostrar el error junto a los inputs y bloquear nuevos filtros no vacíos que no puedan validarse; conservar resultados correctos del rango ya validado. Cada recurso mantiene su estado de carga/error independiente.
- Campos inválidos: no sustituirlos por cero ni interpretar filas descartadas como un ranking vacío confirmado.

Mostrar en cada panel, antes de su tabla top 5, una lista independiente con el encabezado “Categorías disponibles”. Usar exclusivamente `categories` de las facets de ingresos de ese grupo y rango aplicado; no completar ni modificar las filas del ranking con esta lista. Por ejemplo, mostrar “Categorías disponibles: others, sales” si esas son las categorías recibidas. La lista es informativa: no añadir un filtro ni elementos seleccionables.

Mientras cargan esas facets, mostrar “Cargando categorías disponibles…”. Si la respuesta correcta contiene `categories: []`, mostrar “No hay categorías disponibles para este grupo en el rango seleccionado”. Si falla la consulta, mostrar “No se pudieron cargar las categorías disponibles de [grupo]”, sin ocultar el ranking correcto. No mostrar categorías de un rango anterior ni interpretar un campo ausente como una lista vacía.

### 5. Decisiones aplicadas (de verification.md)
- 5A: `/api/metrics/income/totals` devuelve ambas entradas `{ business_type, total_income }`, con cero para un grupo sin ingresos.
- 6A: facets filtrables por grupo, income y rango, con fechas null si el conjunto queda vacío.
- 7A: rutas `/` y `/comparison` con enlaces Dashboard y B2B vs B2C.
- Control comparativo 2A: inputs propios de fechas en la parte superior con botón Aplicar.
- Persistencia comparativa 3B: rango aplicado en la URL y rango en edición local a la página.
- Formato de importes 4A: números en `es-ES`, dos decimales, sin símbolo de moneda en tablas y gráfico.
- Bloquear fechas inválidas también en `/comparison`, incluidas fechas recuperadas de URL.
- Gráfico vacío: priorizar mensaje cuando ambos rankings correctos están vacíos, incluso con totales cero.
- Fallos parciales: conservar resultados correctos del mismo rango y mostrar errores por recurso; no calcular porcentajes sin total.
- Historial: Atrás/Adelante restaura las fechas de la URL y recarga, sin crear entradas adicionales.
- Categorías de facets B: lista informativa visible en cada panel, separada del ranking y sin controles de filtrado.