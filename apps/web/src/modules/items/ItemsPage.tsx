import { useState } from 'react';
import type { FormEvent } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Table } from '../../ui/Table';
import { useApi } from '../../lib/useApi';
import { apiFetch } from '../../lib/apiFetch';
import { businessConfig } from '../../config/business.config';
import type { Item } from '@template/shared';

export function ItemsPage() {
  const { data, loading, refetch } = useApi<Item[]>('/items');
  const [form, setForm] = useState({ name: '', price: '', stock: '' });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await apiFetch('/items', {
      method: 'POST',
      body: JSON.stringify({ name: form.name, price: Number(form.price), stock: Number(form.stock) }),
    });
    setForm({ name: '', price: '', stock: '' });
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
      <h2 className="mb-4 text-lg font-semibold text-text">{businessConfig.terminology.itemPlural}</h2>

      <form onSubmit={handleSubmit} className="mb-4 flex flex-wrap gap-2">
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
        <Button type="submit">Agregar</Button>
      </form>

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
                <input
                  type="checkbox"
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
    </Card>
  );
}
