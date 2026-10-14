# Verificación

## Mis dudas antes de mirar la API
- Funcionalidad 1: ¿Qué pasaría si solo relleno la fecha de inicio o solo la fecha de fin?, ¿Que tiene que ocurrir si el usuario introduce una fecha fuera del rango disponible en el dataset?
- Funcionalidad 2: ¿Cómo se calcula exactamente la media móvil cuando no existen 3 periodos anteriores?, ¿que tiene que ocurrir si el usuario introduce un humbral inferior a 0.01 o superior a 1.0?
- Funcionalidad 3: ¿Que tiene que mostrar la vista si una de las dos líneas de negocio no tiene datos para el rango de fechas seleccionado?, ¿como se calcula el porcentaje de ingresos de cada categoría respecto al total del grupo cuando existen categorías sin ingresos?

## Afirmaciones verificadas
El contrato de esta tabla corresponde al backend base `82c8d2f`, sin las modificaciones introducidas al preparar la API para el brief. La verificación del 2026-10-07 se hizo contra aquella versión modificada y sus resultados de facets filtradas, totales y alertas no describen la API actual. El 2026-10-14 se restauró el backend y `pytest -q tests/test_routes.py` pasó: 15 pruebas en Python 3.14.2; queda una advertencia de deprecación de Starlette/httpx.

| Endpoint / nombre | Tipo | Obligatorio | Valores válidos / observados | Fuente | Estado |
|---|---|---|---|---|---|
| `GET /api/metrics/facets`: `operation_types` | Array de string | Sí | `income`, `outcome` | OpenAPI y curl HTTP 200; valores observados | ✅ |
| `GET /api/metrics/facets`: `business_types` | Array de string | Sí | `B2B`, `B2C` | OpenAPI y curl HTTP 200; valores observados | ✅ |
| `GET /api/metrics/facets`: `categories` | Array de string | Sí | `suppliers`, `sales`, `operational`, `administrative`, `others` | OpenAPI y curl HTTP 200; valores observados | ✅ |
| `GET /api/metrics/facets`: `min_date` | String (`date`) | Sí | Fecha `YYYY-MM-DD` del conjunto global | Modelo Pydantic y OpenAPI del backend base | ✅ |
| `GET /api/metrics/facets`: `max_date` | String (`date`) | Sí | Fecha `YYYY-MM-DD` del conjunto global | Modelo Pydantic y OpenAPI del backend base | ✅ |
| `GET /api/metrics/alerts`: query `threshold` | Número | No | Mínimo `0`; sin máximo declarado; default `0.3`; negativos devuelven 422 | Código de ruta y OpenAPI del backend base | ✅ |
| `GET /api/metrics/alerts`: query `group_by` | String | No | `day`, `week`, `month`; default `month` | OpenAPI | ✅ |
| `GET /api/metrics/alerts`: query `start_date` | String (`date`) o null | No | Fecha `YYYY-MM-DD` o null; rango no especificado | OpenAPI | ✅ |
| `GET /api/metrics/alerts`: query `end_date` | String (`date`) o null | No | Fecha `YYYY-MM-DD` o null; rango no especificado | OpenAPI | ✅ |
| `GET /api/metrics/alerts`: query `business_type` | String o null | No | `B2B`, `B2C` o null | OpenAPI | ✅ |
| `GET /api/metrics/alerts`: respuesta `period` | String | Sí | Etiqueta del período; su formato depende de `group_by` (`day`, `week`, `month`) | Modelo y `summarize_movements` del backend base | ✅ |
| `GET /api/metrics/alerts`: respuesta `outcome_total` | Número | Sí | Importe de outcome del período, redondeado a dos decimales | Modelo y `detect_outcome_alerts` del backend base | ✅ |
| `GET /api/metrics/alerts`: respuesta `baseline_average` | Número | Sí | Media de todos los períodos anteriores presentes en el resumen filtrado, redondeada a dos decimales | Implementación de `detect_outcome_alerts` y handler base | ✅ |
| `GET /api/metrics/alerts`: respuesta `increase_ratio` | Número | Sí | Ratio de incremento redondeado a cuatro decimales | Implementación de `detect_outcome_alerts` del backend base | ✅ |
| `GET /api/metrics/categories/top`: query `operation_type` | String | No | `income`, `outcome`; default `outcome`; request `income` aceptado | OpenAPI y curl HTTP 200 | ✅ |
| `GET /api/metrics/categories/top`: query `limit` | Entero | No | Mínimo `1`, máximo `20`; default `5`; request `5` aceptado | OpenAPI y curl HTTP 200 | ✅ |
| `GET /api/metrics/categories/top`: query `start_date` | String (`date`) o null | No | Fecha `YYYY-MM-DD` o null; rango no especificado | OpenAPI | ✅ |
| `GET /api/metrics/categories/top`: query `end_date` | String (`date`) o null | No | Fecha `YYYY-MM-DD` o null; rango no especificado | OpenAPI | ✅ |
| `GET /api/metrics/categories/top`: query `business_type` | String o null | No | `B2B`, `B2C` o null | OpenAPI | ✅ |
| `GET /api/metrics/categories/top`: respuesta `category` | String | Sí | `suppliers`, `sales`, `operational`, `administrative`, `others`; observadas `sales`, `others` | OpenAPI y curl HTTP 200 | ✅ |
| `GET /api/metrics/categories/top`: respuesta `operation_type` | String | Sí | `income`, `outcome`; observado `income` | OpenAPI y curl HTTP 200 | ✅ |
| `GET /api/metrics/categories/top`: respuesta `total_amount` | Número | Sí | Observado `1132097.38`; rango no especificado | OpenAPI y curl HTTP 200 | ✅ |
| FICTICIA (solo prueba): respuesta `test_flag` | No confirmado | No confirmado | Dato inventado para prueba; no forma parte del contrato | No aplica | ❓ |
| `GET /api/metrics`: query `start_date` | String (`date`) o null | No | `YYYY-MM-DD`; límite inferior inclusivo | OpenAPI y `test_metrics_endpoint_respects_date_filters` | ✅ |
| `GET /api/metrics`: query `end_date` | String (`date`) o null | No | `YYYY-MM-DD`; límite superior inclusivo | OpenAPI y `test_metrics_endpoint_respects_date_filters` | ✅ |
| `GET /api/metrics`: query `category` | String o null | No | `suppliers`, `sales`, `operational`, `administrative`, `others` | OpenAPI HTTP | ✅ |
| `GET /api/metrics`: query `operation_type` | String o null | No | `income`, `outcome` | OpenAPI HTTP | ✅ |
| `GET /api/metrics/facets`: query parameters | Ninguno | — | Devuelve facetas globales; no acepta filtros por fecha, grupo u operación | Firma del handler y OpenAPI del backend base | ✅ |
| `GET /api/metrics/b2b`, `/api/metrics/b2c`: query `start_date`, `end_date` | String (`date`) o null | No | Límites inclusivos opcionales; también aceptan `category` y `operation_type` | Firmas de los handlers del backend base | ✅ |
| `GET /api/metrics/categories/top`: query `business_type` | String o null | No | `B2B`, `B2C`; opcional | Firma del handler y OpenAPI del backend base | ✅ |

