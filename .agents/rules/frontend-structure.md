# Frontend Structure

## Nombre

Estructura y convenciones del frontend del dashboard.

## Alcance

Aplica a `frontend/src/`, al contrato con la API FastAPI, a los tests frontend y a las dependencias/scripts declarados en `frontend/package.json`.

## Justificación

El punto de entrada existente sigue `frontend/index.html` → `frontend/src/main.tsx` → `frontend/src/App.tsx`. `App` coordina la carga y conecta los componentes del dashboard; los componentes visuales están en `src/components/` y los tipos/cálculos están en `src/lib/`. Conservar esa división hace que UI y lógica financiera puedan evolucionar y probarse por separado.

## Guía específica del proyecto

1. Conserva la cadena de entrada: `index.html` carga `/src/main.tsx`, `main.tsx` monta `<App />` y `App.tsx` compone la pantalla. No montes un segundo root ni dupliques el punto de entrada.

   Ejemplos reales: `createRoot(document.getElementById('root')!).render(...)` en `frontend/src/main.tsx`; `frontend/index.html` contiene `id="root"` y el script de `src/main.tsx`.

2. Mantén los componentes de presentación del dashboard en `frontend/src/components/dashboard/`. Usa archivos kebab-case y exports de componentes en PascalCase, como `income-outcome-chart.tsx` que exporta `IncomeOutcomeChart` y `kpi-row.tsx` que exporta `KPIRow`. Reutiliza los primitivos existentes de `src/components/ui/` cuando correspondan.

3. Coloca tipos compartidos y cálculos puros en `frontend/src/lib/`. El contrato recibido conserva los nombres JSON snake_case (`create_date`, `operation_type`, `business_type`) en `financial-types.ts`; los valores derivados usan camelCase (`totalIncome`, `profitPercent`). Mantén esa distinción y haz transformaciones en una frontera explícita, como `computeKPIs` y `computeMonthlyData` en `financial-utils.ts`.

4. Mantén el acceso HTTP fuera de los componentes visuales. Actualmente `fetchFinancialData` vive en `frontend/src/App.tsx` y llama `GET /api/metrics`; si el número de llamadas crece, muévelo a un módulo de API en `src/lib/` y deja `App` a cargo del estado/orquestación. El proxy de `/api` a `http://backend:8000` está definido en `frontend/vite.config.ts`.

5. Trata la respuesta HTTP como dato externo: `response.json()` con anotación `FinancialMovement[]` no valida el payload en runtime. Si cambia el contrato o se consumen datos no controlados, añade validación en la frontera y una prueba con respuesta inválida.

6. Representa de forma diferenciada los estados de carga, error y datos vacíos. `App.tsx` ya mantiene `loading` y `error`; las tarjetas y gráficos usan skeletons y vistas vacías en `kpi-card.tsx`, `income-outcome-chart.tsx` y `profit-percent-chart.tsx`. Si añades reintento, comprueba que vuelve a ejecutar la carga y limpia el error al tener éxito.

7. No hardcodees un periodo que contradiga el rango de datos. `App.tsx` actualmente pasa `2024 - Full Year`, mientras el backend genera fechas relativas a la fecha actual en `backend/app/routes.py`. Deriva la etiqueta de datos/filtros o deja explícito que es un valor de demostración y cúbrelo con una prueba.

8. Prueba cálculos en `frontend/src/lib/*.test.ts` con Vitest, siguiendo `financial-utils.test.ts`. Añade pruebas de componente para carga, error y éxito cuando se modifique `App`; los comandos del proyecto son `npm test`, `npm run lint` y `npm run build`, definidos en `frontend/package.json`.
