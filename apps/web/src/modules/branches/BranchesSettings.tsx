import { useState } from 'react';
import type { FormEvent } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Table } from '../../ui/Table';
import { Badge } from '../../ui/Badge';
import { useApi } from '../../lib/useApi';
import { apiFetch } from '../../lib/apiFetch';
import type { Branch } from '@template/shared';

export function BranchesSettings() {
  const { data, loading, refetch } = useApi<Branch[]>('/branches');
  const [name, setName] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await apiFetch('/branches', { method: 'POST', body: JSON.stringify({ name }) });
    setName('');
    refetch();
  }

  async function handleRemove(id: string) {
    await apiFetch(`/branches/${id}`, { method: 'DELETE' });
    refetch();
  }

  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold text-text">Sucursales</h2>

      <form onSubmit={handleSubmit} className="mb-4 flex gap-2">
        <Input placeholder="Nombre de la sucursal" value={name} onChange={(e) => setName(e.target.value)} required />
        <Button type="submit">Agregar</Button>
      </form>

      {loading ? (
        <p className="text-text-muted">Cargando…</p>
      ) : (
        <Table<Branch>
          columns={[
            { header: 'Nombre', render: (b) => b.name },
            { header: 'Default', render: (b) => (b.isDefault ? <Badge tone="success">Sí</Badge> : null) },
            {
              header: '',
              render: (b) =>
                !b.isDefault ? (
                  <button onClick={() => handleRemove(b.id)} className="text-danger">
                    Quitar
                  </button>
                ) : null,
            },
          ]}
          rows={data ?? []}
          rowKey={(b) => b.id}
        />
      )}
    </Card>
  );
}
