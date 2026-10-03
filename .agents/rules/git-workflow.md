# Git Workflow

## Nombre

Flujo Git y validación de cambios.

## Alcance

Aplica a cambios de código, pruebas, configuración y documentación en este repositorio. Define comprobaciones antes de compartir cambios; no impone nombres de ramas ni convenciones de mensajes de commit que no estén especificadas por el proyecto.

## Justificación

El repositorio define comandos de test, lint y build para el frontend en `frontend/package.json`, tests backend en `backend/tests/` y ejecución integrada en `docker-compose.yml`/`README.es.md`. No se encontró una política de ramas o commits en `AGENTS.md` ni en las guías revisadas, por lo que no se debe presentar una convención inventada como requisito existente.

## Guía específica del proyecto

1. Antes de editar, revisa `git status --short` y conserva cambios preexistentes. Mantén cada cambio enfocado y no descartes modificaciones que no formen parte de la tarea.

2. Ejecuta las comprobaciones del área que modificaste:

   ```bash
   cd frontend
   npm test
   npm run lint
   npm run build
   ```

   Los scripts corresponden a `test`, `lint` y `build` en `frontend/package.json`. Para backend, desde `backend/`, ejecuta `pytest`; `backend/tests/test_routes.py` usa `TestClient` para verificar rutas y filtros.

3. Si el cambio afecta integración, Docker o el contrato entre servicios, desde la raíz valida la configuración y el arranque:

   ```bash
   docker compose config
   docker compose up --build -d
   docker compose ps
   curl -i http://localhost:8000/health
   curl -i http://localhost:8000/api/metrics
   docker compose down
   ```

   Compose publica frontend `5173`, backend `8000` y debugpy `5678` en `docker-compose.yml`; `GET /health` y `GET /api/metrics` están implementados en `backend/app/routes.py`. Ejecuta el chequeo de disponibilidad solo si Docker está disponible y los puertos no están ocupados; informa claramente si no se pudo ejecutar.

4. Mantén reproducibles las dependencias. Si cambias dependencias frontend, actualiza y conserva `frontend/package-lock.json`; las instalaciones automatizadas deben usar el lockfile. Si cambias paquetes Python, actualiza `backend/requirements.txt` de forma deliberada y registra versiones compatibles.

5. Actualiza documentación cuando cambien entry points, comandos, puertos, endpoints o requisitos. Las instrucciones actuales están en `README.es.md`; confirma que siguen coincidiendo con `docker-compose.yml`, ambos Dockerfiles y `frontend/vite.config.ts`.

6. No añadas secretos, archivos `.env` locales ni credenciales a Git. El frontend admite `VITE_API_BASE_URL` en `frontend/src/App.tsx`; configura valores sensibles o específicos de entorno fuera del control de versiones.

7. No presupongas una estrategia de ramas o formato de commits. Sigue la política de la persona/equipo que integra el cambio y evita crear ramas o commits si la tarea no lo solicita.
