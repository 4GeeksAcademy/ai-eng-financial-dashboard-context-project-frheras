# Guía para una sesión nueva

Empieza por el [pedido original del PM](pm-brief.md), contrástalo con las [afirmaciones y decisiones verificadas](verification.md) y consulta la [especificación de componentes](components.md). Las rutas indicadas como verificadas y las pendientes están separadas explícitamente. No trates las filas ficticias de prueba como contrato de API.

El backend y las pruebas implementan los contratos descritos abajo. Botón Aplicar, navegación y componentes React son especificaciones, no UI implementada. Evidencia actual: pruebas HTTP con TestClient, consultas curl/OpenAPI a una instancia aislada y arranque Docker Compose comprobado en puerto 8000. Los servicios de verificación se detienen al terminar; consultar [verification.md](verification.md) para los resultados y advertencias.

## Funcionalidad 1 — Filtro de rango de fechas

**Requisito PM:** [Funcionalidad 1 en pm-brief.md](pm-brief.md): filtrar el dashboard por fechas opcionales y mostrar el rango disponible.

**Endpoints**
- `GET /api/metrics/facets` — ruta verificada; devuelve `min_date` y `max_date`.
- `GET /api/metrics` — ruta verificada; acepta `start_date` y `end_date` opcionales e inclusivos. Cada límite funciona por separado.
- `GET /api/metrics/alerts` — recargar con el mismo rango aplicado para actualizar también las alertas.

