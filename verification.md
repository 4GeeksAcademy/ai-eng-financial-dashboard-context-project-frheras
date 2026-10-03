# Verificacion del repositorio

Este documento describe lo que se puede respaldar con los archivos presentes en el repositorio. Las rutas de ejecucion y puertos se verifican en configuracion; no implica que los contenedores se hayan iniciado ni que los servicios esten disponibles en este momento.

## Instrucciones de Ejecucion

### Requisitos

- Docker y Docker Compose disponibles en el equipo. El README indica Compose como modo de ejecucion local: [README.es.md](README.es.md).
- Ejecutar los comandos desde la raiz del repositorio, donde esta [docker-compose.yml](docker-compose.yml).

### Arranque

```bash
docker compose up --build
```

Este comando construye y arranca los dos servicios declarados por Compose: `frontend` y `backend` ([docker-compose.yml](docker-compose.yml)). Los Dockerfiles definen sus procesos: Vite en `5173` ([frontend/Dockerfile](frontend/Dockerfile)) y Uvicorn en `8000`, con `debugpy` escuchando en `5678` ([backend/Dockerfile](backend/Dockerfile)). Compose publica esos puertos como `5173:5173`, `8000:8000` y `5678:5678` ([docker-compose.yml](docker-compose.yml)). Son los puertos configurados; que esten disponibles en el host depende de que no esten ocupados.

### URLs y comprobaciones

| Servicio / comprobacion | URL o comando | Evidencia en el repositorio |
| --- | --- | --- |
| Interfaz frontend | http://localhost:5173 | Publicacion de puerto en [docker-compose.yml](docker-compose.yml); URL documentada en [README.es.md](README.es.md). |
| Backend | http://localhost:8000 | Publicacion de puerto en [docker-compose.yml](docker-compose.yml); URL documentada en [README.es.md](README.es.md). |
| Documentacion interactiva de la API | http://localhost:8000/docs | URL indicada en [README.es.md](README.es.md); la aplicacion FastAPI se crea en [backend/app/main.py](backend/app/main.py). |
| Health check | http://localhost:8000/health | Ruta definida en [backend/app/routes.py](backend/app/routes.py). |
| Movimientos financieros | http://localhost:8000/api/metrics | Ruta definida en [backend/app/routes.py](backend/app/routes.py); consumida por la interfaz en [frontend/src/App.tsx](frontend/src/App.tsx). |

En otra terminal, desde la raiz:

```bash
docker compose ps
curl -i http://localhost:8000/health
curl -i http://localhost:8000/api/metrics
```

`docker compose ps` permite comprobar el estado de los contenedores. El endpoint `/health` debe devolver HTTP `200` y `{"status":"ok"}` segun su handler en [backend/app/routes.py](backend/app/routes.py). `/api/metrics` debe responder con una lista JSON conforme al `response_model` de esa ruta ([backend/app/routes.py](backend/app/routes.py)). Abrir la URL del frontend comprueba la interfaz; la solicitud de datos de esa pantalla es `GET /api/metrics` ([frontend/src/App.tsx](frontend/src/App.tsx)).

El proxy de Vite solo esta configurado para `/api` y apunta al servicio `backend` en el puerto `8000` ([frontend/vite.config.ts](frontend/vite.config.ts)); por eso la pantalla usa el proxy entre contenedores, mientras las comprobaciones anteriores acceden al backend publicado en `localhost`.

Los tests disponibles se pueden ejecutar dentro de los contenedores despues del arranque:

```bash
docker compose exec backend pytest
docker compose exec frontend npm test
```

`pytest` esta en [backend/requirements.txt](backend/requirements.txt); el script `test` ejecuta Vitest en [frontend/package.json](frontend/package.json). Para detener los servicios:

```bash
docker compose down
```

## Resumen del Proyecto

El proyecto es un dashboard de metricas financieras con frontend React + TypeScript y backend FastAPI, segun [README.es.md](README.es.md). El punto de entrada HTML carga `src/main.tsx` ([frontend/index.html](frontend/index.html)); ese archivo monta el componente raiz `App` ([frontend/src/main.tsx](frontend/src/main.tsx)).

`App` solicita `/api/metrics`, mantiene estado de carga/error, calcula KPIs y agrupaciones mensuales y renderiza el encabezado, la fila de KPIs y dos graficos ([frontend/src/App.tsx](frontend/src/App.tsx), [frontend/src/lib/financial-utils.ts](frontend/src/lib/financial-utils.ts), [frontend/src/components/dashboard/kpi-row.tsx](frontend/src/components/dashboard/kpi-row.tsx), [frontend/src/components/dashboard/income-outcome-chart.tsx](frontend/src/components/dashboard/income-outcome-chart.tsx), [frontend/src/components/dashboard/profit-percent-chart.tsx](frontend/src/components/dashboard/profit-percent-chart.tsx)). Los tipos de movimientos compartidos en el frontend estan descritos en [frontend/src/lib/financial-types.ts](frontend/src/lib/financial-types.ts).

