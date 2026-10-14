# Especificación de componentes

La interacción y navegación descritas son especificaciones para implementar en React. El backend conserva su contrato existente; los datos derivados que no expone se calculan en frontend o quedan como pregunta al PM.

Reglas comunes de fechas para dashboard y comparativa: validar las fechas del calendario en formato `YYYY-MM-DD`, el orden cuando ambos límites estén presentes y cada límite rellenado contra `min_date` / `max_date` de las facets globales. Ambos vacíos siguen significando sin filtros. Si un límite está invertido o fuera del rango, bloquear Aplicar y no consultar los recursos de datos ni cambiar el rango aplicado o la URL. No ajustar fechas silenciosamente.

- Formato o fecha de calendario inválidos: “Formato de fecha incorrecto, utilizar el formato YYYY-MM-DD”.
- Inicio posterior al fin: “La fecha de inicio es posterior a la fecha de fin. El rango de fecha indicado no es correcto, por favor, seleccione un rango de fechas entre [min_date] y [max_date]”.
- Límite fuera del dataset: “El rango de fecha indicado está fuera de las fechas disponibles, por favor, seleccione un rango de fechas entre [min_date] y [max_date]”.
- Si faltan las facets globales necesarias para validar límites no vacíos, bloquear su aplicación con “No se pudo cargar el rango disponible”. `min_date` y `max_date` son fechas requeridas en la respuesta actual; la API no define el caso de un conjunto vacío.

Todos los números visibles usan `es-ES`. Importes, porcentajes y umbral confirmado se presentan con dos decimales; sin moneda para importes. Fechas de los parámetros mantienen `YYYY-MM-DD` y los valores enviados a la API conservan su representación técnica, por ejemplo `threshold=0.3`.

## Funcionalidad 1 — Filtro de rango de fechas en el dashboard principal

### 1. Propósito
Permitir filtrar los datos del dashboard por una fecha inicial, una fecha final o ambas, mostrando al usuario el rango disponible en el dataset.

### 2. Componentes
- `DashboardDateFilter`: presenta los inputs opcionales de inicio y fin.
- `AvailableDateRange`: presenta el rango disponible obtenido de facets.

Situar los controles de fecha en la parte superior del dashboard, antes de los KPIs y gráficos. `AvailableDateRange` se muestra junto a los dos inputs, dentro del mismo bloque de controles; en móvil puede ocupar la línea inmediatamente siguiente, sin trasladarse a otra sección.

Los inputs mantienen un rango en edición separado del rango aplicado. Cambiar un input no consulta la API. Al pulsar **Aplicar**, se valida el formato y se envían únicamente los límites rellenados a `GET /api/metrics` para los KPIs y gráficos. Las alertas requeridas por el PM se recalculan en frontend desde movimientos completos obtenidos sin fechas, preservando el histórico anterior al rango; con ambos límites vacíos se omiten los parámetros.

Cada aplicación recarga los movimientos del rango y recalcula ingresos, gastos, beneficio, margen y los datos mensuales de los dos gráficos existentes; también vuelve a filtrar las alertas ya calculadas desde el histórico completo. La etiqueta del encabezado refleja el rango aplicado. La referencia de fechas disponibles procede de facets globales, que no admiten filtros. No mezclar resultados de distintos rangos: ignorar respuestas de peticiones anteriores y no presentar datos antiguos como actuales si falla la carga.

### 3. Props de cada componente

| Nombre | Tipo | Obligatoria | Descripción |
|---|---|---|---|
| `DashboardDateFilter.value` | `DateRangeFilter` | Sí | Rango en edición. Una sola fecha funciona como límite unilateral inclusivo; la otra se omite. |
| `DashboardDateFilter.onApply` | `(filter: MetricsParams) => void` | Sí | Notifica el rango confirmado solo al pulsar Aplicar para recargar todos los datos del dashboard. |
| `AvailableDateRange.facets` | `FacetsResponse` | Sí | Facets globales: mostrar “Rango disponible: [min_date] – [max_date]” en `YYYY-MM-DD`. |

### 4. Estados

