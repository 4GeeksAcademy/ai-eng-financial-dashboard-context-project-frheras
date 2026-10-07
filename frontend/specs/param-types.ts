import type { BusinessType, OperationType } from './api-types'

/** Filtro opcional por fechas para endpoints que lo declaran.
 * @see GET /api/metrics/alerts
 * @see GET /api/metrics/categories/top
 */
export interface DateRangeFilter {
  /** Fecha inicial inclusiva del filtro. Tipo string; formato YYYY-MM-DD; opcional.
   * @see GET /api/metrics/alerts
   * @see GET /api/metrics/categories/top
   */
  start_date?: string

  /** Fecha final inclusiva del filtro. Tipo string; formato YYYY-MM-DD; opcional.
   * @see GET /api/metrics/alerts
   * @see GET /api/metrics/categories/top
   */
  end_date?: string
}

/** Parámetros del endpoint de alertas.
 * @see GET /api/metrics/alerts
 */
export interface AlertsParams extends DateRangeFilter {
  /** Umbral numérico de anomalía, opcional; default API 0.3. OpenAPI declara mínimo 0 y no declara máximo; la decisión registrada pide rechazar valores fuera de 0.01–1.0.
   * @see GET /api/metrics/alerts
   */
  threshold?: number
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

// TODO: verification.md no confirma los parámetros de fecha de GET /api/metrics.
// Añadir MetricsParams únicamente cuando se verifiquen sus nombres en OpenAPI.