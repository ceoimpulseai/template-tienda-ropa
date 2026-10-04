// EJEMPLO: adaptar a la lógica del rubro concreto.
import { Table } from '../../../ui/Table';
import { useApi } from '../../../lib/useApi';
import { formatCurrency } from '../../../lib/format';
import type { ProductMargin } from '../../../types/financials';

export function ProductMarginsTab() {
  const { data, loading, error } = useApi<ProductMargin[]>('/financials/product-margins');

  if (error) {
    return <p className="text-danger">Error al cargar márgenes por producto</p>;
  }
  if (loading || !data) {
    return <p className="text-text-muted">Cargando…</p>;
  }

  const columns = [
    { header: 'Prenda', render: (row: ProductMargin) => row.itemName },
    {
      header: 'Precio',
      render: (row: ProductMargin) => formatCurrency(row.unitPrice),
      align: 'right' as const,
    },
    {
      header: 'Costo Promedio',
      render: (row: ProductMargin) =>
        row.avgUnitCost !== null ? formatCurrency(row.avgUnitCost) : '—',
      align: 'right' as const,
    },
    {
      header: 'Margen $',
      render: (row: ProductMargin) =>
        row.marginDollars !== null ? formatCurrency(row.marginDollars) : '—',
      align: 'right' as const,
    },
    {
      header: 'Margen %',
      render: (row: ProductMargin) =>
        row.marginPercent !== null ? `${row.marginPercent.toFixed(1)}%` : '—',
      align: 'right' as const,
    },
  ];

  return (
    <Table
      columns={columns}
      rows={data}
      rowKey={(r) => r.itemId}
      emptyMessage="Sin productos con margen calculado"
    />
  );
}