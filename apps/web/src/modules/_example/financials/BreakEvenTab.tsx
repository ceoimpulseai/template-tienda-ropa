// EJEMPLO: adaptar a la lógica del rubro concreto.
import { Card } from '../../../ui/Card';
import { useApi } from '../../../lib/useApi';
import { formatCurrency, formatPercent } from '../../../lib/format';
import type { BreakEven } from '../../../types/financials';

export function BreakEvenTab() {
  const { data, loading, error } = useApi<BreakEven>('/financials/break-even');

  if (error) {
    return <p className="text-danger">Error al cargar punto de equilibrio</p>;
  }
  if (loading || !data) {
    return <p className="text-text-muted">Cargando…</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      <Card>
        <p className="text-sm text-text-muted">Costos Fijos</p>
        <p className="text-2xl font-semibold text-text">
          {formatCurrency(data.totalFixedCosts)}
        </p>
      </Card>
      <Card>
        <p className="text-sm text-text-muted">Costos Variables</p>
        <p className="text-2xl font-semibold text-text">
          {formatCurrency(data.totalVariableCosts)}
        </p>
      </Card>
      <Card>
        <p className="text-sm text-text-muted">Contribución Marginal</p>
        <p className="text-2xl font-semibold text-text">
          {formatPercent(data.contributionMarginRatio)}
        </p>
      </Card>
      <Card>
        <p className="text-sm text-text-muted">Punto de Equilibrio (ventas)</p>
        <p className="text-2xl font-semibold text-text">
          {data.breakEvenRevenue !== null ? formatCurrency(data.breakEvenRevenue) : '—'}
        </p>
      </Card>
      <Card>
        <p className="text-sm text-text-muted">Punto de Equilibrio (unidades)</p>
        <p className="text-2xl font-semibold text-text">
          {data.breakEvenUnits !== null ? `${data.breakEvenUnits} unidades` : '—'}
        </p>
      </Card>
    </div>
  );
}