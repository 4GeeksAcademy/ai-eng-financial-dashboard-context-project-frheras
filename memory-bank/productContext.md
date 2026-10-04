# Product Context

## Visión

El repositorio implementa un dashboard de métricas financieras con frontend React + TypeScript y API FastAPI, tal como describe [README.es.md](../README.es.md). La experiencia visible resume ingresos, gastos/salidas, beneficio y margen, y presenta tendencias mensuales; no es una aplicación conectada a datos financieros persistentes: la API genera datos simulados ([backend/app/routes.py](../backend/app/routes.py)).

## Funcionalidad actual

- La página muestra tarjetas con ingresos, gastos, beneficio y margen ([frontend/src/components/dashboard/kpi-row.tsx](../frontend/src/components/dashboard/kpi-row.tsx), [frontend/src/components/dashboard/kpi-card.tsx](../frontend/src/components/dashboard/kpi-card.tsx)).
- Presenta un gráfico de ingresos frente a salidas y otro de porcentaje de beneficio por mes ([frontend/src/components/dashboard/income-outcome-chart.tsx](../frontend/src/components/dashboard/income-outcome-chart.tsx), [frontend/src/components/dashboard/profit-percent-chart.tsx](../frontend/src/components/dashboard/profit-percent-chart.tsx)).
- El cliente solicita `GET /api/metrics`; calcula los KPIs y agrega los movimientos por mes en el navegador ([frontend/src/App.tsx](../frontend/src/App.tsx), [frontend/src/lib/financial-utils.ts](../frontend/src/lib/financial-utils.ts)).
- El encabezado muestra actualmente `Previous 12 Months` ([frontend/src/components/dashboard/dashboard-header.tsx](../frontend/src/components/dashboard/dashboard-header.tsx)).
- La API modela cada movimiento por fecha, importe, tipo de operación, categoría y tipo de negocio; las categorías y tipos válidos están declarados en [backend/app/routes.py](../backend/app/routes.py) y reflejados en [frontend/src/lib/financial-types.ts](../frontend/src/lib/financial-types.ts).

## Límites observados

- El generador produce 30 movimientos por cada uno de los 12 meses, con semilla `42` en los handlers ([backend/app/routes.py](../backend/app/routes.py)).
- La UI principal solo consume `/api/metrics`; los demás endpoints no aparecen conectados desde `App` ([frontend/src/App.tsx](../frontend/src/App.tsx), [backend/app/routes.py](../backend/app/routes.py)).
- En la composición y rutas inspeccionadas no aparece configuración de autenticación o persistencia; los handlers generan movimientos en memoria ([docker-compose.yml](../docker-compose.yml), [backend/app/main.py](../backend/app/main.py), [backend/app/routes.py](../backend/app/routes.py)). Esto no afirma nada sobre sistemas externos no representados en el repositorio.