## Decisiones
| Duda | Decisión | Quién la confirma (yo / el PM) |
|---|---|---|
| ¿Cómo obtener el total de ingresos B2B/B2C para el gráfico? | Calcularlo en frontend sumando todos los movimientos `income` recibidos de `/api/metrics/b2b` y `/api/metrics/b2c`; no se añade un endpoint. | yo |
| ¿Qué hacer si el input `threshold` está fuera de `0.01–1.0`? | La UI rechaza el valor según el brief. El endpoint existente solo impone mínimo `0` y no declara máximo. | yo |
| ¿Qué nombres usar para las fechas en el endpoint de métricas existente? | Conservar `start_date` y `end_date`, ya existentes; límites opcionales inclusivos. | yo |
| 1A: ¿Cuándo aplicar las fechas del dashboard? | Botón Aplicar; recargar movimientos del rango, recalcular KPIs/gráficos y volver a filtrar alertas calculadas desde el histórico completo en frontend. | yo |
| 2A: ¿Qué histórico usar para las alertas? | En frontend, media de exactamente los tres períodos inmediatamente anteriores, con histórico previo al inicio; filtrar las alertas después del cálculo. El endpoint existente filtra antes y promedia todos los períodos previos presentes. | yo |
| 3A: ¿Qué hacer con histórico insuficiente o media cero? | En frontend, no generar alerta; mostrar nota general de cobertura sin añadir filas o campos a la API. | yo |
| 4A: ¿Cómo tratar huecos de calendario? | En el cálculo frontend, usar cero para huecos internos; no crear períodos anteriores al inicio del dataset. | yo |
| 5A: ¿Qué contrato entrega los totales? | No existe endpoint agregado en la base. Calcular ambos totales en frontend a partir de los movimientos completos por grupo. | yo |
| 6A: ¿Cómo obtener categorías por negocio? | Facets es global y no acepta filtros. Derivar categorías disponibles de los movimientos por grupo; `/categories/top` puede obtener el ranking con `business_type`. | yo |
| ¿Qué devuelve facets sin movimientos? | No está especificado por el backend base: `min_date` y `max_date` son requeridos y el generador del endpoint produce movimientos. | — |
| 7A: ¿Cómo acceder a la comparativa? | Rutas `/` y `/comparison`; enlaces Dashboard y B2B vs B2C, con acceso directo a la nueva página. | yo |
| Ubicación según el brief | Fechas en la parte superior del dashboard y rango disponible junto a sus inputs; bloque de alertas debajo de los gráficos existentes. | el PM |
| Control del umbral 1A: ¿Cómo confirmar cambios? | Input numérico inicial `0.3`, mínimo `0.01`, máximo `1.0` según el PM; botón Aplicar umbral recalcula solo las alertas en frontend. | yo |
| Control comparativo 2A: ¿Dónde elegir las fechas? | Dos inputs opcionales propios en la parte superior de `/comparison`, referencia de rango disponible y botón Aplicar; recargar rankings y movimientos B2B/B2C con el mismo rango. | yo |
| Persistencia comparativa 3B: ¿Dónde conservar el rango? | Rango aplicado en parámetros de URL `start_date` y `end_date`; edición local hasta pulsar Aplicar. La URL permite compartir y recuperar la comparativa. | yo |
| Formato de importes 4A: ¿Cómo mostrar tablas y gráfico? | Formato numérico español con separadores de miles y dos decimales en tablas, etiquetas y tooltips; sin símbolo ni código de moneda, ya que la API no identifica una. | yo |
| Fechas invertidas o fuera de límites | Bloquear aplicación en dashboard y comparativa, sin consultar ni ajustar fechas; avisar del formato YYYY-MM-DD o del orden/límites del rango según el motivo. | yo |
| Gráfico con ambos rankings vacíos | Si ambos rankings correctos están vacíos, mostrar el mensaje de estado vacío y no dibujar dos ceros. | yo |
| Fallos parciales de recursos | Mostrar resultados correctos del mismo rango y errores locales. Si falla la carga de movimientos de un grupo, el total y las categorías derivadas no están disponibles; no se inventan valores. | yo |
| Historial de `/comparison` | Aplicar añade una entrada; Atrás/Adelante restaura rango e inputs desde la URL y recarga recursos sin añadir otra entrada. | yo |
| Formato de alertas y umbral | Siempre `es-ES`: importes y porcentajes con dos decimales; mensaje del umbral `0,30` para el valor numérico `0.3`; API conserva valores técnicos sin formato localizado. | yo |
| Uso visible de categorías | Mostrar “Categorías disponibles” en cada panel usando movimientos del grupo y rango; no se filtra facets ni se modifica el top 5. | yo |

