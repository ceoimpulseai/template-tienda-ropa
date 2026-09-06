import { useState } from 'react';
import type { FormEvent } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Table } from '../../ui/Table';
import { Badge } from '../../ui/Badge';
import { Modal } from '../../ui/Modal';
import { PageHeader } from '../../components/PageHeader';
import { useTeam } from './useTeam';
import type { BusinessMember } from '@template/shared';

export function TeamSettings() {
  const { members, loading, invite, remove } = useTeam();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' as 'admin' | 'staff' });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await invite(form);
    setForm({ name: '', email: '', password: '', role: 'staff' });
    setOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="Equipo"
        description="Administración de colaboradores, asignación de roles y permisos de acceso."
        action={<Button onClick={() => setOpen(true)}>Agregar empleado</Button>}
      />

      <Card>
        {loading ? (
        <p className="text-text-muted">Cargando…</p>
      ) : (
        <Table<BusinessMember>
          columns={[
            { header: 'Usuario', render: (m) => m.userId },
            {
              header: 'Rol',
              render: (m) => <Badge tone={m.role === 'admin' ? 'success' : 'neutral'}>{m.role}</Badge>,
            },
            {
              header: '',
              render: (m) => (
                <button onClick={() => remove(m.id)} className="text-danger">
                  Quitar
                </button>
              ),
            },
          ]}
          rows={members}
          rowKey={(m) => m.id}
        />
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Agregar empleado">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            placeholder="Nombre"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input
            type="password"
            placeholder="Contraseña"
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <Button type="submit" className="w-full">
            Guardar
          </Button>
        </form>
      </Modal>
    </Card>
    </div>
  );
}
