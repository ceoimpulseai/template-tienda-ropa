// EJEMPLO: adaptar a la lógica del rubro concreto.
import { Card } from '../../../ui/Card';
import { useApi } from '../../../lib/useApi';
import { formatCurrency, formatPercent } from '../../../lib/format';
import type { IncomeStatement } from '../../../types/financials';

export function IncomeStatementTab() {
  const { data, loading, error } = useApi<IncomeStatement>('/financials/income-statement');

  if (error) {
    return <p className="text-danger">Error al cargar estado de resultados</p>;
  }
  if (loading || !data) {
    return <p className="text-text-muted">Cargando…</p>;
  }

  return (
    <Card>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-text-muted">Ingresos totales</span>
          <span className="font-medium text-text">{formatCurrency(data.revenue)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">Costo de Ventas (COGS)</span>
          <span className="font-medium text-text">{formatCurrency(data.cogs)}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-3">
          <span className="font-semibold text-text">Margen Bruto</span>
          <span className="font-semibold text-text">
            {formatCurrency(data.grossProfit)} ({formatPercent(data.grossMarginPercent)})
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">Gastos Fijos</span>
          <span className="font-medium text-text">{formatCurrency(data.fixedCosts)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">Gastos Variables</span>
          <span className="font-medium text-text">{formatCurrency(data.variableCosts)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">Gastos Extraordinarios</span>
          <span className="font-medium text-text">{formatCurrency(data.extraordinaryCosts)}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-3">
          <span className="font-semibold text-text">Resultado Neto</span>
          <span
            className={`font-semibold ${data.netProfit >= 0 ? 'text-success' : 'text-danger'}`}
          >
            {formatCurrency(data.netProfit)} ({formatPercent(data.netMarginPercent)})
          </span>
        </div>
      </div>
    </Card>
  );
}