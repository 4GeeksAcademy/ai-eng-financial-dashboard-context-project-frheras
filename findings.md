# Hallazgos de arquitectura y calidad

Alcance: revisión estática del código y la configuración del repositorio. No se ejecutaron los servicios ni los tests para esta revisión; los riesgos de comportamiento se describen como inferencias del código y se indica cómo verificarlos.

## Arquitectura

### A1. Las rutas concentran contrato HTTP, generación de datos y lógica de dominio — impacto medio

`backend/app/routes.py` contiene modelos Pydantic, generador de movimientos simulados, filtros, agregaciones y handlers HTTP. `backend/app/main.py` solo crea FastAPI y registra el router. Esta concentración hace que cambiar la fuente de datos o probar lógica de dominio sin el módulo de rutas resulte más difícil.

**Regla accionable:** mantener los handlers enfocados en validar parámetros y coordinar llamadas; al incorporar una fuente de datos real o crecer la API, separar modelos, proveedor/repositorio de datos y servicios de métricas en módulos propios. Mantener pruebas unitarias de lógica de dominio independientes de `TestClient`.

Evidencia: [backend/app/routes.py](backend/app/routes.py), [backend/app/main.py](backend/app/main.py).

### A2. La pantalla solo integra una parte de la API — impacto medio

La interfaz hace una petición a `GET /api/metrics` y calcula KPIs y series mensuales en el cliente. El backend ofrece también facets, resumen agrupado, categorías principales, comparación y alertas. La existencia de esos endpoints no implica que estén conectados a la pantalla.

**Regla accionable:** documentar qué consumidor usa cada endpoint y decidir explícitamente dónde vive cada agregación. Antes de añadir otra vista, añadir una prueba de integración del flujo UI/API o retirar endpoints que no tengan consumidor previsto.

Evidencia: [frontend/src/App.tsx](frontend/src/App.tsx), [frontend/src/lib/financial-utils.ts](frontend/src/lib/financial-utils.ts), [backend/app/routes.py](backend/app/routes.py).

### A3. El generador de datos altera el estado aleatorio global — impacto bajo/medio

`generate_mock_movements(seed=42)` llama a `random.seed(seed)` y el generador usa el módulo global `random`. Cada petición vuelve a inicializar ese estado compartido del proceso, lo que puede afectar otro código que use aleatoriedad y acopla la reproducibilidad a una variable global.

**Regla accionable:** usar una instancia local `random.Random(seed)` y pasarla a las funciones generadoras; añadir una prueba que compruebe que generar datos no cambia la secuencia del RNG global.

Evidencia: [backend/app/routes.py](backend/app/routes.py).

## Naming

### N1. `/api/metrics` devuelve movimientos individuales — impacto bajo

El endpoint `GET /api/metrics` tiene `response_model=list[FinancialMovement]`; por tanto, entrega movimientos, no una colección de métricas ya agregadas. A la vez, las agregaciones sí aparecen bajo nombres como `/api/metrics/summary` y `/api/metrics/categories/top`, lo que vuelve ambiguo el recurso raíz.

**Regla accionable:** nombrar rutas según la forma y el significado de su recurso. Para cambios futuros, reservar `/metrics` para valores agregados y usar un nombre como `/movements` para registros; si la API ya tiene consumidores, introducir el nombre nuevo con compatibilidad y documentar la retirada del anterior.

Evidencia: [backend/app/routes.py](backend/app/routes.py), [frontend/src/App.tsx](frontend/src/App.tsx).

### N2. Convención de nombres distinta entre DTO y modelo de vista — impacto bajo

Los campos recibidos de la API usan `create_date`, `operation_type` y `business_type`, mientras que los valores calculados en frontend usan `totalIncome`, `profitPercent` y `monthlyData`. `computeKPIs` y `computeMonthlyData` realizan la transformación; DTO y modelos derivados están declarados juntos en `financial-types.ts`, por lo que conviene mantener explícita la frontera entre contrato externo y nombres internos.

**Regla accionable:** conservar el snake_case del contrato backend en tipos DTO; usar camelCase para modelos internos de UI y convertirlos en una frontera explícita si se renombra o transforma información. No renombrar campos JSON solo para satisfacer el estilo del frontend.

Evidencia: [frontend/src/lib/financial-types.ts](frontend/src/lib/financial-types.ts), [frontend/src/App.tsx](frontend/src/App.tsx), [backend/app/routes.py](backend/app/routes.py).

## Error Handling

### E1. El cliente oculta la causa concreta de errores de red o HTTP — impacto medio

`fetchFinancialData` distingue respuestas HTTP no exitosas y lanza un error con el status, pero el `catch` de `App` descarta ese error y solo muestra un mensaje genérico. No hay reintento ni acción de recuperación desde la pantalla.

**Regla accionable:** mantener un mensaje seguro para el usuario, pero registrar o conservar el status y la causa técnica para diagnóstico; distinguir error de red, respuesta HTTP y payload inválido. Añadir una acción de reintento cuando la carga sea recuperable.

