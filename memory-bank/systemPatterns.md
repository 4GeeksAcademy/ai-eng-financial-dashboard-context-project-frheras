# System Patterns

## Arquitectura

El sistema se compone de una SPA React servida por Vite y una API FastAPI; Compose conecta los dos servicios ([docker-compose.yml](../docker-compose.yml)). La aplicación FastAPI se crea en [backend/app/main.py](../backend/app/main.py), donde se configura CORS y se registra el router de [backend/app/routes.py](../backend/app/routes.py).

En el frontend, el documento HTML carga `src/main.tsx`, que monta `App`; `App` compone los componentes del dashboard ([frontend/index.html](../frontend/index.html), [frontend/src/main.tsx](../frontend/src/main.tsx), [frontend/src/App.tsx](../frontend/src/App.tsx)). Los componentes visuales están en `src/components/dashboard/`; los modelos TypeScript y cálculos reutilizables están en `src/lib/` ([frontend/src/lib/financial-types.ts](../frontend/src/lib/financial-types.ts), [frontend/src/lib/financial-utils.ts](../frontend/src/lib/financial-utils.ts)).

## Flujo de datos principal

1. `App` ejecuta `fetch` a `${VITE_API_BASE_URL}/api/metrics`; el valor base por defecto es una cadena vacía ([frontend/src/App.tsx](../frontend/src/App.tsx)).
2. En Vite, las rutas `/api` se proxyan a `http://backend:8000` ([frontend/vite.config.ts](../frontend/vite.config.ts)).
3. El handler `/api/metrics` genera 360 movimientos sintéticos con semilla `42`, admite filtros y los devuelve ordenados cronológicamente ([backend/app/routes.py](../backend/app/routes.py)).
4. `App` calcula los KPIs y los puntos mensuales con `computeKPIs` y `computeMonthlyData`, y pasa esos resultados a tarjetas y gráficos ([frontend/src/App.tsx](../frontend/src/App.tsx), [frontend/src/lib/financial-utils.ts](../frontend/src/lib/financial-utils.ts), [frontend/src/components/dashboard/kpi-row.tsx](../frontend/src/components/dashboard/kpi-row.tsx), [frontend/src/components/dashboard/income-outcome-chart.tsx](../frontend/src/components/dashboard/income-outcome-chart.tsx), [frontend/src/components/dashboard/profit-percent-chart.tsx](../frontend/src/components/dashboard/profit-percent-chart.tsx)).

## Contratos y responsabilidades

El backend define los movimientos y los demás modelos de respuesta con Pydantic en [backend/app/routes.py](../backend/app/routes.py). El frontend conserva los nombres JSON snake_case en `FinancialMovement`, y usa tipos camelCase para KPIs y datos de gráficos en [frontend/src/lib/financial-types.ts](../frontend/src/lib/financial-types.ts). Los cálculos del cliente están en funciones separadas de la carga/renderizado ([frontend/src/lib/financial-utils.ts](../frontend/src/lib/financial-utils.ts)).

La API incluye `/health`, `/api/metrics`, facets, resumen, categorías principales, comparación, alertas y rutas B2B/B2C ([backend/app/routes.py](../backend/app/routes.py)). La pantalla `App` solo solicita `/api/metrics`; no debe asumirse que las otras rutas participan en su flujo actual ([frontend/src/App.tsx](../frontend/src/App.tsx)).

## Comportamientos que afectan al flujo

- Cada handler de métricas vuelve a generar datos con `seed=42`; la función llama a `random.seed`, por lo que modifica el RNG global del proceso ([backend/app/routes.py](../backend/app/routes.py)).
- Los años asignados a los 12 meses dependen de `date.today()` ([backend/app/routes.py](../backend/app/routes.py)); el texto del encabezado usa el valor fijo `Previous 12 Months` ([frontend/src/components/dashboard/dashboard-header.tsx](../frontend/src/components/dashboard/dashboard-header.tsx)).
- La respuesta JSON se tipa como `FinancialMovement[]`, pero `App` no valida el esquema en runtime ([frontend/src/App.tsx](../frontend/src/App.tsx)).
