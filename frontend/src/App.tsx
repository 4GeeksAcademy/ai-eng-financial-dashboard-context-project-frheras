import { lazy, Suspense, useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { KPIRow } from "@/components/dashboard/kpi-row";
import { Skeleton } from "@/components/ui/skeleton";
import { type FinancialMovement } from "@/lib/financial-types";
import { computeKPIs, computeMonthlyData } from "@/lib/financial-utils";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const IncomeOutcomeChart = lazy(() =>
  import("@/components/dashboard/income-outcome-chart").then((module) => ({
    default: module.IncomeOutcomeChart,
  })),
);
const ProfitPercentChart = lazy(() =>
  import("@/components/dashboard/profit-percent-chart").then((module) => ({
    default: module.ProfitPercentChart,
  })),
);

function ChartLoadingFallback() {
  return (
    <div className="min-h-[380px] rounded-lg border border-border/60 bg-card p-6">
      <span className="sr-only" role="status" aria-live="polite">
        Loading chart
      </span>
      <Skeleton className="h-5 w-52" />
      <Skeleton className="mt-4 h-3 w-64" />
      <Skeleton className="mt-6 h-[280px] w-full rounded-lg" />
    </div>
  );
}

async function fetchFinancialData(): Promise<FinancialMovement[]> {
  const response = await fetch(`${API_BASE_URL}/api/metrics`);
  if (!response.ok) {
    throw new Error(`Failed to fetch financial data: ${response.status}`);
  }
  return response.json();
}

function App() {
  const [movements, setMovements] = useState<FinancialMovement[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const metrics = movements === null ? null : computeKPIs(movements);
  const monthlyData = movements === null ? [] : computeMonthlyData(movements);

  useEffect(() => {
    fetchFinancialData()
      .then(setMovements)
      .catch(() => {
        setError(
          "No se pudo cargar la informacion financiera. Revisa la API de backend.",
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [retryAttempt]);

  return (
    <main className="dark min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8">
          <DashboardHeader />

          {loading ? (
            <p className="sr-only" role="status" aria-live="polite">
              Loading financial data
            </p>
          ) : null}

          {error ? (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive-foreground"
            >
              <p lang="es">{error}</p>
              <button
                type="button"
                className="mt-3 min-h-11 rounded-md border border-current px-4 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  setRetryAttempt((attempt) => attempt + 1);
                }}
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <section aria-label="Key performance indicators" aria-busy={loading}>
                <KPIRow metrics={metrics} loading={loading} />
              </section>

              <section
                aria-label="Financial charts"
                aria-busy={loading}
                className="grid grid-cols-1 gap-4 xl:grid-cols-2"
              >
                <Suspense fallback={<ChartLoadingFallback />}>
                  <IncomeOutcomeChart data={monthlyData} loading={loading} />
                </Suspense>
                <Suspense fallback={<ChartLoadingFallback />}>
                  <ProfitPercentChart data={monthlyData} loading={loading} />
                </Suspense>
              </section>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default App;
