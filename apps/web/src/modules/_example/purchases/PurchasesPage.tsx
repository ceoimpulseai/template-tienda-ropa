// EJEMPLO: adaptar a la lógica del rubro concreto.
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Card } from '../../../ui/Card';
import { Button } from '../../../ui/Button';
import { Input } from '../../../ui/Input';
import { Table } from '../../../ui/Table';
import { useApi } from '../../../lib/useApi';
import { apiFetch } from '../../../lib/apiFetch';
import type { Purchase, Supplier } from '@template/shared';

export function PurchasesPage() {
  const { data: purchases, loading, refetch } = useApi<Purchase[]>('/purchases');
  const { data: suppliers } = useApi<Supplier[]>('/suppliers');
  const [form, setForm] = useState({ itemId: '', quantity: 1, unitCost: 0, supplierId: '' });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const { supplierId, ...rest } = form;
    await apiFetch('/purchases', {
      method: 'POST',
      body: JSON.stringify(supplierId ? { ...rest, supplierId } : rest),
    });
    setForm({ itemId: '', quantity: 1, unitCost: 0, supplierId: '' });
    refetch();
  }

  function supplierName(id: string | null): string {
    if (!id) return '—';
    const supplier = suppliers?.find((s) => s.id === id);
    return supplier?.name ?? id;
  }

  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold text-text">Compras</h2>

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
          placeholder="Costo unitario"
          value={form.unitCost}
          onChange={(e) => setForm({ ...form, unitCost: Number(e.target.value) })}
          required
        />
        <select
          value={form.supplierId}
          onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
          className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text"
        >
          <option value="">Sin proveedor</option>
          {(suppliers ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
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
            { header: 'Proveedor', render: (p) => supplierName(p.supplierId) },
          ]}
          rows={purchases ?? []}
          rowKey={(p) => p.id}
        />
      )}
    </Card>
  );
}
