# Verificación

## Mis dudas antes de mirar la API
- Funcionalidad 1: ¿Qué pasaría si solo relleno la fecha de inicio o solo la fecha de fin?, ¿Que tiene que ocurrir si el usuario introduce una fecha fuera del rango disponible en el dataset?
- Funcionalidad 2: ¿Cómo se calcula exactamente la media móvil cuando no existen 3 periodos anteriores?, ¿que tiene que ocurrir si el usuario introduce un humbral inferior a 0.01 o superior a 1.0?
- Funcionalidad 3: ¿Que tiene que mostrar la vista si una de las dos líneas de negocio no tiene datos para el rango de fechas seleccionado?, ¿como se calcula el porcentaje de ingresos de cada categoría respecto al total del grupo cuando existen categorías sin ingresos?

## Afirmaciones verificadas
Actualización 2026-10-07: contrato actualizado comprobado con `curl` y OpenAPI en una instancia aislada en `http://127.0.0.1:8017`, más pruebas HTTP con TestClient. Después se construyó y arrancó Compose y se comprobaron `/health`, movimientos filtrados y totales en `http://localhost:8000`. Los ejemplos anteriores de importes no son resultados esperados de la nueva media móvil; se conservan como observaciones históricas.

| Endpoint / nombre | Tipo | Obligatorio | Valores válidos / observados | Fuente | Estado |
|---|---|---|---|---|---|
| `GET /api/metrics/facets`: `operation_types` | Array de string | Sí | `income`, `outcome` | OpenAPI y curl HTTP 200; valores observados | ✅ |
| `GET /api/metrics/facets`: `business_types` | Array de string | Sí | `B2B`, `B2C` | OpenAPI y curl HTTP 200; valores observados | ✅ |
| `GET /api/metrics/facets`: `categories` | Array de string | Sí | `suppliers`, `sales`, `operational`, `administrative`, `others` | OpenAPI y curl HTTP 200; valores observados | ✅ |
| `GET /api/metrics/facets`: `min_date` | String (`date`) o null | Sí | Fecha `YYYY-MM-DD` del conjunto filtrado; null sin movimientos | OpenAPI actualizado y curl HTTP 200 con null | ✅ |
| `GET /api/metrics/facets`: `max_date` | String (`date`) o null | Sí | Fecha `YYYY-MM-DD` del conjunto filtrado; null sin movimientos | OpenAPI actualizado y curl HTTP 200 con null | ✅ |
| `GET /api/metrics/alerts`: query `threshold` | Número | No | Mínimo `0.01`, máximo `1.0`; default `0.3`; fuera de rango devuelve 422 | OpenAPI actualizado, curl con `1.01` HTTP 422 y tests de ambos extremos | ✅ |
| `GET /api/metrics/alerts`: query `group_by` | String | No | `day`, `week`, `month`; default `month` | OpenAPI | ✅ |
| `GET /api/metrics/alerts`: query `start_date` | String (`date`) o null | No | Fecha `YYYY-MM-DD` o null; rango no especificado | OpenAPI | ✅ |
| `GET /api/metrics/alerts`: query `end_date` | String (`date`) o null | No | Fecha `YYYY-MM-DD` o null; rango no especificado | OpenAPI | ✅ |
| `GET /api/metrics/alerts`: query `business_type` | String o null | No | `B2B`, `B2C` o null | OpenAPI | ✅ |
| `GET /api/metrics/alerts`: respuesta `period` | String | Sí | Observados `2025-12`, `2026-03`, `2026-06`, `2026-08`; formato/rango no especificado | OpenAPI y curl HTTP 200 | ✅ |
| `GET /api/metrics/alerts`: respuesta `outcome_total` | Número | Sí | Observado `103378.98`; rango no especificado | OpenAPI y curl HTTP 200 | ✅ |
| `GET /api/metrics/alerts`: respuesta `baseline_average` | Número | Sí | Observado `51174.1`; rango no especificado | OpenAPI y curl HTTP 200 | ✅ |
| `GET /api/metrics/alerts`: respuesta `increase_ratio` | Número | Sí | Observado `1.0201`; rango no especificado | OpenAPI y curl HTTP 200 | ✅ |
| `GET /api/metrics/categories/top`: query `operation_type` | String | No | `income`, `outcome`; default `outcome`; request `income` aceptado | OpenAPI y curl HTTP 200 | ✅ |
| `GET /api/metrics/categories/top`: query `limit` | Entero | No | Mínimo `1`, máximo `20`; default `5`; request `5` aceptado | OpenAPI y curl HTTP 200 | ✅ |
| `GET /api/metrics/categories/top`: query `start_date` | String (`date`) o null | No | Fecha `YYYY-MM-DD` o null; rango no especificado | OpenAPI | ✅ |
| `GET /api/metrics/categories/top`: query `end_date` | String (`date`) o null | No | Fecha `YYYY-MM-DD` o null; rango no especificado | OpenAPI | ✅ |
| `GET /api/metrics/categories/top`: query `business_type` | String o null | No | `B2B`, `B2C` o null | OpenAPI | ✅ |
| `GET /api/metrics/categories/top`: respuesta `category` | String | Sí | `suppliers`, `sales`, `operational`, `administrative`, `others`; observadas `sales`, `others` | OpenAPI y curl HTTP 200 | ✅ |
| `GET /api/metrics/categories/top`: respuesta `operation_type` | String | Sí | `income`, `outcome`; observado `income` | OpenAPI y curl HTTP 200 | ✅ |
| `GET /api/metrics/categories/top`: respuesta `total_amount` | Número | Sí | Observado `1132097.38`; rango no especificado | OpenAPI y curl HTTP 200 | ✅ |
| FICTICIA (solo prueba): respuesta `test_flag` | No confirmado | No confirmado | Dato inventado para prueba; no forma parte del contrato | No aplica | ❓ |
| `GET /api/metrics`: query `start_date` | String (`date`) o null | No | `YYYY-MM-DD`; límite inferior inclusivo, utilizable por separado | OpenAPI HTTP y `test_metrics_support_each_inclusive_date_limit` | ✅ |
| `GET /api/metrics`: query `end_date` | String (`date`) o null | No | `YYYY-MM-DD`; límite superior inclusivo, utilizable por separado | OpenAPI HTTP y `test_metrics_support_each_inclusive_date_limit` | ✅ |
| `GET /api/metrics`: query `category` | String o null | No | `suppliers`, `sales`, `operational`, `administrative`, `others` | OpenAPI HTTP | ✅ |
| `GET /api/metrics`: query `operation_type` | String o null | No | `income`, `outcome` | OpenAPI HTTP | ✅ |
| `GET /api/metrics/facets`: query `start_date` | String (`date`) o null | No | `YYYY-MM-DD`; inclusivo | OpenAPI HTTP y tests de filtros | ✅ |
| `GET /api/metrics/facets`: query `end_date` | String (`date`) o null | No | `YYYY-MM-DD`; inclusivo | OpenAPI HTTP y curl con `1900-01-01` | ✅ |
| `GET /api/metrics/facets`: query `business_type` | String o null | No | `B2B`, `B2C` | OpenAPI HTTP y curl de B2C | ✅ |
| `GET /api/metrics/facets`: query `operation_type` | String o null | No | `income`, `outcome` | OpenAPI HTTP y curl de income | ✅ |
| `GET /api/metrics/income/totals`: query `start_date` | String (`date`) o null | No | `YYYY-MM-DD`; inclusivo | OpenAPI HTTP | ✅ |
| `GET /api/metrics/income/totals`: query `end_date` | String (`date`) o null | No | `YYYY-MM-DD`; inclusivo | OpenAPI HTTP y TestClient | ✅ |
| `GET /api/metrics/income/totals`: respuesta `business_type` | String | Sí | `B2B`, `B2C`; lista siempre de dos entradas en ese orden | OpenAPI, curl HTTP 200 y TestClient | ✅ |
| `GET /api/metrics/income/totals`: respuesta `total_income` | Número | Sí | Todos los ingresos del grupo, no solo top 5; cero sin ingresos; redondeado a dos decimales | curl HTTP 200: B2B `615540.72`, B2C `642606.15`; tests de sumas y vacío | ✅ |