## Alertas: contrato y requisito PM

- El endpoint existente agrupa movimientos después de aplicar `start_date`, `end_date` y `business_type`. Calcula el baseline como la media de todos los outcome de períodos anteriores presentes en ese resumen; no completa huecos de calendario.
- `threshold` tiene default `0.3`, mínimo `0` y ningún máximo declarado. El endpoint emite una alerta cuando el ratio supera el umbral; la respuesta redondea importes a dos decimales y ratio a cuatro.
- Este contrato no satisface la regla del brief, que pide media móvil de exactamente tres períodos y mantener el histórico anterior al inicio del rango. La UI debe obtener movimientos sin fechas, completar huecos internos con cero, calcular la regla PM en frontend y filtrar alertas por solapamiento con el rango aplicado.
- Los primeros tres períodos del histórico completo y los períodos con baseline cero no producen alerta en el cálculo frontend. Mostrar una nota general; no añadir metadatos al backend.

## Validación

- Backend restaurado: `pytest -q tests/test_routes.py` desde `backend/`: 15 pasaron en Python 3.14.2. Starlette muestra una advertencia de deprecación sobre su integración con httpx.
- Las verificaciones de Docker/curl del 2026-10-07 corresponden a la implementación anterior del backend y no se consideran evidencia del contrato restaurado.
- No se implementó React: Aplicar, navegación `/comparison`, paneles y estados siguen siendo requisitos documentados para la implementación frontend.