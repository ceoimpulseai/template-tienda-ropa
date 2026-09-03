// EJEMPLO: adaptar a la lógica del rubro concreto.
import { Card } from '../../../ui/Card';
import { useApi } from '../../../lib/useApi';
import type { DashboardMetrics } from '../../../types/metrics';

function formatPercent(value: number | null): string {
  if (value === null) return '—';
  return `${value.toFixed(1)}%`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
}

export function MetricsPage() {
  const { data, loading } = useApi<DashboardMetrics>('/metrics/dashboard');

  if (loading || !data) return <p className="text-text-muted">Cargando…</p>;

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Card>
        <p className="text-sm text-text-muted">Ingresos totales</p>
        <p className="text-2xl font-semibold text-text">{formatCurrency(data.totalRevenue)}</p>
      </Card>
      <Card>
        <p className="text-sm text-text-muted">Costo total</p>
        <p className="text-2xl font-semibold text-text">{formatCurrency(data.totalCost)}</p>
      </Card>
      <Card>
        <p className="text-sm text-text-muted">Ganancia bruta</p>
        <p className="text-2xl font-semibold text-text">{formatCurrency(data.grossProfit)}</p>
      </Card>
      <Card>
        <p className="text-sm text-text-muted">Margen bruto</p>
        <p className="text-2xl font-semibold text-text">{formatPercent(data.grossMarginPercent)}</p>
      </Card>
      <Card>
        <p className="text-sm text-text-muted">Gastos fijos</p>
        <p className="text-2xl font-semibold text-text">{formatCurrency(data.totalFixedCosts)}</p>
      </Card>
      <Card>
        <p className="text-sm text-text-muted">Gastos variables</p>
        <p className="text-2xl font-semibold text-text">{formatCurrency(data.totalVariableCosts)}</p>
      </Card>
      <Card>
        <p className="text-sm text-text-muted">Gastos extraordinarios</p>
        <p className="text-2xl font-semibold text-text">{formatCurrency(data.totalExtraordinaryCosts)}</p>
      </Card>
      <Card>
        <p className="text-sm text-text-muted">Ganancia neta</p>
        <p
          className={`text-2xl font-semibold ${
            data.netProfit >= 0 ? 'text-success' : 'text-danger'
          }`}
        >
          {formatCurrency(data.netProfit)}
        </p>
      </Card>
      <Card>
        <p className="text-sm text-text-muted">Margen neto</p>
        <p className="text-2xl font-semibold text-text">{formatPercent(data.netMarginPercent)}</p>
      </Card>
      <Card>
        <p className="text-sm text-text-muted">Punto de equilibrio</p>
        <p className="text-2xl font-semibold text-text">
          {data.breakEvenRevenue !== null ? formatCurrency(data.breakEvenRevenue) : '—'}
        </p>
      </Card>
      <Card>
        <p className="text-sm text-text-muted">Ventas</p>
        <p className="text-2xl font-semibold text-text">{data.salesCount}</p>
      </Card>
    </div>
  );
}