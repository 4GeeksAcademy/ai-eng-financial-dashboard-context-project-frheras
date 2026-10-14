# Guía para una sesión nueva

Empieza por el [pedido original del PM](pm-brief.md), contrástalo con las [afirmaciones y decisiones verificadas](verification.md) y consulta la [especificación de componentes](components.md). Las rutas indicadas como verificadas y las pendientes están separadas explícitamente. No trates las filas ficticias de prueba como contrato de API.

Esta especificación separa el contrato existente de la API de los requisitos de UI pendientes. No se modifica el backend para implementar el brief; los datos derivados que no entrega la API se calculan en frontend o se dejan como pregunta al PM. Botón Aplicar, navegación y componentes React son especificaciones, no UI implementada. Consultar [verification.md](verification.md) para el contrato y la validación.

## Funcionalidad 1 — Filtro de rango de fechas

**Requisito PM:** [Funcionalidad 1 en pm-brief.md](pm-brief.md): filtrar el dashboard por fechas opcionales y mostrar el rango disponible.

**Endpoints**
- `GET /api/metrics/facets` — ruta verificada; devuelve facetas globales y el rango completo, sin parámetros de filtro.
- `GET /api/metrics` — ruta verificada; acepta `start_date` y `end_date` opcionales e inclusivos. Cada límite funciona por separado.
- Para cumplir la regla del PM sobre histórico anterior al rango, obtener movimientos completos con `GET /api/metrics` sin fechas y calcular las alertas en frontend; el filtro temporal de las alertas se aplica después del cálculo.

