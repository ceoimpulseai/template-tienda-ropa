import type { ReactNode } from 'react';

interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
}

export function Table<T>({ columns, rows, rowKey, emptyMessage = 'Sin datos' }: TableProps<T>) {
  if (rows.length === 0) {
    return <p className="p-4 text-sm text-text-muted">{emptyMessage}</p>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-border text-text-muted">
          {columns.map((column) => (
            <th key={column.header} className="px-3 py-2 font-medium">
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={rowKey(row)} className="border-b border-border last:border-0">
            {columns.map((column) => (
              <td key={column.header} className="px-3 py-2 text-text">
                {column.render(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