El backend crea la aplicacion FastAPI, configura CORS e incluye el router ([backend/app/main.py](backend/app/main.py)). Las rutas incluyen health, movimientos, facets, resumen por periodo, categorias principales, comparativa, alertas y filtros B2B/B2C ([backend/app/routes.py](backend/app/routes.py)). Para responderlas, `routes.py` genera movimientos sinteticos con `generate_mock_movements(seed=42)`; no se observa una conexion a persistencia en ese flujo. La carpeta de tests del backend contiene pruebas de rutas y filtros ([backend/tests/test_routes.py](backend/tests/test_routes.py)).

## Tabla/Rastro de Verificacion

| Estado | Afirmacion | Evidencia / correccion |
| --- | --- | --- |
| ✅ Verificado | Compose define dos servicios, `frontend` y `backend`, y los puertos publicados `5173`, `8000` y `5678`. | [docker-compose.yml](docker-compose.yml); procesos definidos en [frontend/Dockerfile](frontend/Dockerfile) y [backend/Dockerfile](backend/Dockerfile). |
| ✅ Verificado | El frontend se sirve con Vite y envia las peticiones `/api` a `http://backend:8000`. | [frontend/Dockerfile](frontend/Dockerfile), [frontend/package.json](frontend/package.json) y [frontend/vite.config.ts](frontend/vite.config.ts). |
| ✅ Verificado | La pantalla principal consulta `/api/metrics` y deriva de esa respuesta sus KPIs y datos mensuales. | [frontend/src/App.tsx](frontend/src/App.tsx) y [frontend/src/lib/financial-utils.ts](frontend/src/lib/financial-utils.ts). |
| ✅ Verificado | El backend ofrece el health check y varias rutas de metricas; los handlers generan datos simulados con semilla `42`. | [backend/app/routes.py](backend/app/routes.py). |
| ✅ Verificado | Los README documentan `docker compose up --build`, las URLs `localhost:5173`, `localhost:8000` y `/docs`. | [README.es.md](README.es.md) y [README.md](README.md); los puertos tambien aparecen en [docker-compose.yml](docker-compose.yml). |
| ❌ Incorrecto / Corregido | Afirmar que existe una base de datos o servicio de persistencia no esta respaldado. | Compose solo declara `frontend` y `backend` ([docker-compose.yml](docker-compose.yml)); las dependencias backend no incluyen driver ni ORM ([backend/requirements.txt](backend/requirements.txt)); las rutas crean datos simulados ([backend/app/routes.py](backend/app/routes.py)). |
| ❌ Incorrecto / Corregido | Afirmar que la interfaz consume todas las rutas del backend es incorrecto. | `App.tsx` solo hace `fetch` a `/api/metrics` ([frontend/src/App.tsx](frontend/src/App.tsx)); que existan otras rutas en [backend/app/routes.py](backend/app/routes.py) no demuestra que esta pantalla las llame. |
| ❓ Sin verificar | La etiqueta de periodo visible (`2024 - Full Year`) no coincide necesariamente con las fechas de la API. | La etiqueta esta fija en [frontend/src/App.tsx](frontend/src/App.tsx), mientras que [backend/app/routes.py](backend/app/routes.py) elige el año de cada mes en funcion de la fecha actual del servidor. No se puede deducir del codigo si la etiqueta o la generacion dinamica es la deseada. |
| ❓ Sin verificar | La disponibilidad real de las URLs, los puertos en el host y el resultado de los tests no se valida solo leyendo configuracion. | Los puertos y comandos estan configurados en [docker-compose.yml](docker-compose.yml), [backend/Dockerfile](backend/Dockerfile), [frontend/Dockerfile](frontend/Dockerfile) y [frontend/package.json](frontend/package.json); deben comprobarse ejecutando los comandos de esta guia. |
| ❓ Sin verificar | `frontend/src/lib/mock-data.ts` contiene movimientos estaticos, pero no esta confirmado que formen parte del flujo de la pantalla. | La declaracion existe en [frontend/src/lib/mock-data.ts](frontend/src/lib/mock-data.ts); el flujo de [frontend/src/App.tsx](frontend/src/App.tsx) usa la respuesta de red de `/api/metrics`. |

No se identifico en el analisis una afirmacion anterior demostrablemente falsa que hubiera que revertir; las filas de correccion registran conclusiones que no deben suponerse a partir de este repositorio.