**Tipos**
- Facetas: [`FacetsResponse`](api-types.ts#L8).
- Fechas y movimientos: `DateRangeFilter` y `MetricsParams` en [param-types.ts](param-types.ts).

**Parámetros y restricciones**
- Las fechas del pedido deben tener formato `YYYY-MM-DD` y ambas pueden estar vacías. `DateRangeFilter` modela `start_date` y `end_date` opcionales para rutas que las declaran.
- En facets, `min_date` y `max_date` son fechas requeridas en formato `YYYY-MM-DD`; la ruta no admite parámetros y describe el conjunto global generado por el backend.
- `/api/metrics` acepta también `category` (las categorías verificadas) y `operation_type` (`income`, `outcome`), opcionales. Para filtrar todos los movimientos del dashboard omitir esos filtros adicionales.
- Decisión 1A: editar fechas no consulta la API. Pulsar Aplicar recarga movimientos del rango, recalcula KPIs/gráficos y vuelve a filtrar las alertas calculadas desde el histórico completo. Actualiza la etiqueta del rango. Descartar respuestas antiguas; no mezclar recursos de distintos rangos.
- Ubicación: controles de fechas en la parte superior del dashboard, antes de KPIs y gráficos; rango disponible junto a los inputs (línea siguiente dentro del mismo bloque en móvil).

**Casos límite y UI**
- Solo hay fecha inicial o solo fecha final: conservar el límite seleccionado y mostrarlo como “Desde [fecha]” o “Hasta [fecha]”; dejar el otro input vacío y omitir ese parámetro al pulsar Aplicar. `/api/metrics` filtra cada límite inclusivo de forma independiente.
- Formato inválido: “Formato de fecha incorrecto, utilizar el formato YYYY-MM-DD”; bloquear aplicación.
- Inicio posterior al fin: “La fecha de inicio es posterior a la fecha de fin. El rango de fecha indicado no es correcto, por favor, seleccione un rango de fechas entre [min_date] y [max_date]”; no consultar.
- Límites fuera del dataset: “El rango de fecha indicado está fuera de las fechas disponibles, por favor, seleccione un rango de fechas entre [min_date] y [max_date]”; no consultar ni ajustar silenciosamente. Estas son decisiones de UI, no nuevas validaciones backend.
- No hay movimientos para el rango válido: mostrar “No hay movimientos para el rango seleccionado”. La ruta de facetas devuelve fechas obligatorias y no especifica una respuesta vacía.

## Funcionalidad 2 — Alertas de anomalías

**Requisito PM:** [Funcionalidad 2 en pm-brief.md](pm-brief.md): mostrar períodos de gasto anómalo, configurar el umbral y conservar un estado vacío explícito.

**Endpoints**
- `GET /api/metrics/alerts` — ruta existente, pero su agregación no cumple la media móvil de tres períodos solicitada por el PM. La UI debe calcular las alertas desde el histórico completo de movimientos.

**Tipos**
- Parámetros: `AlertsParams` y `DateRangeFilter` en [param-types.ts](param-types.ts).
- Respuesta: [`AlertsResponse`](api-types.ts#L63) y [`AlertEntry`](api-types.ts#L38).

**Parámetros y restricciones**
- Contrato API actual de `threshold`: opcional, número, default `0.3`, mínimo `0` y sin máximo declarado; valores negativos reciben HTTP 422. La UI limita su input a `0.01–1.0` por el brief y calcula las alertas requeridas en frontend.
- `group_by`: opcional; `day`, `week`, `month`; default `month`. El dashboard usa `month`; `AlertsParams` incluye este parámetro.
- `start_date` y `end_date`: opcionales, formato `YYYY-MM-DD`; filtran los movimientos antes de resumir. La API no conserva histórico anterior al inicio del rango.
- `business_type`: opcional; valores `B2B` o `B2C`.
- La respuesta incluye `period`, `outcome_total`, `baseline_average` e `increase_ratio`. En el backend actual, `baseline_average` usa todos los períodos anteriores presentes en el resumen ya filtrado por fecha; no rellena huecos del calendario. No presentar esa respuesta como la regla de tres períodos del PM.

**Control y ubicación**
- El bloque completo de alertas va debajo de los gráficos existentes. Antes de la tabla colocar un input numérico de umbral, valor inicial `0.3`, mínimo `0.01`, máximo `1.0`, y botón Aplicar umbral.
- Mantener edición y umbral aplicado separados. Confirmar con Aplicar umbral recalcula únicamente alertas usando los movimientos completos ya cargados; editar no consulta la API. Los mensajes de resultados usan el umbral aplicado, no el que aún se está editando.

**Regla exacta**
- Media del gasto de los tres períodos calendario inmediatamente anteriores, sin incluir el actual. Huecos internos del histórico se rellenan con cero; no se inventa histórico anterior al dataset.
- Ratio `(gasto_actual - media) / media`; emitir únicamente si supera estrictamente el umbral. No emitir con menos de tres períodos previos o media cero.
- Calcular antes de filtrar las alertas por fechas, usando histórico anterior al inicio. Mostrar períodos que solapen el rango y sus gastos completos, no gastos recortados a días parciales. Ver [la regla y evidencia](verification.md).

**Casos límite y UI**
- `threshold` menor que `0.01` o mayor que `1.0`: mostrar “El umbral debe estar entre 0,01 y 1,00” y no calcular hasta corregirlo. Es el límite del control UI según el PM; no es el rango validado por el endpoint actual.
- No hay alertas para el umbral actual: mantener la tabla y mostrar “No se detectaron anomalías para el umbral 0,30” para el umbral aplicado `0.3`; usar siempre dos decimales y `es-ES`.
- Histórico insuficiente o media cero: el cálculo frontend no genera esas alertas. Mantener la nota general “Las alertas requieren 3 períodos anteriores y una media mayor que cero”. La API no identifica períodos no evaluables; no inferirlos a partir de una lista vacía.

## Funcionalidad 3 — Comparativa B2B vs B2C

**Requisito PM:** [Funcionalidad 3 en pm-brief.md](pm-brief.md): dos tablas paralelas con las cinco categorías principales y un gráfico comparativo de ingresos por línea de negocio.

**Endpoints**
- `GET /api/metrics/categories/top` — ruta verificada; una consulta real con `operation_type=income&limit=5` respondió HTTP 200 con dos categorías.
- `GET /api/metrics/b2b` y `GET /api/metrics/b2c` — devuelven movimientos por grupo y admiten rango, categoría y operación.
- `GET /api/metrics/facets` — ruta global sin filtros; no permite consultar categorías por línea de negocio.

**Tipos**
- Parámetros: `TopCategoriesParams`, `MetricsParams` y `DateRangeFilter` en [param-types.ts](param-types.ts).
- Respuesta de ranking: [`TopCategoriesResponse`](api-types.ts#L93) y [`CategoryEntry`](api-types.ts#L73).
- Valores de grupo: [`BusinessType`](api-types.ts#L2); categorías disponibles: [`FacetsResponse`](api-types.ts#L8) y [`Category`](api-types.ts#L3); operación: [`OperationType`](api-types.ts#L1).
- Totales completos y categorías disponibles por grupo: calcularlos en frontend a partir de los movimientos B2B/B2C; no existe un endpoint agregado para esos datos.

**Parámetros y restricciones**
- `operation_type`: opcional; `income` o `outcome`; default API `outcome`. Para esta funcionalidad se solicita `income`.
- `limit`: opcional; entero entre `1` y `20`; default API `5`. El resultado real para `income` y `limit=5` tuvo dos elementos: no se garantiza que haya cinco.
- `business_type`: opcional; `B2B` o `B2C`, confirmado por OpenAPI.
- `start_date` y `end_date`: opcionales, formato `YYYY-MM-DD`, límites inclusivos. Usar el mismo rango para rankings y movimientos B2B/B2C. Facets no acepta parámetros y siempre es global.
- Derivar la lista de categorías de ingreso de los movimientos del grupo y rango aplicados. El ranking puede obtenerse de `/api/metrics/categories/top` usando `operation_type=income`, `limit=5` y `business_type`.
- Calcular el total de cada grupo sumando `amount` de todos sus movimientos `income`, no solo el top 5. Porcentaje por categoría: `100 * total_amount / total_income` del mismo grupo; `es-ES`, dos decimales, sin dividir por cero. Si ambos rankings correctos están vacíos, prevalece el mensaje vacío, no dos puntos cero.

**Acceso**
- Decisión 7A: navegación compartida con Dashboard (`/`) y B2B vs B2C (`/comparison`), enlace activo y retorno al dashboard. La SPA debe admitir entrada directa a `/comparison`; no hay cambios React en esta revisión.

**Control, estado y formato**
- Dos inputs de fecha propios de `/comparison`, rango global disponible junto a ellos y botón Aplicar, en la parte superior antes de ambos paneles; no compartir el estado del filtro con el dashboard.
- `BusinessComparisonPage` mantiene la edición local. El rango aplicado se conserva en la URL mediante `start_date` y `end_date` en `YYYY-MM-DD`; abrir o recargar recupera ese rango. Editar no modifica la URL ni consulta; Aplicar actualiza la URL y recarga ambos rankings y los movimientos B2B/B2C con el mismo rango.
- Una sola fecha deja el otro parámetro ausente. Ambos inputs vacíos eliminan ambos parámetros y representan ausencia de filtros.
- Validar formato, orden y límites contra facets globales antes de aplicar, con los mismos avisos y bloqueo que en el dashboard; conservar el rango anterior ante una edición inválida.
- Aplicar añade una entrada al historial. Atrás/Adelante restaura rango e inputs desde la URL, descarta ediciones no confirmadas y recarga recursos sin crear otra entrada. Validar también fechas de URL antes de consultar.
- Importes en tablas, etiquetas y tooltips del gráfico: formato `es-ES`, separadores de miles, exactamente dos decimales y sin símbolo ni código de moneda. Ejemplo: `1132097.38` se muestra como `1.132.097,38`. Mantener valores numéricos sin formato para los cálculos.
- Categorías disponibles: mostrar esa lista antes del top 5 en cada panel, derivándola de los movimientos de ingreso del grupo y rango aplicados. No añade filtros ni modifica el ranking.

**Casos límite y UI**
- Llegan menos de cinco categorías: mostrar solo las recibidas, sin completar filas artificiales; indicar cuántas hay, por ejemplo “Se muestran 2 categorías disponibles (máximo 5)”.
- Un grupo no tiene ingresos/categorías en el rango: su panel muestra “No hay categorías de ingresos para B2B en el rango seleccionado” o el equivalente B2C; el otro panel permanece visible.
- Ambos rankings recibidos correctamente sin categorías: paneles y gráfico muestran el estado vacío; no dibujar dos ceros si no hay ingresos en ninguno. Un ranking o carga de movimientos fallidos no cuenta como vacío.
- Falla la carga de movimientos de uno de los grupos: mostrar su total como no disponible; no crear un punto ficticio ni sumar solo las categorías top.

## Validación y pendientes

Las decisiones de fechas, gráfico vacío, historial y formato `es-ES` están registradas en [verification.md](verification.md). La integración y navegación React siguen por implementar. La lista de categorías por grupo se deriva de los movimientos; facets solo es global.

**Fallos parciales**
- Conservar recursos correctos del mismo rango y mostrar errores solo en sus bloques; no reutilizar resultados antiguos de otro rango.
- Dashboard: las alertas se calculan desde movimientos completos sin filtro temporal; un fallo al cargar ese histórico afecta las alertas, no los KPIs/gráficos del rango aplicado.
- Comparativa: ranking fallido afecta solo su panel. Si falla la carga de movimientos, el total y las categorías derivadas de ese grupo no están disponibles; nunca se sustituyen por cero.
- Facets globales fallidas bloquean nuevos límites no vacíos que no se puedan validar, sin ocultar resultados ya correctos. Facets no se consulta por grupo. Un error nunca se presenta como vacío confirmado. Ver [components.md](components.md) para mensajes y estados exactos.

Ejecutar desde `backend/`: `python -m pytest tests/test_routes.py -q` en un entorno con sus requisitos instalados. Desde `frontend/`: `npx tsc --ignoreConfig --noEmit --strict --target ES2022 --module ESNext --moduleResolution Bundler specs/api-types.ts specs/param-types.ts`.