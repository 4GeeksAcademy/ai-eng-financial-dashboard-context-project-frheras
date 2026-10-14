import type { BusinessType, Category, OperationType } from './api-types'

/** Filtro opcional por fechas para los endpoints que lo declaran.
 * @see GET /api/metrics/alerts
 * @see GET /api/metrics/categories/top
 * @see GET /api/metrics
 * @see GET /api/metrics/summary
 * @see GET /api/metrics/b2b
 * @see GET /api/metrics/b2c
 */
export interface DateRangeFilter {
  /** Fecha inicial inclusiva; formato YYYY-MM-DD; opcional.
   * @see GET /api/metrics/alerts
   * @see GET /api/metrics/categories/top
   * @see GET /api/metrics
   * @see GET /api/metrics/summary
   * @see GET /api/metrics/b2b
   * @see GET /api/metrics/b2c
   */
  start_date?: string

  /** Fecha final inclusiva; formato YYYY-MM-DD; opcional.
   * @see GET /api/metrics/alerts
   * @see GET /api/metrics/categories/top
   * @see GET /api/metrics
   * @see GET /api/metrics/summary
   * @see GET /api/metrics/b2b
   * @see GET /api/metrics/b2c
   */
  end_date?: string
}

/** Parámetros del endpoint de alertas.
 * @see GET /api/metrics/alerts
 */
export interface AlertsParams extends DateRangeFilter {
  /** Umbral numérico opcional; mínimo 0, sin máximo declarado, default 0.3. La API rechaza valores negativos con HTTP 422. La UI aplica el rango del PM (0.01–1.0).
   * @see GET /api/metrics/alerts
   */
  threshold?: number

  /** Agrupación calendario. Valores: 'day', 'week', 'month'; default 'month'.
   * @see GET /api/metrics/alerts
   */
  group_by?: 'day' | 'week' | 'month'

  /** Línea de negocio opcional: 'B2B' o 'B2C'; omitir para evaluar ambos grupos conjuntamente.
   * @see GET /api/metrics/alerts
   */
  business_type?: BusinessType
}

/** Parámetros del ranking de categorías.
 * @see GET /api/metrics/categories/top
 */
export interface TopCategoriesParams extends DateRangeFilter {
  /** Tipo de operación que se clasifica. Valores válidos: 'income', 'outcome'; default API 'outcome'.
   * @see GET /api/metrics/categories/top
   */
  operation_type?: OperationType

  /** Cantidad máxima de categorías solicitadas. Entero entre 1 y 20; default API 5.
   * @see GET /api/metrics/categories/top
   */
  limit?: number

  /** Línea de negocio para filtrar. Valores válidos: 'B2B', 'B2C'; opcional.
   * @see GET /api/metrics/categories/top
   */
  business_type?: BusinessType
}

/** Parámetros de los movimientos del dashboard.
 * @see GET /api/metrics
 */
export interface MetricsParams extends DateRangeFilter {
  /** Categoría opcional: 'suppliers', 'sales', 'operational', 'administrative', 'others'.
   * @see GET /api/metrics
   */
  category?: Category

  /** Operación opcional: 'income' o 'outcome'; omitir para incluir ambas.
   * @see GET /api/metrics
   */
  operation_type?: OperationType
}
