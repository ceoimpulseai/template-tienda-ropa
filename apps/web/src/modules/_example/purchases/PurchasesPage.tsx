// EJEMPLO: adaptar a la lógica del rubro concreto.
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Card } from '../../../ui/Card';
import { Button } from '../../../ui/Button';
import { Input } from '../../../ui/Input';
import { Table } from '../../../ui/Table';
import { Modal } from '../../../ui/Modal';
import { PageHeader } from '../../../components/PageHeader';
import { useApi } from '../../../lib/useApi';
import { apiFetch } from '../../../lib/apiFetch';
import type { Item, Purchase, Supplier } from '@template/shared';

export function PurchasesPage() {
  const { data: purchases, loading, refetch } = useApi<Purchase[]>('/purchases');
  const { data: items } = useApi<Item[]>('/items');
  const { data: suppliers } = useApi<Supplier[]>('/suppliers');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ itemId: '', quantity: 1, unitCost: 0, supplierId: '' });

  function openCreate() {
    setForm({ itemId: '', quantity: 1, unitCost: 0, supplierId: '' });
    setModalOpen(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const { supplierId, ...rest } = form;
    await apiFetch('/purchases', {
      method: 'POST',
      body: JSON.stringify(supplierId ? { ...rest, supplierId } : rest),
    });
    setModalOpen(false);
    refetch();
  }

  function supplierName(id: string | null): string {
    if (!id) return '—';
    const supplier = suppliers?.find((s) => s.id === id);
    return supplier?.name ?? id;
  }

  return (
    <div>
      <PageHeader
        title="Compras"
        description="Registro y control de compras de mercadería e insumos a proveedores."
        action={
          <Button type="button" onClick={openCreate}>
            Nueva compra
          </Button>
        }
      />

      <Card>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva compra">
        <form onSubmit={handleSubmit} className="space-y-3">
          <select
            value={form.itemId}
            onChange={(e) => setForm({ ...form, itemId: e.target.value })}
            required
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text"
          >
            <option value="">Seleccionar producto</option>
            {(items ?? []).map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} — ${i.price}
              </option>
            ))}
          </select>
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
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text"
          >
            <option value="">Sin proveedor</option>
            {(suppliers ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Registrar compra</Button>
          </div>
        </form>
      </Modal>
    </Card>
    </div>
  );
}
