import { useState } from 'react';
import type { FormEvent } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Table } from '../../ui/Table';
import { Modal } from '../../ui/Modal';
import { useApi } from '../../lib/useApi';
import { apiFetch } from '../../lib/apiFetch';
import type { Supplier } from '@template/shared';

interface SupplierForm {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

const emptyForm: SupplierForm = { name: '', phone: '', email: '', address: '', notes: '' };

export function SuppliersPage() {
  const { data: suppliers, loading, refetch } = useApi<Supplier[]>('/suppliers');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SupplierForm>(emptyForm);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(supplier: Supplier) {
    setEditingId(supplier.id);
    setForm({
      name: supplier.name,
      phone: supplier.phone ?? '',
      email: supplier.email ?? '',
      address: supplier.address ?? '',
      notes: supplier.notes ?? '',
    });
    setModalOpen(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (editingId) {
      await apiFetch(`/suppliers/${editingId}`, { method: 'PUT', body: JSON.stringify(form) });
    } else {
      await apiFetch('/suppliers', { method: 'POST', body: JSON.stringify(form) });
    }
    setModalOpen(false);
    refetch();
  }

  async function handleRemove(id: string) {
    await apiFetch(`/suppliers/${id}`, { method: 'DELETE' });
    refetch();
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text">Proveedores</h2>
        <Button type="button" onClick={openCreate}>
          Nuevo proveedor
        </Button>
      </div>

      {loading ? (
        <p className="text-text-muted">Cargando…</p>
      ) : (
        <Table<Supplier>
          columns={[
            { header: 'Nombre', render: (s) => s.name },
            { header: 'Teléfono', render: (s) => s.phone || '—' },
            { header: 'Email', render: (s) => s.email || '—' },
            { header: 'Dirección', render: (s) => s.address || '—' },
            {
              header: '',
              render: (s) => (
                <div className="flex gap-2">
                  <button onClick={() => openEdit(s)} className="text-primary hover:underline text-xs">
                    Editar
                  </button>
                  <button onClick={() => handleRemove(s.id)} className="text-danger hover:underline text-xs">
                    Quitar
                  </button>
                </div>
              ),
            },
          ]}
          rows={suppliers ?? []}
          rowKey={(s) => s.id}
        />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar proveedor' : 'Nuevo proveedor'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            placeholder="Nombre"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            placeholder="Teléfono"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            placeholder="Dirección"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <Input
            placeholder="Notas"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">{editingId ? 'Guardar' : 'Agregar'}</Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}