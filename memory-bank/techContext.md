# Technical Context

## Stack

- **Frontend:** React `^19.2.4`, React DOM `^19.2.4`, TypeScript `~6.0.2`, Vite `^8.0.4` y Recharts `^3.8.1`; dependencias y scripts en [frontend/package.json](../frontend/package.json).
- **Backend:** FastAPI, `uvicorn[standard]`, debugpy, pytest, pytest-cov e httpx; declarados sin versiones fijadas en [backend/requirements.txt](../backend/requirements.txt). Ese archivo tampoco declara una versión mínima de Python; la imagen Docker usa `python:3.13-slim` ([backend/Dockerfile](../backend/Dockerfile)).
- **Estilos y gráficos:** Tailwind CSS 4 mediante el plugin Vite y Recharts, declarados en [frontend/package.json](../frontend/package.json) y configurados en [frontend/vite.config.ts](../frontend/vite.config.ts).

## Docker y ejecución

- Compose define dos servicios, `frontend` y `backend`, no un servicio de base de datos ([docker-compose.yml](../docker-compose.yml)).
- El contenedor frontend usa `node:24-alpine`, instala paquetes con `npm install` y ejecuta Vite en `5173` ([frontend/Dockerfile](../frontend/Dockerfile)).
- El contenedor backend usa `python:3.13-slim`; arranca Uvicorn con reload y debugpy en `5678`, y publica la API en `8000` ([backend/Dockerfile](../backend/Dockerfile)).
- Compose publica `5173`, `8000` y `5678`, monta el código de cada servicio y configura `frontend` con `depends_on: backend` ([docker-compose.yml](../docker-compose.yml)).
- El comando documentado para levantar los servicios es `docker compose up --build`; las URLs locales documentadas son frontend `http://localhost:5173`, backend `http://localhost:8000` y docs `http://localhost:8000/docs` ([README.es.md](../README.es.md)).

## Persistencia y configuración

No hay base de datos declarada en [docker-compose.yml](../docker-compose.yml), ni ORM/driver en [backend/requirements.txt](../backend/requirements.txt). Los handlers de [backend/app/routes.py](../backend/app/routes.py) crean movimientos con `generate_mock_movements(seed=42)`; por tanto, este repositorio no configura persistencia financiera.

El proxy de Vite reenvía `/api` a `http://backend:8000` ([frontend/vite.config.ts](../frontend/vite.config.ts)). El backend configura CORS con origen `*` y credenciales habilitadas ([backend/app/main.py](../backend/app/main.py)); el código por sí solo no especifica una política diferente para producción.

## Dependencias reproducibles

`frontend/package-lock.json` existe, pero el Dockerfile usa `npm install` ([frontend/package-lock.json](../frontend/package-lock.json), [frontend/Dockerfile](../frontend/Dockerfile)). Los requisitos Python están sin pin de versión ([backend/requirements.txt](../backend/requirements.txt)). Estos son hechos de configuración, no una afirmación de que una instalación concreta falle.