**Tipos**
- Facetas: [`FacetsResponse`](api-types.ts#L8).
- Fechas y movimientos: `DateRangeFilter` y `MetricsParams` en [param-types.ts](param-types.ts).

**Parámetros y restricciones**
- Las fechas del pedido deben tener formato `YYYY-MM-DD` y ambas pueden estar vacías. `DateRangeFilter` modela `start_date` y `end_date` opcionales para rutas que las declaran.
- En facets, `min_date` y `max_date` son requeridos, formato `YYYY-MM-DD` o null sin movimientos. Para la referencia global del dashboard consultar facets sin filtros; no sustituirla por el rango filtrado.
- `/api/metrics` acepta también `category` (las categorías verificadas) y `operation_type` (`income`, `outcome`), opcionales. Para filtrar todos los movimientos del dashboard omitir esos filtros adicionales.
- Decisión 1A: editar fechas no consulta la API. Pulsar Aplicar recarga movimientos y alertas, recalcula ingresos, gastos, beneficio, margen y ambos gráficos, y actualiza la etiqueta del rango. Descartar respuestas antiguas; no mezclar recursos de distintos rangos.
- Ubicación: controles de fechas en la parte superior del dashboard, antes de KPIs y gráficos; rango disponible junto a los inputs (línea siguiente dentro del mismo bloque en móvil).

**Casos límite y UI**
- Solo hay fecha inicial o solo fecha final: conservar el límite seleccionado y mostrarlo como “Desde [fecha]” o “Hasta [fecha]”; dejar el otro input vacío y omitir ese parámetro al pulsar Aplicar. Backend confirmado con filtros inclusivos independientes.
- Formato inválido: “Formato de fecha incorrecto, utilizar el formato YYYY-MM-DD”; bloquear aplicación.
- Inicio posterior al fin: “La fecha de inicio es posterior a la fecha de fin. El rango de fecha indicado no es correcto, por favor, seleccione un rango de fechas entre [min_date] y [max_date]”; no consultar.
- Límites fuera del dataset: “El rango de fecha indicado está fuera de las fechas disponibles, por favor, seleccione un rango de fechas entre [min_date] y [max_date]”; no consultar ni ajustar silenciosamente. Estas son decisiones de UI, no nuevas validaciones backend.
- No hay movimientos para el rango válido: mostrar “No hay movimientos para el rango seleccionado”.

## Funcionalidad 2 — Alertas de anomalías

**Requisito PM:** [Funcionalidad 2 en pm-brief.md](pm-brief.md): mostrar períodos de gasto anómalo, configurar el umbral y conservar un estado vacío explícito.

**Endpoints**
- `GET /api/metrics/alerts` — ruta verificada; `curl` con `threshold=0.3` respondió HTTP 200.

**Tipos**
- Parámetros: `AlertsParams` y `DateRangeFilter` en [param-types.ts](param-types.ts).
- Respuesta: [`AlertsResponse`](api-types.ts#L63) y [`AlertEntry`](api-types.ts#L38).

**Parámetros y restricciones**
- `threshold`: opcional, número, default `0.3`; mínimo `0.01`, máximo `1.0`, inclusivos; error HTTP 422 fuera de rango, sin ajuste silencioso.
- `group_by`: opcional; `day`, `week`, `month`; default `month`. El dashboard usa `month`; `AlertsParams` incluye este parámetro.
- `start_date` y `end_date`: opcionales, formato `YYYY-MM-DD`; OpenAPI no declara límites de fecha.
- `business_type`: opcional; valores `B2B` o `B2C`.
- La respuesta incluye `period`, `outcome_total`, `baseline_average` e `increase_ratio`. Formato visible siempre `es-ES`: importes con dos decimales sin moneda; ratio `1.0201` como `102,01 %`; umbral `0.3` como `0,30` en mensajes. No localizar los números enviados a la API.

**Control y ubicación**
- El bloque completo de alertas va debajo de los gráficos existentes. Antes de la tabla colocar un input numérico de umbral, valor inicial `0.3`, mínimo `0.01`, máximo `1.0`, y botón Aplicar umbral.
- Mantener edición y umbral aplicado separados. Confirmar con Aplicar umbral recarga únicamente alertas con las fechas ya aplicadas; editar no consulta la API. Los mensajes de resultados usan el umbral aplicado, no el que aún se está editando.

**Regla exacta**
- Media del gasto de los tres períodos calendario inmediatamente anteriores, sin incluir el actual. Huecos internos del histórico se rellenan con cero; no se inventa histórico anterior al dataset.
- Ratio `(gasto_actual - media) / media`; emitir únicamente si supera estrictamente el umbral. No emitir con menos de tres períodos previos o media cero.
- Calcular antes de filtrar las alertas por fechas, usando histórico anterior al inicio. Mostrar períodos que solapen el rango y sus gastos completos, no gastos recortados a días parciales. Ver [la regla y evidencia](verification.md).

**Casos límite y UI**
- `threshold` menor que `0.01` o mayor que `1.0`: mostrar “El umbral debe estar entre 0,01 y 1,00” y no consultar hasta corregirlo; una llamada directa inválida recibe 422.
- No hay alertas para el umbral actual: mantener la tabla y mostrar “No se detectaron anomalías para el umbral 0,30” para el umbral aplicado `0.3`; usar siempre dos decimales y `es-ES`.
- Histórico insuficiente o media cero: backend omite esas alertas. Mantener la nota general “Las alertas requieren 3 períodos anteriores y una media mayor que cero”. La API no identifica períodos no evaluables; no inferirlos a partir de una lista vacía.

## Funcionalidad 3 — Comparativa B2B vs B2C

**Requisito PM:** [Funcionalidad 3 en pm-brief.md](pm-brief.md): dos tablas paralelas con las cinco categorías principales y un gráfico comparativo de ingresos por línea de negocio.

**Endpoints**
- `GET /api/metrics/categories/top` — ruta verificada; una consulta real con `operation_type=income&limit=5` respondió HTTP 200 con dos categorías.
- `GET /api/metrics/facets` — ruta verificada y filtrable por `business_type`, `operation_type` y fechas; consultar con `operation_type=income` para cada grupo.
- `GET /api/metrics/income/totals` — ruta nueva verificada; lista de exactamente dos entradas `{ business_type, total_income }`, B2B y B2C en ese orden, incluyendo cero si no hay ingresos.

**Tipos**
- Parámetros: `TopCategoriesParams`, `FacetsParams`, `IncomeTotalsParams` y `DateRangeFilter` en [param-types.ts](param-types.ts).
- Respuesta de ranking: [`TopCategoriesResponse`](api-types.ts#L93) y [`CategoryEntry`](api-types.ts#L73).
- Valores de grupo: [`BusinessType`](api-types.ts#L2); categorías disponibles: [`FacetsResponse`](api-types.ts#L8) y [`Category`](api-types.ts#L3); operación: [`OperationType`](api-types.ts#L1).
- Totales: `IncomeTotalEntry` y `IncomeTotalsResponse` en [api-types.ts](api-types.ts). No inferir el total sumando solo el top 5.

**Parámetros y restricciones**
- `operation_type`: opcional; `income` o `outcome`; default API `outcome`. Para esta funcionalidad se solicita `income`.
- `limit`: opcional; entero entre `1` y `20`; default API `5`. El resultado real para `income` y `limit=5` tuvo dos elementos: no se garantiza que haya cinco.
- `business_type`: opcional; `B2B` o `B2C`, confirmado por OpenAPI.
- `start_date` y `end_date`: opcionales, formato `YYYY-MM-DD`, límites inclusivos. Usar el mismo rango para top, facets y totales. Totales solo acepta estas fechas y siempre devuelve ambos grupos.
- Facets acepta `business_type` (`B2B`, `B2C`) y `operation_type` (`income`, `outcome`), opcionales. La lista de categorías procede del grupo y rango consultados, no de las facetas globales. Arrays vacíos y fechas null cuando no hay movimientos.
- Porcentaje por categoría: `100 * total_amount / total_income` del mismo grupo; `es-ES`, dos decimales, sin dividir por cero. El gráfico muestra totales confirmados y permite un punto cero si hay categorías en al menos un ranking. Si ambos rankings correctos están vacíos, prevalece el mensaje vacío, no dos puntos cero.

**Acceso**
- Decisión 7A: navegación compartida con Dashboard (`/`) y B2B vs B2C (`/comparison`), enlace activo y retorno al dashboard. La SPA debe admitir entrada directa a `/comparison`; no hay cambios React en esta revisión.

**Control, estado y formato**
- Dos inputs de fecha propios de `/comparison`, rango global disponible junto a ellos y botón Aplicar, en la parte superior antes de ambos paneles; no compartir el estado del filtro con el dashboard.
- `BusinessComparisonPage` mantiene la edición local. El rango aplicado se conserva en la URL mediante `start_date` y `end_date` en `YYYY-MM-DD`; abrir o recargar recupera ese rango. Editar no modifica la URL ni consulta; Aplicar actualiza la URL y recarga ambos rankings, facets por grupo y totales con el mismo rango.
- Una sola fecha deja el otro parámetro ausente. Ambos inputs vacíos eliminan ambos parámetros y representan ausencia de filtros.
- Validar formato, orden y límites contra facets globales antes de aplicar, con los mismos avisos y bloqueo que en el dashboard; conservar el rango anterior ante una edición inválida.
- Aplicar añade una entrada al historial. Atrás/Adelante restaura rango e inputs desde la URL, descarta ediciones no confirmadas y recarga recursos sin crear otra entrada. Validar también fechas de URL antes de consultar.
- Importes en tablas, etiquetas y tooltips del gráfico: formato `es-ES`, separadores de miles, exactamente dos decimales y sin símbolo ni código de moneda. Ejemplo: `1132097.38` se muestra como `1.132.097,38`. Mantener valores numéricos sin formato para los cálculos.
- Categorías de facets, opción B: mostrar “Categorías disponibles” antes del top 5 en cada panel. Lista informativa obtenida de las facets de ingresos del grupo y rango aplicados; no añade filtros ni modifica el ranking. Si carga: “Cargando categorías disponibles…”. Si está vacía: “No hay categorías disponibles para este grupo en el rango seleccionado”. Si falla: error local de facets, conservando el ranking correcto.

**Casos límite y UI**
- Llegan menos de cinco categorías: mostrar solo las recibidas, sin completar filas artificiales; indicar cuántas hay, por ejemplo “Se muestran 2 categorías disponibles (máximo 5)”.
- Un grupo no tiene ingresos/categorías en el rango: su panel muestra “No hay categorías de ingresos para B2B en el rango seleccionado” o el equivalente B2C; el otro panel permanece visible.
- Ambos rankings recibidos correctamente sin categorías: paneles y gráfico muestran el estado vacío; no dibujar dos ceros aunque el endpoint confirme totales cero. Un ranking fallido no cuenta como vacío.
- Falta el total agregado de uno de los grupos: mostrar “Total B2B no disponible” o “Total B2C no disponible” en el gráfico; no crear un punto ficticio ni sumar solo las categorías top.

## Validación y pendientes

Las decisiones de fechas, gráfico vacío, historial, formato `es-ES` y lista visible de categorías de facets (B) están confirmadas en [verification.md](verification.md). La integración y navegación React siguen por implementar. No añadir filtros de categoría: la lista de facets es informativa y está separada del top 5.

**Fallos parciales**
- Conservar recursos correctos del mismo rango y mostrar errores solo en sus bloques; no reutilizar resultados antiguos de otro rango.
- Dashboard: movimientos fallidos afectan KPIs/gráficos, no alertas correctas; alertas fallidas no ocultan KPIs/gráficos.
- Comparativa: ranking fallido afecta solo su panel. Totales fallidos dejan visibles categorías/importes, con “Porcentaje no disponible” y error en el gráfico. Totales válidos pueden alimentar el gráfico aunque falle un ranking.
- Facets por grupo fallidas no invalidan su ranking; facets globales fallidas bloquean nuevos límites no vacíos que no se puedan validar, sin ocultar resultados ya correctos. Un error nunca se presenta como vacío confirmado. Ver [components.md](components.md) para mensajes y estados exactos.

Ejecutar desde `backend/`: `python -m pytest tests/test_routes.py -q` en un entorno con sus requisitos instalados. Desde `frontend/`: `npx tsc --ignoreConfig --noEmit --strict --target ES2022 --module ESNext --moduleResolution Bundler specs/api-types.ts specs/param-types.ts`.