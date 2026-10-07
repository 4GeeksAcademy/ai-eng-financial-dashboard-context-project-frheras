export type OperationType = 'income' | 'outcome'
export type BusinessType = 'B2B' | 'B2C'
export type Category = 'suppliers' | 'sales' | 'operational' | 'administrative' | 'others'

/** Facetas disponibles para filtrar los movimientos financieros.
 * @see GET /api/metrics/facets
 */
export interface FacetsResponse {
  /** Tipos de operación disponibles. Valores válidos: 'income', 'outcome'.
   * @see GET /api/metrics/facets
   */
  operation_types: OperationType[]

  /** Líneas de negocio disponibles. Valores válidos: 'B2B', 'B2C'.
   * @see GET /api/metrics/facets
   */
  business_types: BusinessType[]

  /** Categorías disponibles. Valores válidos: 'suppliers', 'sales', 'operational', 'administrative', 'others'.
   * @see GET /api/metrics/facets
   */
  categories: Category[]

  /** Fecha más antigua disponible en el dataset. Formato válido: YYYY-MM-DD; observada: '2025-10-02'.
   * @see GET /api/metrics/facets
   */
  min_date: string

  /** Fecha más reciente disponible en el dataset. Formato válido: YYYY-MM-DD; observada: '2026-09-28'.
   * @see GET /api/metrics/facets
   */
  max_date: string
}

/** Una anomalía de gasto agregada en un período.
 * @see GET /api/metrics/alerts
 */
export interface AlertEntry {
  /** Etiqueta del período de agregación. OpenAPI no declara enum ni formato; ejemplos observados: '2025-12', '2026-03', '2026-06', '2026-08'.
   * @see GET /api/metrics/alerts
   */
  period: string

  /** Gasto total observado en el período. Valores válidos: número; rango no declarado; ejemplo observado: 103378.98.
   * @see GET /api/metrics/alerts
   */
  outcome_total: number

  /** Media base usada para comparar el gasto. Valores válidos: número; rango no declarado; ejemplo observado: 51174.1.
   * @see GET /api/metrics/alerts
   */
  baseline_average: number

  /** Incremento expresado como ratio. Valores válidos: número; rango no declarado; ejemplo observado: 1.0201.
   * @see GET /api/metrics/alerts
   */
  increase_ratio: number
}

/** Respuesta de alertas: una lista de entradas de alerta.
 * @see GET /api/metrics/alerts
 */
export interface AlertsResponse extends Array<AlertEntry> {
  /** Cada índice contiene una alerta. Valores válidos: una entrada que cumple AlertEntry.
   * @see GET /api/metrics/alerts
   */
  [index: number]: AlertEntry
}

/** Una categoría incluida en el ranking de ingresos o gastos.
 * @see GET /api/metrics/categories/top
 */
export interface CategoryEntry {
  /** Categoría del ranking. Valores válidos: 'suppliers', 'sales', 'operational', 'administrative', 'others'.
   * @see GET /api/metrics/categories/top
   */
  category: Category

  /** Tipo de operación de la categoría. Valores válidos: 'income', 'outcome'.
   * @see GET /api/metrics/categories/top
   */
  operation_type: OperationType

  /** Importe total de la categoría. Valores válidos: número; rango no declarado; ejemplo observado: 1132097.38.
   * @see GET /api/metrics/categories/top
   */
  total_amount: number
}

/** Respuesta de categorías principales: una lista de entradas ordenadas por importe.
 * @see GET /api/metrics/categories/top
 */
export interface TopCategoriesResponse extends Array<CategoryEntry> {
  /** Cada índice contiene una categoría del ranking. Valores válidos: una entrada que cumple CategoryEntry.
   * @see GET /api/metrics/categories/top
   */
  [index: number]: CategoryEntry
}

// TODO: `test_flag` está marcado como ficticio en verification.md; no forma parte del contrato.