| Cargando | Vacío | Error | Dato parcial o inválido |
|---|---|---|---|
| “Cargando rango disponible…” durante facets; skeletons de KPIs, gráficos y alertas al aplicar; botón Aplicar deshabilitado durante la carga. | “No hay movimientos para el rango seleccionado”. La API actual requiere fechas en facets; inputs vacíos siguen representando ausencia de filtros. | Error local a cada recurso según la política de fallos parciales; no ocultar recursos correctos del mismo rango. | Una sola fecha válida conserva el límite y omite el otro. Bloquear formato inválido, fechas invertidas o fuera de límites con los avisos comunes; mantener los resultados del rango previamente aplicado. Campos de fecha ausentes o inválidos en facets: “Rango disponible incompleto”. |

Fallos parciales del dashboard: si falla movimientos, mostrar “No se pudieron cargar los datos del rango seleccionado” en KPIs y gráficos, pero conservar alertas correctas del mismo rango. Si fallan alertas, mostrar “No se pudieron cargar las alertas” en su bloque y conservar KPIs y gráficos correctos. Un fallo de facets globales afecta a la referencia y a la aplicación de nuevos límites, no elimina resultados ya cargados. Nunca reutilizar datos del rango anterior como si fueran del nuevo.

### 5. Decisiones aplicadas (de verification.md)
- 1A: aplicación explícita con botón Aplicar; recargar movimientos del rango, actualizar KPIs y gráficos, y filtrar las alertas calculadas desde el histórico completo.
- Conservar `start_date` y `end_date`: ya aceptados por `/api/metrics`, opcionales e inclusivos; `MetricsParams` refleja ese contrato.
- Facets devuelve fechas globales requeridas; no se documenta respuesta para un conjunto vacío.
- Fechas inválidas: bloquear formato incorrecto, orden invertido o límites fuera del dataset antes de consultar.
- Fallos parciales: estados independientes para movimientos, alertas y facets; mostrar resultados válidos del mismo rango.

## Funcionalidad 2 — Tabla de alertas de anomalías

### 1. Propósito
Mostrar los períodos en los que el gasto supera el umbral configurado junto con el gasto, su media base y el incremento porcentual.

### 2. Componentes
- `AlertsSection`: coordina parámetros y resultados de alertas.
- `AlertThresholdControl`: input numérico del umbral y botón Aplicar umbral.
- `AlertsTable`: presenta las cuatro columnas de cada anomalía.

Situar `AlertsSection` debajo de los dos gráficos existentes. Dentro de este bloque, el control del umbral precede a la tabla. Implementar el control como input numérico, con valor inicial `0.3`, mínimo `0.01` y máximo `1.0` inclusivos según el brief. Mantener el valor en edición separado del umbral aplicado: editar no consulta la API. Pulsar **Aplicar umbral** valida el valor y recalcula alertas en frontend usando el histórico completo de movimientos; no recarga KPIs ni gráficos. Aplicar nuevas fechas utiliza el umbral aplicado, no una edición sin confirmar. Los resultados y el mensaje vacío indican siempre el umbral confirmado.

La API actual acepta `threshold` con default `0.3`, mínimo `0` y sin máximo declarado. Agrupa con `group_by=day|week|month`, y filtra movimientos por `start_date`, `end_date` y `business_type` antes de generar el resumen. Su baseline es la media de todos los períodos anteriores presentes; no completa huecos del calendario. Este comportamiento no implementa la media móvil pedida. No usar `GET /api/metrics/alerts` como resultado de las alertas del PM.

El dashboard agrupa por mes. Para cada período `t`, frontend calcula `baseline = (outcome[t-1] + outcome[t-2] + outcome[t-3]) / 3` e `increase_ratio = (outcome[t] - baseline) / baseline`. Emite alerta solo si el ratio sin redondear supera estrictamente `threshold`. Los huecos internos entre el primer y último período cuentan como cero; no se inventa histórico anterior al dataset. Los primeros tres períodos y cualquier baseline cero no son evaluables. Calcular con movimientos completos obtenidos sin fechas y filtrar las alertas por períodos que solapen el rango aplicado. Mostrar la nota general: “Las alertas requieren 3 períodos anteriores y una media mayor que cero”.