## Decisiones
| Duda | Decisión | Quién la confirma (yo / el PM) |
|---|---|---|
| ¿Cómo obtener el total de ingresos B2B/B2C para el gráfico? | B: añadir a la API un total agregado por grupo. | yo |
| ¿Qué hacer si `threshold` está fuera de `0.01–1.0`? | A: rechazar el valor con un error de validación. | yo |
| ¿Qué nombres usar para las fechas en el endpoint de métricas existente? | Conservar `start_date` y `end_date`, ya existentes; límites opcionales inclusivos. | yo |
| 1A: ¿Cuándo aplicar las fechas del dashboard? | Botón Aplicar; recargar movimientos y alertas, recalcular todos los KPIs y los dos gráficos con el mismo rango aplicado. | yo |
| 2A: ¿Qué histórico usar para las alertas? | Media de los tres períodos inmediatamente anteriores, incluyendo histórico anterior al inicio; filtrar las alertas después del cálculo. | yo |
| 3A: ¿Qué hacer con histórico insuficiente o media cero? | No generar alerta; nota informativa de cobertura en UI sin añadir filas o campos de evaluación a la API. | yo |
| 4A: ¿Cómo tratar huecos de calendario? | Períodos de calendario consecutivos; gasto cero para huecos internos del histórico disponible. | yo |
| 5A: ¿Qué contrato entrega los totales? | `GET /api/metrics/income/totals`, fechas opcionales; dos entradas `{ business_type, total_income }`, B2B y B2C, cero sin ingresos. | yo |
| 6A: ¿Cómo obtener categorías por negocio? | Filtrar `/api/metrics/facets` con `business_type`, `operation_type=income` y rango aplicado para cada panel. | yo |
| ¿Qué devuelve facets sin movimientos? | Arrays vacíos y `min_date: null`, `max_date: null`. | yo |
| 7A: ¿Cómo acceder a la comparativa? | Rutas `/` y `/comparison`; enlaces Dashboard y B2B vs B2C, con acceso directo a la nueva página. | yo |
| Ubicación según el brief | Fechas en la parte superior del dashboard y rango disponible junto a sus inputs; bloque de alertas debajo de los gráficos existentes. | el PM |
| Control del umbral 1A: ¿Cómo confirmar cambios? | Input numérico inicial `0.3`, mínimo `0.01`, máximo `1.0`; botón Aplicar umbral, que valida y recarga solo las alertas con las fechas aplicadas. | yo |
| Control comparativo 2A: ¿Dónde elegir las fechas? | Dos inputs opcionales propios en la parte superior de `/comparison`, referencia de rango disponible y botón Aplicar; recargar ambos rankings, facets por grupo y totales con el mismo rango. | yo |
| Persistencia comparativa 3B: ¿Dónde conservar el rango? | Rango aplicado en parámetros de URL `start_date` y `end_date`; edición local hasta pulsar Aplicar. La URL permite compartir y recuperar la comparativa. | yo |
| Formato de importes 4A: ¿Cómo mostrar tablas y gráfico? | Formato numérico español con separadores de miles y dos decimales en tablas, etiquetas y tooltips; sin símbolo ni código de moneda, ya que la API no identifica una. | yo |
| Fechas invertidas o fuera de límites | Bloquear aplicación en dashboard y comparativa, sin consultar ni ajustar fechas; avisar del formato YYYY-MM-DD o del orden/límites del rango según el motivo. | yo |
| Gráfico con ambos rankings vacíos | Si ambos rankings correctos están vacíos, mostrar el mensaje de estado vacío y no dibujar dos ceros. | yo |
| Fallos parciales de recursos | Por delegación del usuario: mostrar resultados correctos del mismo rango y errores locales. Un total fallido impide porcentajes/gráfico, no categorías e importes; facets fallidas no invalidan un ranking correcto. | yo (delegado al agente) |
| Historial de `/comparison` | Aplicar añade una entrada; Atrás/Adelante restaura rango e inputs desde la URL y recarga recursos sin añadir otra entrada. | yo |
| Formato de alertas y umbral | Siempre `es-ES`: importes y porcentajes con dos decimales; mensaje del umbral `0,30` para el valor numérico `0.3`; API conserva valores técnicos sin formato localizado. | yo |
| Uso visible de categorías de facets | B: mostrar “Categorías disponibles” en cada panel, usando las facets del grupo y rango aplicados, como lista informativa separada del top 5 y sin añadir filtros. | yo |

