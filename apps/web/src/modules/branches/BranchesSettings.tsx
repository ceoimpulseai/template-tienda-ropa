import { useState } from 'react';
import type { FormEvent } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Table } from '../../ui/Table';
import { Badge } from '../../ui/Badge';
import { PageHeader } from '../../components/PageHeader';
import { useApi } from '../../lib/useApi';
import { apiFetch } from '../../lib/apiFetch';
import type { Branch } from '@template/shared';
import { Can } from '../../components/Can';

export function BranchesSettings() {
  const { data, loading, refetch } = useApi<Branch[]>('/branches');
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSalesPoint, setEditSalesPoint] = useState('');

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

  async function handleEditStart(branch: Branch) {
    setEditingId(branch.id);
    setEditSalesPoint(branch.salesPoint?.toString() ?? '');
  }

  async function handleEditSave(branchId: string) {
    const salesPoint = parseInt(editSalesPoint, 10);
    if (isNaN(salesPoint) || salesPoint < 1) return;
    await apiFetch(`/branches/${branchId}`, {
      method: 'PUT',
      body: JSON.stringify({ salesPoint }),
    });
    setEditingId(null);
    setEditSalesPoint('');
    refetch();
  }

  async function handleEditCancel() {
    setEditingId(null);
    setEditSalesPoint('');
  }

  return (
    <div>
      <PageHeader
        title="Sucursales"
        description="Administra las sedes, depósitos y puntos de venta de tu negocio."
        showBranchSwitcher={false}
      />

      <Card>
        <Can permission="branches:create">
          <form onSubmit={handleSubmit} className="mb-4 flex gap-2">
            <Input placeholder="Nombre de la sucursal" value={name} onChange={(e) => setName(e.target.value)} required />
            <Button type="submit">Agregar</Button>
          </form>
        </Can>

        {loading ? (
          <p className="text-text-muted">Cargando…</p>
        ) : (
          <Table<Branch>
            columns={[
              { header: 'Nombre', render: (b) => b.name },
              { header: 'Default', render: (b) => (b.isDefault ? <Badge tone="success">Sí</Badge> : null) },
              {
                header: 'Punto de Venta',
                render: (b) =>
                  editingId === b.id ? (
                    <div className="flex gap-2 items-center">
                      <Input
                        type="number"
                        min="1"
                        value={editSalesPoint}
                        onChange={(e) => setEditSalesPoint(e.target.value)}
                        className="w-24"
                        autoFocus
                      />
                      <Button size="sm" onClick={() => handleEditSave(b.id)}>Guardar</Button>
                      <Button size="sm" variant="secondary" onClick={handleEditCancel}>Cancelar</Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>{b.salesPoint ?? <span className="text-text-muted">—</span>}</span>
                      <Can permission="branches:update">
                        <button
                          onClick={() => handleEditStart(b)}
                          className="text-xs text-primary hover:underline"
                        >
                          {b.salesPoint ? 'Editar' : 'Agregar'}
                        </button>
                      </Can>
                    </div>
                  ),
              },
              {
                header: '',
                render: (b) =>
                  !b.isDefault ? (
                    <Can permission="branches:delete">
                      <button onClick={() => handleRemove(b.id)} className="text-danger">
                        Quitar
                      </button>
                    </Can>
                  ) : null,
              },
            ]}
            rows={data ?? []}
            rowKey={(b) => b.id}
          />
        )}
      </Card>
    </div>
  );
}