### 3. Props de cada componente

| Nombre | Tipo | Obligatoria | Descripción |
|---|---|---|---|
| `AlertsSection.params` | `AlertsParams` | Sí | `threshold` en `0.01–1.0`, default `0.3`, `group_by=month` y el mismo rango aplicado al dashboard. |
| `AlertsSection.movements` | `FinancialMovement[]` | Sí | Histórico completo cargado sin límites de fecha; base para la agregación y cálculo client-side de alertas. |
| `AlertThresholdControl.value` | `NonNullable<AlertsParams['threshold']>` | Sí | Umbral numérico en edición, inicializado en `0.3`; no se aplica automáticamente. |
| `AlertThresholdControl.onApply` | `(threshold: NonNullable<AlertsParams['threshold']>) => void` | Sí | Confirma solo un valor válido al pulsar Aplicar umbral; recalcula alertas desde los movimientos completos ya cargados. |
| `AlertsTable.alerts` | `AlertsResponse` | Sí | Lista de entradas con la forma `AlertEntry`, calculada en frontend con los movimientos completos; renderiza las columnas sin sustituir campos faltantes por cero. |

Columnas de `AlertsTable`:

| Columna | Tipo de dato | Formato de visualización |
|---|---|---|
| Período (`period`) | `string` | Mostrar el texto devuelto, por ejemplo `2025-12`; OpenAPI no confirma un formato fijo. |
| Outcome registrado (`outcome_total`) | `number` | `es-ES`, dos decimales y separadores de miles: `103378.98` se muestra como `103.378,98`; sin moneda. |
| Media móvil de los 3 períodos anteriores (`baseline_average`) | `number` | Media calculada en frontend de exactamente tres gastos previos; `es-ES`, dos decimales sin moneda. |
| Incremento (`increase_ratio`) | `number` | Porcentaje `es-ES` con dos decimales; el ratio `1.0201` se muestra como `102,01 %`. |

### 4. Estados

| Cargando | Vacío | Error | Dato parcial o inválido |
|---|---|---|---|
| Se muestra el encabezado de la tabla y cuatro filas skeleton. | “No se detectaron anomalías para el umbral 0,30” para el valor aplicado `0.3`; usar siempre `es-ES` y dos decimales en el mensaje. | “No se pudieron cargar las alertas” en el bloque de alertas; conservar KPIs y gráficos válidos. | Campos incompletos: “No se pudieron mostrar algunas alertas por datos incompletos”, omitiendo filas inválidas sin simular un resultado vacío. Umbral fuera de rango: “El umbral debe estar entre 0,01 y 1,00”; no consultar ni aplicar el valor. |

Un input vacío o no numérico muestra “Introduce un umbral numérico entre 0,01 y 1,00” y no modifica el umbral aplicado. El control usa configuración regional `es-ES`; el modelo conserva un número, no un string formateado. Deshabilitar Aplicar umbral durante la carga y descartar respuestas anteriores si cambia el rango aplicado.

### 5. Decisiones aplicadas (de verification.md)
- `threshold` inválido: la UI rechaza valores fuera de `0.01–1.0` según el brief; el endpoint acepta cualquier número no negativo y no declara máximo.
- 2A: conservar histórico anterior al filtro, calcular primero y filtrar alertas después en frontend; el endpoint actual filtra antes de resumir.
- 3A: no generar alerta con menos de tres períodos previos o media cero; nota general de cobertura, calculado en frontend.
- 4A: períodos de calendario consecutivos; huecos internos con gasto cero, calculado en frontend.
- Control del umbral 1A: input numérico y confirmación explícita mediante Aplicar umbral, recalculando solo alertas.
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

Editar un input no cambia la URL ni consulta la API. Pulsar Aplicar valida según las reglas comunes, confirma el rango, añade una entrada al historial del navegador y recarga los dos rankings y los movimientos B2B/B2C con las mismas fechas. Una sola fecha aplica solo ese límite; ambos inputs vacíos eliminan ambos parámetros. La referencia global junto a los inputs se obtiene de facets sin filtros, separada de las consultas filtradas de cada panel.