Evidencia: [frontend/src/App.tsx](frontend/src/App.tsx).

### E2. La respuesta JSON se acepta sin validación en tiempo de ejecución — impacto medio

`response.json()` se devuelve como `FinancialMovement[]` por anotación TypeScript, pero TypeScript no comprueba la estructura recibida en runtime. Campos ausentes, importes no numéricos o categorías fuera del contrato podrían llegar a los cálculos sin un error de contrato claro.

**Regla accionable:** validar las respuestas externas en runtime con un esquema compartido/generado o un validador en el cliente API; probar al menos un payload inválido y verificar el estado de error visible.

Evidencia: [frontend/src/App.tsx](frontend/src/App.tsx), [frontend/src/lib/financial-types.ts](frontend/src/lib/financial-types.ts).

### E3. El endpoint de comparación no valida el orden del intervalo — impacto medio

`get_metrics_comparison` requiere `start_date` y `end_date`, pero no comprueba que `start_date <= end_date`. Un intervalo invertido puede producir resultados vacíos o comparaciones de periodos anteriores que no corresponden a una solicitud válida.

**Regla accionable:** rechazar intervalos con inicio posterior al fin mediante un error HTTP 4xx claro y añadir pruebas para intervalo invertido, fechas iguales y límites válidos.

Evidencia: [backend/app/routes.py](backend/app/routes.py), [backend/tests/test_routes.py](backend/tests/test_routes.py).

## Testing

### T1. El frontend no prueba el flujo de carga ni los componentes — impacto medio

Las pruebas frontend cubren funciones puras de cálculo y formato; no cubren `App`, los estados de carga/error, la petición a `/api/metrics` ni el renderizado de los gráficos con respuesta realista.

**Regla accionable:** añadir pruebas de componente para éxito, error HTTP y estado vacío; simular `fetch` sin depender de un backend en ejecución. Añadir al menos una prueba de integración del contrato entre la respuesta de movimientos y los KPIs/gráficos.

Evidencia: [frontend/src/lib/financial-utils.test.ts](frontend/src/lib/financial-utils.test.ts), [frontend/src/App.tsx](frontend/src/App.tsx), scripts de test en [frontend/package.json](frontend/package.json).

### T2. Los tests backend no cubren varios límites de fechas — impacto bajo/medio

Hay pruebas de filtros y de comparación con un intervalo normal, pero no se prueba explícitamente el intervalo invertido ni el comportamiento de comparación con `start_date == end_date`. La prueba de generación verifica cantidad y orden, no que el año generado concuerde con el periodo que muestra la UI.

**Regla accionable:** cubrir intervalos límite y validar la fecha mínima/máxima esperada con una fecha de referencia fija; no depender del reloj del sistema en pruebas de periodos.

Evidencia: [backend/tests/test_routes.py](backend/tests/test_routes.py), [backend/app/routes.py](backend/app/routes.py), etiqueta fija en [frontend/src/App.tsx](frontend/src/App.tsx).

## DX

### D1. La imagen frontend instala dependencias con `npm install` pese a tener lockfile — impacto medio

El repositorio incluye `frontend/package-lock.json`, pero [frontend/Dockerfile](frontend/Dockerfile) ejecuta `npm install`. Esto permite resolver dependencias de forma menos estrictamente reproducible que `npm ci` en una construcción basada en lockfile.

**Regla accionable:** usar `npm ci` en la imagen de CI/Docker y mantener `package-lock.json` actualizado con los cambios de dependencias.

Evidencia: [frontend/Dockerfile](frontend/Dockerfile), [frontend/package-lock.json](frontend/package-lock.json), [frontend/package.json](frontend/package.json).

### D2. Las dependencias Python no están fijadas — impacto medio

`backend/requirements.txt` lista paquetes sin versiones. Una reconstrucción posterior puede resolver versiones distintas de FastAPI, Uvicorn o pytest aunque no haya cambiado el código.

**Regla accionable:** fijar versiones compatibles (o adoptar un lockfile Python) y verificar la instalación en CI antes de actualizar dependencias deliberadamente.

Evidencia: [backend/requirements.txt](backend/requirements.txt), instalación durante el build en [backend/Dockerfile](backend/Dockerfile).

### D3. El frontend puede pedir datos antes de que el backend esté listo — impacto medio

Compose usa `depends_on` para ordenar el arranque, pero no define `healthcheck`. Además, `App` hace una petición al montar y no reintenta; si Vite sirve la página antes de que Uvicorn acepte conexiones, la carga inicial puede fallar hasta que se recargue manualmente.

**Regla accionable:** declarar un healthcheck real del backend y usar una condición de dependencia basada en salud cuando la versión de Compose lo soporte; mantener además recuperación del lado cliente porque `depends_on` no sustituye el manejo de errores en runtime.

Evidencia: [docker-compose.yml](docker-compose.yml), [backend/app/routes.py](backend/app/routes.py), [frontend/src/App.tsx](frontend/src/App.tsx).