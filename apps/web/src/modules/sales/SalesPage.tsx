// EJEMPLO: adaptar a la lógica del rubro concreto.
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Table } from '../../ui/Table';
import { useApi } from '../../lib/useApi';
import { apiFetch } from '../../lib/apiFetch';
import type { Sale } from '@template/shared';

export function SalesPage() {
  const { data, loading, refetch } = useApi<Sale[]>('/sales');
  const [form, setForm] = useState({ itemId: '', quantity: 1, unitPrice: 0 });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await apiFetch('/sales', { method: 'POST', body: JSON.stringify(form) });
    setForm({ itemId: '', quantity: 1, unitPrice: 0 });
    refetch();
  }

  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold text-text">Ventas</h2>

      <form onSubmit={handleSubmit} className="mb-4 flex flex-wrap gap-2">
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
          ]}
          rows={data ?? []}
          rowKey={(s) => s.id}
        />
      )}
    </Card>
  );
}
