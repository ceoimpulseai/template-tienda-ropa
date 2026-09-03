// EJEMPLO: adaptar a la lógica del rubro concreto.
import { Card } from '../../../ui/Card';
import { useApi } from '../../../lib/useApi';
import { formatCurrency, formatPercent } from '../../../lib/format';
import type { Ratios } from '../../../types/financials';

export function RatiosTab() {
  const { data, loading, error } = useApi<Ratios>('/financials/ratios');

  if (error) {
    return <p className="text-danger">Error al cargar ratios financieros</p>;
  }
  if (loading || !data) {
    return <p className="text-text-muted">Cargando…</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Card>
        <p className="text-sm text-text-muted">Margen Bruto</p>
        <p className="text-2xl font-semibold text-text">
          {formatPercent(data.grossMarginPercent)}
        </p>
      </Card>
      <Card>
        <p className="text-sm text-text-muted">Margen Neto</p>
        <p className="text-2xl font-semibold text-text">
          {formatPercent(data.netMarginPercent)}
        </p>
      </Card>
      <Card>
        <p className="text-sm text-text-muted">Ratio Gastos/Ingresos</p>
        <p className="text-2xl font-semibold text-text">
          {formatPercent(data.operatingExpenseRatio)}
        </p>
      </Card>
      <Card>
        <p className="text-sm text-text-muted">Ganancia por Venta</p>
        <p className="text-2xl font-semibold text-text">
          {data.profitPerSale !== null ? formatCurrency(data.profitPerSale) : '—'}
        </p>
      </Card>
    </div>
  );
}