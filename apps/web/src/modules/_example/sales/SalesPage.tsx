// EJEMPLO: adaptar a la lógica del rubro concreto.
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Card } from '../../../ui/Card';
import { Button } from '../../../ui/Button';
import { Input } from '../../../ui/Input';
import { Checkbox } from '../../../ui/Checkbox';
import { Table } from '../../../ui/Table';
import { Badge } from '../../../ui/Badge';
import { useApi } from '../../../lib/useApi';
import { apiFetch } from '../../../lib/apiFetch';
import type { Sale } from '@template/shared';

export function SalesPage() {
  const { data, loading, refetch } = useApi<Sale[]>('/sales');
  const [form, setForm] = useState({
    itemId: '',
    customerId: '',
    quantity: 1,
    unitPrice: 0,
    isInternal: false,
    amountReceived: undefined as number | undefined,
  });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const { customerId, amountReceived, isInternal, ...rest } = form;
    const payload: Record<string, unknown> = { ...rest, isInternal };
    if (customerId) payload.customerId = customerId;
    if (isInternal) {
      payload.amountReceived = amountReceived ?? 0;
    } else if (amountReceived !== undefined) {
      payload.amountReceived = amountReceived;
    }
    await apiFetch('/sales', { method: 'POST', body: JSON.stringify(payload) });
    setForm({ itemId: '', customerId: '', quantity: 1, unitPrice: 0, isInternal: false, amountReceived: undefined });
    refetch();
  }

  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold text-text">Ventas</h2>

      <form onSubmit={handleSubmit} className="mb-4 flex flex-wrap items-end gap-2">
        <Input
          placeholder="ID de producto"
          value={form.itemId}
          onChange={(e) => setForm({ ...form, itemId: e.target.value })}
          required
        />
        <Input
          type="number"
          placeholder="Cantidad"
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
          required
        />
        <Input
          type="number"
          placeholder="Precio unitario"
          value={form.unitPrice}
          onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })}
          required
        />
        <Input
          placeholder="ID de cliente (opcional)"
          value={form.customerId}
          onChange={(e) => setForm({ ...form, customerId: e.target.value })}
        />
        <label className="flex items-center gap-2 text-sm text-text">
          <Checkbox
            checked={form.isInternal}
            onChange={(e) => {
              setForm({ ...form, isInternal: e.target.checked, amountReceived: e.target.checked ? 0 : undefined });
            }}
          />
          Venta interna
        </label>
        {form.isInternal && (
          <Input
            type="number"
            placeholder="Monto recibido"
            value={form.amountReceived ?? 0}
            onChange={(e) => setForm({ ...form, amountReceived: Number(e.target.value) })}
          />
        )}
        <Button type="submit">Registrar venta</Button>
      </form>

      {loading ? (
        <p className="text-text-muted">Cargando…</p>
      ) : (
        <Table<Sale>
          columns={[
            { header: 'Producto', render: (s) => s.itemId },
            { header: 'Cantidad', render: (s) => s.quantity },
            { header: 'Precio unitario', render: (s) => s.unitPrice },
            {
              header: 'Tipo',
              render: (s) => (
                <Badge tone={s.isInternal ? 'warning' : 'success'}>
                  {s.isInternal ? 'Interna' : 'Normal'}
                </Badge>
              ),
            },
            { header: 'Recibido', render: (s) => `$${s.amountReceived}` },
          ]}
          rows={data ?? []}
          rowKey={(s) => s.id}
        />
      )}
    </Card>
  );
}
