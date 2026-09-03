import type { ReactNode } from 'react';

interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
}

const alignClasses = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
};

/**
 * Table — minimalist editorial style.
 * Border 1px solid on outer wrapper, 1px border-bottom on rows (no shadows).
 * Empty state is a borderless, dashed-divider hint.
 */
export function Table<T>({ columns, rows, rowKey, emptyMessage = 'Sin datos' }: TableProps<T>) {
  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center border-t border-b border-border py-16 text-sm text-text-muted">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.header}
                scope="col"
                style={column.width ? { width: column.width } : undefined}
                className={`border-b border-border px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-text-muted ${alignClasses[column.align ?? 'left']}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className="border-b border-border last:border-0 transition-colors hover:bg-bg-subtle"
            >
              {columns.map((column) => (
                <td
                  key={column.header}
                  className={`px-4 py-3 text-text ${alignClasses[column.align ?? 'left']}`}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
