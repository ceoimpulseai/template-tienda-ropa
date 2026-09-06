// EJEMPLO: adaptar a la lógica del rubro concreto.
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Card } from '../../../ui/Card';
import { Button } from '../../../ui/Button';
import { Input } from '../../../ui/Input';
import { Checkbox } from '../../../ui/Checkbox';
import { Table } from '../../../ui/Table';
import { Badge } from '../../../ui/Badge';
import { Modal } from '../../../ui/Modal';
import { PageHeader } from '../../../components/PageHeader';
import { useApi } from '../../../lib/useApi';
import { apiFetch } from '../../../lib/apiFetch';
import type { Item, Sale } from '@template/shared';

export function SalesPage() {
  const { data, loading, refetch } = useApi<Sale[]>('/sales');
  const { data: items } = useApi<Item[]>('/items');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    itemId: '',
    customerId: '',
    quantity: 1,
    unitPrice: 0,
    isInternal: false,
    amountReceived: undefined as number | undefined,
  });

  function openCreate() {
    setForm({ itemId: '', customerId: '', quantity: 1, unitPrice: 0, isInternal: false, amountReceived: undefined });
    setModalOpen(true);
  }

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
    setModalOpen(false);
    refetch();
  }

  return (
    <div>
      <PageHeader
        title="Ventas"
        description="Historial y registro de ventas cobradas e internas de tu comercio."
        action={
          <Button type="button" onClick={openCreate}>
            Nueva venta
          </Button>
        }
      />

      <Card>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva venta">
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
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Registrar venta</Button>
          </div>
        </form>
      </Modal>
    </Card>
    </div>
  );
}
