// EJEMPLO: adaptar a la lógica del rubro concreto.
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Card } from '../../../ui/Card';
import { Button } from '../../../ui/Button';
import { Input } from '../../../ui/Input';
import { Table } from '../../../ui/Table';
import { useApi } from '../../../lib/useApi';
import { apiFetch } from '../../../lib/apiFetch';
import type { Purchase } from '@template/shared';

export function PurchasesPage() {
  const { data, loading, refetch } = useApi<Purchase[]>('/purchases');
  const [form, setForm] = useState({ itemId: '', quantity: 1, unitCost: 0 });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await apiFetch('/purchases', { method: 'POST', body: JSON.stringify(form) });
    setForm({ itemId: '', quantity: 1, unitCost: 0 });
    refetch();
  }

  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold text-text">Compras</h2>

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
          placeholder="Costo unitario"
          value={form.unitCost}
          onChange={(e) => setForm({ ...form, unitCost: Number(e.target.value) })}
          required
        />
        <Button type="submit">Registrar compra</Button>
      </form>

      {loading ? (
        <p className="text-text-muted">Cargando…</p>
      ) : (
        <Table<Purchase>
          columns={[
            { header: 'Producto', render: (p) => p.itemId },
            { header: 'Cantidad', render: (p) => p.quantity },
            { header: 'Costo unitario', render: (p) => p.unitCost },
          ]}
          rows={data ?? []}
          rowKey={(p) => p.id}
        />
      )}
    </Card>
  );
}
