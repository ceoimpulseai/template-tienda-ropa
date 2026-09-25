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
import { Can } from '../../components/Can';
import { ROLE_LABELS, type Role } from '@template/shared';

const roleOptions: { value: Role; label: string }[] = [
  { value: 'manager', label: ROLE_LABELS.manager },
  { value: 'operator', label: ROLE_LABELS.operator },
  { value: 'viewer', label: ROLE_LABELS.viewer },
];

export function TeamSettings() {
  const { members, loading, invite, remove } = useTeam();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'operator' as Role });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await invite(form);
    setForm({ name: '', email: '', password: '', role: 'operator' });
    setOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="Equipo"
        description="Administración de colaboradores, asignación de roles y permisos de acceso."
        action={
          <Can permission="team:invite">
            <Button onClick={() => setOpen(true)}>Agregar empleado</Button>
          </Can>
        }
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
              render: (m) => <Badge tone={m.role === 'admin' ? 'success' : 'neutral'}>{ROLE_LABELS[m.role] || m.role}</Badge>,
            },
            {
              header: '',
              render: (m) => (
                <Can permission="team:remove">
                  <button onClick={() => remove(m.id)} className="text-danger">
                    Quitar
                  </button>
                </Can>
              ),
            },
          ]}
          rows={members}
          rowKey={(m) => m.id}
        />
      )}

      <Can permission="team:invite">
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
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text"
            >
              {roleOptions.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <Button type="submit" className="w-full">
              Guardar
            </Button>
          </form>
        </Modal>
      </Can>
    </Card>
    </div>
  );
}
