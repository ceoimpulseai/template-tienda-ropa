import { useState } from 'react';
import type { FormEvent } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Checkbox } from '../../ui/Checkbox';
import { Table } from '../../ui/Table';
import { Modal } from '../../ui/Modal';
import { useApi } from '../../lib/useApi';
import { apiFetch } from '../../lib/apiFetch';
import { businessConfig } from '../../config/business.config';
import type { Item } from '@template/shared';

export function ItemsPage() {
  const { data, loading, error, refetch } = useApi<Item[]>('/items');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', stock: '' });

  function openCreate() {
    setForm({ name: '', price: '', stock: '' });
    setModalOpen(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await apiFetch('/items', {
      method: 'POST',
      body: JSON.stringify({ name: form.name, price: Number(form.price), stock: Number(form.stock) }),
    });
    setModalOpen(false);
    refetch();
  }

  async function handleToggleVisible(item: Item) {
    await apiFetch(`/items/${item.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ visibleInCatalog: !item.visibleInCatalog }),
    });
    refetch();
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text">{businessConfig.terminology.itemPlural}</h2>
        <Button type="button" onClick={openCreate}>Nuevo {businessConfig.terminology.item}</Button>
      </div>

      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      {loading ? (
        <p className="text-text-muted">Cargando…</p>
      ) : (
        <Table<Item>
          columns={[
            { header: 'Nombre', render: (i) => i.name },
            { header: 'Precio', render: (i) => i.price },
            { header: 'Stock', render: (i) => i.stock },
            {
              header: 'Visible en catálogo público',
              render: (i) => (
                <Checkbox
                  aria-label={`Visible en catálogo público: ${i.name}`}
                  checked={i.visibleInCatalog}
                  onChange={() => handleToggleVisible(i)}
                />
              ),
            },
          ]}
          rows={data ?? []}
          rowKey={(i) => i.id}
        />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`Nuevo ${businessConfig.terminology.item}`}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            placeholder="Nombre"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            type="number"
            placeholder="Precio"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
          />
          <Input
            type="number"
            placeholder="Stock"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Agregar</Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
