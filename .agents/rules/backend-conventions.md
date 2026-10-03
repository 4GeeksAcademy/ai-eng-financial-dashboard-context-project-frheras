# Backend Conventions

## Nombre

Convenciones de backend para Financial Metrics Dashboard.

## Alcance

Aplica a `backend/app/`, `backend/tests/`, `backend/requirements.txt` y `backend/Dockerfile`: endpoints FastAPI, contratos HTTP, cálculos financieros, generadores de datos y sus pruebas.

## Justificación

`backend/app/routes.py` reúne actualmente modelos Pydantic, generación de datos simulados, filtrado, agregaciones y handlers. Mantener límites claros evita que las rutas crezcan como único módulo de dominio y facilita sustituir los datos simulados sin cambiar el contrato HTTP. La aplicación se crea y registra el router en `backend/app/main.py`.

## Guía específica del proyecto

1. Mantén `backend/app/main.py` como composición de FastAPI: configuración transversal (por ejemplo CORS) e inclusión de routers. Declara endpoints bajo routers en módulos de rutas.

   Ejemplo actual: `app.include_router(router)` en `backend/app/main.py`; los handlers se declaran con `@router.get(...)` en `backend/app/routes.py`.

2. Define y conserva contratos de respuesta explícitos con modelos Pydantic y tipos restringidos. Los tipos actuales incluyen `OperationType`, `Category`, `BusinessType` y modelos como `FinancialMovement` en `backend/app/routes.py`.

   Ejemplo actual: `@router.get("/api/metrics", response_model=list[FinancialMovement])`. Esa ruta devuelve movimientos individuales, no métricas agregadas; nombra rutas nuevas según el recurso y la forma de respuesta. No cambies `/api/metrics` sin mantener compatibilidad con el consumidor de `frontend/src/App.tsx`.

3. Valida los límites de entrada en el servidor. Los parámetros con valores acotados siguen el patrón `Query(default=5, ge=1, le=20)` usado por `limit` en `backend/app/routes.py`. Para `get_metrics_comparison`, rechaza `start_date > end_date` con un error HTTP 4xx y añade una prueba de ese caso.

4. Mantén los handlers como adaptadores HTTP y extrae lógica de dominio cuando aumente el módulo. `filter_movements`, `summarize_movements` y `calculate_net_value` son funciones puras existentes que pueden mantenerse y probarse sin `TestClient`; al separar módulos, conserva esos contratos y responsabilidades.

5. No alteres el RNG global para producir datos reproducibles. Actualmente `generate_mock_movements(seed=42)` usa `random.seed(seed)` y el módulo `random` global en `backend/app/routes.py`. Al modificarlo, crea una instancia local `random.Random(seed)` y pásala a las funciones generadoras; prueba que el generador no afecta la secuencia aleatoria global.

6. Responde con errores HTTP explícitos para entradas inválidas; no conviertas silenciosamente errores de contrato en listas vacías. Los tests deben comprobar status y payload, siguiendo el uso de `TestClient` en `backend/tests/test_routes.py`.

7. Añade pruebas para cada nueva ruta y para reglas de dominio relevantes. Ejecuta `pytest` desde `backend/` o `docker compose exec backend pytest` con los servicios levantados. Las dependencias Python se declaran en `backend/requirements.txt`; fija/actualiza dependencias de forma deliberada y conserva coherencia con `backend/Dockerfile`.
