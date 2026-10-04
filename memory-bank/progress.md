# Progress

## Estado actual

El repositorio contiene un dashboard React/TypeScript, una API FastAPI y configuración Docker Compose para dos servicios ([frontend/src/App.tsx](../frontend/src/App.tsx), [backend/app/main.py](../backend/app/main.py), [docker-compose.yml](../docker-compose.yml)). La interfaz solicita movimientos simulados y muestra KPIs y dos gráficos ([frontend/src/App.tsx](../frontend/src/App.tsx), [backend/app/routes.py](../backend/app/routes.py)).

## Qué funciona y validación observada

- El endpoint `GET /health` responde `{"status":"ok"}` según su implementación y prueba ([backend/app/routes.py](../backend/app/routes.py), [backend/tests/test_routes.py](../backend/tests/test_routes.py)).
- La suite backend se ejecutó el 2026-10-03 en Python 3.11.14: `15 passed`. La ejecución usó un entorno temporal porque el `.venv` local estaba usando Python 3.9.6 y falló al importar la anotación `float | None` de `backend/app/routes.py`. El repositorio no declara una versión mínima de Python; el Dockerfile usa Python 3.13 ([backend/Dockerfile](../backend/Dockerfile), [backend/requirements.txt](../backend/requirements.txt)). El resultado y las versiones son observaciones de esa ejecución, no una garantía de CI.
- La prueba mostró una advertencia de deprecación de Starlette TestClient con la versión de httpx instalada; el resultado de la suite fue exitoso ([backend/requirements.txt](../backend/requirements.txt), [backend/tests/test_routes.py](../backend/tests/test_routes.py)).
- El frontend tiene tests de funciones de cálculo/formato en Vitest ([frontend/src/lib/financial-utils.test.ts](../frontend/src/lib/financial-utils.test.ts)). No hay en ese archivo pruebas de montaje de `App` ni del flujo HTTP ([frontend/src/App.tsx](../frontend/src/App.tsx)).
- El periodo fijo `2024 - Full Year` fue reemplazado por `Previous 12 Months`, valor por defecto del encabezado ([frontend/src/App.tsx](../frontend/src/App.tsx), [frontend/src/components/dashboard/dashboard-header.tsx](../frontend/src/components/dashboard/dashboard-header.tsx)).
- No hay evidencia en los archivos ni en el historial de esta sesión de que `docker compose up` terminara correctamente durante la Fase 1. El intento de usar Docker para ejecutar tests falló porque el ejecutable `docker` no estaba disponible; por tanto, no se debe afirmar que los servicios frontend/backend se hayan levantado o verificado en runtime.
- Tras el cambio del encabezado, Pylance informó que no había errores en `App.tsx` ni `dashboard-header.tsx`; no se ejecutaron Vitest, ESLint ni el build frontend ([frontend/src/App.tsx](../frontend/src/App.tsx), [frontend/src/components/dashboard/dashboard-header.tsx](../frontend/src/components/dashboard/dashboard-header.tsx), scripts en [frontend/package.json](../frontend/package.json)).

## Deuda técnica registrada

- El módulo de rutas reúne modelos, generación de datos, filtros, agregaciones y handlers ([backend/app/routes.py](../backend/app/routes.py)).
- El generador llama a `random.seed`, afectando el RNG global ([backend/app/routes.py](../backend/app/routes.py)).
- El comparador de periodos no valida explícitamente que `start_date <= end_date` ([backend/app/routes.py](../backend/app/routes.py)).
- El frontend descarta la causa del error en `catch`, no ofrece reintento y no valida en runtime el JSON recibido ([frontend/src/App.tsx](../frontend/src/App.tsx)).
- No hay tests frontend de la carga/UI y los tests backend no cubren el caso de rango de comparación invertido ([frontend/src/lib/financial-utils.test.ts](../frontend/src/lib/financial-utils.test.ts), [backend/tests/test_routes.py](../backend/tests/test_routes.py)).
- `backend/requirements.txt` no fija versiones ni declara mínimo Python; el Dockerfile usa `python:3.13-slim`. La ejecución local observada usó Python 3.9.6 y falló, mientras el entorno temporal Python 3.11.14 pasó la suite ([backend/requirements.txt](../backend/requirements.txt), [backend/Dockerfile](../backend/Dockerfile), [backend/tests/test_routes.py](../backend/tests/test_routes.py)). El Dockerfile frontend usa `npm install` aunque existe `package-lock.json` ([frontend/Dockerfile](../frontend/Dockerfile), [frontend/package-lock.json](../frontend/package-lock.json)).
- Compose tiene `depends_on` pero no declara `healthcheck`; el cliente hace una petición única al montar ([docker-compose.yml](../docker-compose.yml), [frontend/src/App.tsx](../frontend/src/App.tsx)).

## Roadmap

No se encontró en la documentación/configuración del repositorio un roadmap aprobado, responsables ni fechas objetivo. [findings.md](../findings.md) contiene reglas y recomendaciones técnicas; no son tareas planificadas ni compromisos. La deuda anterior resume comportamientos verificables, sin ordenarlos como hoja de ruta.

No se verificó el arranque Docker ni los comandos de test, lint y build del frontend. Los scripts existen en [frontend/package.json](../frontend/package.json); la guía recomienda `docker compose up --build` pero eso no acredita que se haya ejecutado con éxito ([README.es.md](../README.es.md)).