Atrás/Adelante restaura el rango de la URL visitada tanto en el estado aplicado como en los inputs, descartando ediciones no confirmadas, y vuelve a cargar los recursos para ese rango. No añadir otra entrada al historial al restaurar. Validar también las fechas recuperadas de la URL: si son inválidas, mostrar el aviso correspondiente sin consultar datos ni mostrar resultados anteriores como si pertenecieran a esa URL.

Para el rango aplicado, obtener las tablas con `GET /api/metrics/categories/top?operation_type=income&limit=5&business_type=[grupo]` y movimientos completos del grupo con `GET /api/metrics/b2b` o `GET /api/metrics/b2c`, añadiendo las mismas fechas. Calcular desde los movimientos el total de ingresos y las categorías disponibles. No enviar filtros a facets ni presentar sus categorías globales como específicas de un panel.

### 3. Props de cada componente

| Nombre | Tipo | Obligatoria | Descripción |
|---|---|---|---|
| `ComparisonDateFilter.value` | `DateRangeFilter` | Sí | Rango local en edición, inicializado desde el rango aplicado en la URL. |
| `ComparisonDateFilter.onApply` | `(filter: DateRangeFilter) => void` | Sí | Confirma el rango al pulsar Aplicar; actualiza la URL y recarga todos los recursos comparativos. |
| `AvailableDateRange.facets` | `FacetsResponse` | Sí | Facets globales para mostrar el rango disponible junto a los inputs, no el rango filtrado de un panel. |
| `BusinessComparisonPage.params` | `TopCategoriesParams` | Sí | Solicita `operation_type: 'income'`, `limit: 5`, el rango de fechas y `business_type` para cada grupo. |
| `BusinessComparisonPage.b2bMovements` | `FinancialMovement[]` | Sí | Movimientos B2B del rango, usados para derivar total de ingresos y categorías disponibles. |
| `BusinessComparisonPage.b2cMovements` | `FinancialMovement[]` | Sí | Movimientos B2C del rango, usados para derivar total de ingresos y categorías disponibles. |
| `BusinessCategoryPanel.businessType` | `BusinessType` | Sí | Identifica el panel como `B2B` o `B2C`. |
| `BusinessCategoryPanel.entries` | `TopCategoriesResponse` | Sí | Categorías recibidas de `/api/metrics/categories/top`; cada fila usa `category` y `total_amount`, y calcula su porcentaje respecto al total del grupo. |
| `BusinessCategoryPanel.availableCategories` | `Category[]` | Sí | Categorías de ingreso derivadas de los movimientos del grupo y rango, mostradas separadas del top 5. |
| `BusinessCategoryPanel.groupTotalIncome` | `number` | Sí | Total calculado con todos los movimientos de ingreso del grupo, no solo el top 5. |
| `BusinessComparisonChart.totals` | `{ B2B: number; B2C: number }` | Sí | Totales de ingreso calculados en frontend a partir de todos los movimientos de cada grupo. |

El gráfico contiene dos puntos: B2B representa la suma de todos sus movimientos de ingreso y B2C la suma de los suyos. No se deben derivar esos totales sumando solo el top 5. Si falla la carga de movimientos de un grupo, mostrar su total como no disponible, no como cero.

Cada porcentaje de categoría es `100 * total_amount / total_income` del mismo grupo y rango, en `es-ES` con dos decimales. Si el total es cero, no dividir por cero: mostrar “No aplicable” si existe una fila. Un cero confirmado es un punto válido cuando al menos un ranking tiene categorías. Si ambos rankings se recibieron correctamente y están vacíos, prevalece “No hay ingresos comparables para el rango seleccionado”: no dibujar dos ceros. Un ranking fallido o inválido no cuenta como vacío.

Los importes de las tablas y los valores visibles del gráfico, incluidas etiquetas y tooltips, usan formato numérico español (`es-ES`), separadores de miles y exactamente dos decimales: `1132097.38` se muestra como `1.132.097,38`. No añadir símbolo ni código de moneda, ni abreviar como miles o millones: la API no identifica una moneda. El formato de visualización no modifica los números usados para cálculos.

### 4. Estados

