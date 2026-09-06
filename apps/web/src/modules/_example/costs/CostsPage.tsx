// EJEMPLO: adaptar a la lógica del rubro concreto.
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Card } from '../../../ui/Card';
import { Button } from '../../../ui/Button';
import { Input } from '../../../ui/Input';
import { Table } from '../../../ui/Table';
import { Badge } from '../../../ui/Badge';
import { Modal } from '../../../ui/Modal';
import { PageHeader } from '../../../components/PageHeader';
import { useApi } from '../../../lib/useApi';
import { apiFetch } from '../../../lib/apiFetch';
import type { Cost, CostType } from '@template/shared';

export function CostsPage() {
  const { data, loading, refetch } = useApi<Cost[]>('/costs');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<{ type: CostType; label: string; amount: number }>({
    type: 'fixed',
    label: '',
    amount: 0,
  });

  function openCreate() {
    setForm({ type: 'fixed', label: '', amount: 0 });
    setModalOpen(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await apiFetch('/costs', { method: 'POST', body: JSON.stringify(form) });
    setModalOpen(false);
    refetch();
  }

  async function handleRemove(id: string) {
    await apiFetch(`/costs/${id}`, { method: 'DELETE' });
    refetch();
  }

  return (
    <div>
      <PageHeader
        title="Gastos"
        description="Control y seguimiento de costos fijos, variables y extraordinarios."
        action={
          <Button type="button" onClick={openCreate}>
            Nuevo gasto
          </Button>
        }
      />

      <Card>
        {loading ? (
        <p className="text-text-muted">Cargando…</p>
      ) : (
        <Table<Cost>
          columns={[
            {
              header: 'Tipo',
              render: (c) => (
                <Badge tone={c.type === 'fixed' ? 'neutral' : c.type === 'extraordinary' ? 'danger' : 'warning'}>
                  {c.type === 'fixed' ? 'Fijo' : c.type === 'extraordinary' ? 'Extraordinario' : 'Variable'}
                </Badge>
              ),
            },
            { header: 'Concepto', render: (c) => c.label },
            { header: 'Monto', render: (c) => c.amount },
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo gasto">
        <form onSubmit={handleSubmit} className="space-y-3">
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as CostType })}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text"
          >
            <option value="fixed">Fijo</option>
            <option value="variable">Variable</option>
            <option value="extraordinary">Extraordinario</option>
          </select>
          <Input
            placeholder="Concepto"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            required
          />
          <Input
            type="number"
            placeholder="Monto"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Agregar</Button>
          </div>
        </form>
      </Modal>
    </Card>
    </div>
  );
}
