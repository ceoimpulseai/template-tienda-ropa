// EJEMPLO: adaptar a la lógica del rubro concreto.
import { Card } from '../../../ui/Card';
import { useApi } from '../../../lib/useApi';
import type { DashboardMetrics } from '../../../types/metrics';

export function MetricsPage() {
  const { data, loading } = useApi<DashboardMetrics>('/metrics/dashboard');

  if (loading || !data) return <p className="text-text-muted">Cargando…</p>;

  const tiles: { label: string; value: number }[] = [
    { label: 'Ingresos totales', value: data.totalRevenue },
    { label: 'Costo total', value: data.totalCost },
    { label: 'Ganancia bruta', value: data.grossProfit },
    { label: 'Gastos fijos', value: data.totalFixedCosts },
    { label: 'Ventas', value: data.salesCount },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      {tiles.map((tile) => (
        <Card key={tile.label}>
          <p className="text-sm text-text-muted">{tile.label}</p>
          <p className="text-2xl font-semibold text-text">{tile.value}</p>
        </Card>
      ))}
    </div>
  );
}
