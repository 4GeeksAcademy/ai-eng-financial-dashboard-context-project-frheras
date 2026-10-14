import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { type MonthlyDataPoint } from '@/lib/financial-types'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'

interface ProfitPercentChartProps {
  data: MonthlyDataPoint[]
  loading?: boolean
}

interface TooltipPayload {
  name: string
  value: number
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const value = payload[0]?.value ?? 0
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-lg text-sm">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: 'var(--chart-profit)' }}
        />
        <span className="text-muted-foreground">Profit margin:</span>
        <span className="font-medium text-foreground ml-auto pl-4">{value.toFixed(1)}%</span>
      </div>
    </div>
  )
}

export function ProfitPercentChart({ data, loading }: ProfitPercentChartProps) {
  if (loading) {
    return (
      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <Skeleton className="h-5 w-52" />
          <Skeleton className="h-3 w-64 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] w-full rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  const hasData = data.some((d) => d.profitPercent !== 0)
  const highestMargin = data.reduce<MonthlyDataPoint | null>(
    (highest, point) =>
      (!highest || point.profitPercent > highest.profitPercent ? point : highest),
    null,
  )
  const lowestMargin = data.reduce<MonthlyDataPoint | null>(
    (lowest, point) =>
      (!lowest || point.profitPercent < lowest.profitPercent ? point : lowest),
    null,
  )
  const chartSummary =
    hasData && highestMargin && lowestMargin
      ? `Profit margin peaks in ${highestMargin.month} at ${highestMargin.profitPercent.toFixed(1)} percent and is lowest in ${lowestMargin.month} at ${lowestMargin.profitPercent.toFixed(1)} percent.`
      : 'No profit margin data is available.'

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-4">
        <CardTitle id="profit-percent-title" className="text-base font-semibold">
          Profit Margin %
        </CardTitle>
        <CardDescription>Monthly profit as a percentage of total income</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex h-[280px] items-center justify-center text-muted-foreground text-sm">
            No data available to display
          </div>
        ) : (
          <>
            <div
              role="group"
              aria-labelledby="profit-percent-title"
              aria-describedby="profit-percent-summary"
            >
              <p id="profit-percent-summary" className="sr-only">
                {chartSummary}
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.6} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v.toFixed(0)}%`}
                    width={40}
                    domain={['auto', 'auto']}
                  />
                  <ReferenceLine y={0} stroke="var(--color-border)" strokeDasharray="4 4" />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="profitPercent"
                    name="profitPercent"
                    stroke="var(--chart-profit)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: 'var(--chart-profit)', strokeWidth: 0 }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <details className="mt-4">
              <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                View data table
              </summary>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[20rem] text-left text-sm">
                  <caption className="sr-only">Monthly profit margin percentages</caption>
                  <thead>
                    <tr>
                      <th scope="col" className="py-2 pr-4">Month</th>
                      <th scope="col" className="py-2 pr-4">Profit margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((point) => (
                      <tr key={point.month} className="border-t border-border/60">
                        <th scope="row" className="py-2 pr-4 font-medium">{point.month}</th>
                        <td className="py-2 pr-4">{point.profitPercent.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </>
        )}
      </CardContent>
    </Card>
  )
}