| Cargando | Vacío | Error | Dato parcial o inválido |
|---|---|---|---|
| Se muestran dos paneles con skeletons de tabla y un skeleton para el gráfico. | Si la lista de un panel está vacía, ese panel muestra “No hay categorías de ingresos para B2B en el rango seleccionado” o “No hay categorías de ingresos para B2C en el rango seleccionado”, según corresponda; el otro panel sigue visible. Si ambos grupos no tienen ingresos, el gráfico muestra “No hay ingresos comparables para el rango seleccionado”. | Se muestra “No se pudo cargar la comparación B2B/B2C”; no se reemplaza un fallo de petición por tablas vacías. | Si solo una lista está vacía, su panel muestra el mensaje vacío y el otro conserva sus filas. Si falla la carga de movimientos de un grupo, el gráfico indica “Total B2B no disponible” o “Total B2C no disponible”. Si faltan campos de una fila, se omite esa fila y se informa “Hay categorías con datos incompletos”. |

Deshabilitar Aplicar durante la recarga comparativa. Los paneles y gráfico muestran siempre el mismo rango aplicado, nunca la edición no confirmada; ignorar respuestas antiguas y mantener el rango aplicado en la URL aunque falle una petición.

Política de fallos parciales de la comparativa:
- Ranking de un grupo fallido: mostrar “No se pudieron cargar las categorías de ingresos de [grupo]” solo en ese panel; conservar el ranking correcto del otro grupo.
- Movimientos del grupo fallidos: conservar filas del ranking correcto con importes, mostrar “Porcentaje no disponible” y el total como no disponible. No usar la suma del top 5 como sustituto.
- Ranking fallido pero movimientos válidos: el gráfico y la lista de categorías pueden usar los movimientos confirmados; el error del ranking permanece en su panel.
- Facets globales fallidas: mostrar el error junto a los inputs y bloquear nuevos rangos no vacíos que no puedan validarse; no afectan los datos de los paneles. Facets no se consulta por grupo.
- Campos inválidos: no sustituirlos por cero ni interpretar filas descartadas como un ranking vacío confirmado.

Mostrar en cada panel, antes de su tabla top 5, una lista independiente con el encabezado “Categorías disponibles”. Derivarla de los movimientos de ingreso de ese grupo y rango aplicado; no completar ni modificar las filas del ranking con esta lista. Por ejemplo, mostrar “Categorías disponibles: others, sales” si esas son las categorías recibidas. La lista es informativa: no añadir un filtro ni elementos seleccionables.

Mientras cargan esos movimientos, mostrar “Cargando categorías disponibles…”. Si la respuesta correcta no contiene movimientos de ingreso, mostrar “No hay categorías disponibles para este grupo en el rango seleccionado”. Si falla la consulta, mostrar “No se pudieron cargar las categorías disponibles de [grupo]”, sin ocultar el ranking correcto. No mostrar categorías de un rango anterior ni interpretar una respuesta fallida como una lista vacía.

### 5. Decisiones aplicadas (de verification.md)
- 5A: calcular en frontend los totales de cada grupo sumando sus movimientos de ingreso; no se añade endpoint agregado.
- 6A: facets permanece global y sin filtros; derivar categorías disponibles por grupo desde sus movimientos.
- 7A: rutas `/` y `/comparison` con enlaces Dashboard y B2B vs B2C.
- Control comparativo 2A: inputs propios de fechas en la parte superior con botón Aplicar.
- Persistencia comparativa 3B: rango aplicado en la URL y rango en edición local a la página.
- Formato de importes 4A: números en `es-ES`, dos decimales, sin símbolo de moneda en tablas y gráfico.
- Bloquear fechas inválidas también en `/comparison`, incluidas fechas recuperadas de URL.
- Gráfico vacío: priorizar mensaje cuando ambos rankings correctos están vacíos, incluso con totales cero.
- Fallos parciales: conservar resultados correctos del mismo rango y mostrar errores por recurso; no calcular porcentajes sin total.
- Historial: Atrás/Adelante restaura las fechas de la URL y recarga, sin crear entradas adicionales.
- Categorías disponibles: lista informativa derivada de los movimientos de cada grupo, separada del ranking y sin controles de filtrado.