## Regla de alertas implementada

- Agrupar el histórico completo de la línea de negocio (ambas si se omite el filtro) por día, semana ISO de lunes a domingo o mes calendario.
- Completar con gasto cero los huecos entre el primer y último período observado. No fabricar períodos anteriores al comienzo del dataset.
- Para cada período `t`, usar `baseline = (outcome[t-1] + outcome[t-2] + outcome[t-3]) / 3`. No emitir alertas en los primeros tres períodos ni cuando `baseline == 0`.
- Calcular `increase_ratio = (outcome[t] - baseline) / baseline`; emitir solo si el ratio sin redondear es estrictamente mayor que `threshold`. Redondear importes a dos decimales y ratio a cuatro en la respuesta.
- Calcular con períodos completos y seleccionar aquellos que solapen las fechas inclusivas solicitadas; las fechas no recortan el gasto interno de un mes/semana seleccionado parcialmente.
- Evidencia: `test_alerts_use_exactly_three_previous_periods`, `test_alert_calendar_gaps_are_zero`, `test_alert_zero_baseline_is_not_evaluable`, `test_alerts_keep_history_before_date_filter` en [las pruebas de rutas](../../backend/tests/test_routes.py).
- La API solo devuelve alertas. No informa qué períodos fueron omitidos por cobertura insuficiente; la UI debe mostrar una nota general, no atribuir falta de histórico a cada resultado vacío.

## Validación de esta revisión

- Backend: 37 pruebas pasan en el entorno temporal Python 3.14 y en el contenedor Python 3.13; advertencia de deprecación de Starlette/TestClient con httpx.
- Frontend existente: 5 tests pasan; `npm run lint` y `npm run build` pasan. Build emite una advertencia de bundle mayor de 500 kB.
- Contratos de specs: TypeScript estricto con archivos explícitos y `--ignoreConfig` pasa.
- Integración: `docker compose config`, `up --build -d` y `ps` correctos; `/health` HTTP 200; filtro septiembre 2026 con 30 movimientos del 02 al 28; totales HTTP 200; frontend HTTP 200.
- Los servicios iniciados solo para esta verificación se detienen al terminar. Estas observaciones no garantizan que un servicio arrancado con código anterior esté actualizado.
- No se implementó React: Aplicar, navegación `/comparison`, paneles y estados son requisitos documentados para la siguiente implementación frontend.