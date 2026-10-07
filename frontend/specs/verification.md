# Verificación

## Mis dudas antes de mirar la API
- Funcionalidad 1: ¿Qué pasaría si solo relleno la fecha de inicio o solo la fecha de fin?, ¿Que tiene que ocurrir si el usuario introduce una fecha fuera del rango disponible en el dataset?
- Funcionalidad 2: ¿Cómo se calcula exactamente la media móvil cuando no existen 3 periodos anteriores?, ¿que tiene que ocurrir si el usuario introduce un humbral inferior a 0.01 o superior a 1.0?
- Funcionalidad 3: ¿Que tiene que mostrar la vista si una de las dos líneas de negocio no tiene datos para el rango de fechas seleccionado?, ¿como se calcula el porcentaje de ingresos de cada categoría respecto al total del grupo cuando existen categorías sin ingresos?

## Afirmaciones verificadas
| Endpoint / nombre | Tipo | Obligatorio | Valores válidos / observados | Fuente | Estado |
|---|---|---|---|---|---|
| `GET /api/metrics/facets`: `operation_types` | Array de string | Sí | `income`, `outcome` | OpenAPI y curl HTTP 200; valores observados | ✅ |
| `GET /api/metrics/facets`: `business_types` | Array de string | Sí | `B2B`, `B2C` | OpenAPI y curl HTTP 200; valores observados | ✅ |
| `GET /api/metrics/facets`: `categories` | Array de string | Sí | `suppliers`, `sales`, `operational`, `administrative`, `others` | OpenAPI y curl HTTP 200; valores observados | ✅ |
| `GET /api/metrics/facets`: `min_date` | String (`date`) | Sí | Fecha `YYYY-MM-DD`; observada `2025-10-02` | OpenAPI y curl HTTP 200 | ✅ |
| `GET /api/metrics/facets`: `max_date` | String (`date`) | Sí | Fecha `YYYY-MM-DD`; observada `2026-09-28` | OpenAPI y curl HTTP 200 | ✅ |
| `GET /api/metrics/alerts`: query `threshold` | Número | No | Mínimo `0`, sin máximo declarado; default `0.3`; request `0.3` aceptado | OpenAPI y curl HTTP 200 | ✅ |
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

## Decisiones
| Duda | Decisión | Quién la confirma (yo / el PM) |
|---|---|---|
| ¿Cómo obtener el total de ingresos B2B/B2C para el gráfico? | B: añadir a la API un total agregado por grupo. | yo |
| ¿Qué hacer si `threshold` está fuera de `0.01–1.0`? | A: rechazar el valor con un error de validación. | yo |
| ¿Qué nombres usar para las fechas en el endpoint de métricas existente? | A si el endpoint ya acepta parámetros de fecha: conservar sus nombres. B si no los acepta: añadir `start_date` y `end_date`. | yo |