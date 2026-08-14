import { useState } from 'react';
import type { FormEvent } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Table } from '../../ui/Table';
import { useApi } from '../../lib/useApi';
import { apiFetch } from '../../lib/apiFetch';
import type { Customer } from '@template/shared';

export function CustomersPage() {
  const { data, loading, refetch } = useApi<Customer[]>('/customers');
  const [form, setForm] = useState({ name: '', email: '', phone: '' });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await apiFetch('/customers', { method: 'POST', body: JSON.stringify(form) });
    setForm({ name: '', email: '', phone: '' });
    refetch();
  }

  async function handleRemove(id: string) {
    await apiFetch(`/customers/${id}`, { method: 'DELETE' });
    refetch();
  }

  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold text-text">Clientes</h2>

      <form onSubmit={handleSubmit} className="mb-4 flex flex-wrap gap-2">
        <Input
          label="Nombre"
          placeholder="Nombre"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <Input
          type="email"
          label="Email (opcional)"
          placeholder="Email (opcional)"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <Input
          label="Teléfono (opcional)"
          placeholder="Teléfono (opcional)"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <Button type="submit">Agregar</Button>
      </form>

      {loading ? (
        <p className="text-text-muted">Cargando…</p>
      ) : (
        <Table<Customer>
          columns={[
            { header: 'Nombre', render: (c) => c.name },
            { header: 'Email', render: (c) => c.email ?? '—' },
            { header: 'Teléfono', render: (c) => c.phone ?? '—' },
            {
              header: '',
              render: (c) => (
                <button onClick={() => handleRemove(c.id)} className="text-danger">
                  Quitar
                </button>
              ),
            },
          ]}
          rows={data ?? []}
          rowKey={(c) => c.id}
        />
      )}
    </Card>
  );
}
