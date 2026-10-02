import { useState } from 'react';
import type { FormEvent } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Table } from '../../ui/Table';
import { Modal } from '../../ui/Modal';
import { Badge } from '../../ui/Badge';
import { Checkbox } from '../../ui/Checkbox';
import { PageHeader } from '../../components/PageHeader';
import { useEmployees } from './useEmployees';
import type { Employee, CreateEmployeeInput, UpdateEmployeeInput } from '@template/shared';
import { Can } from '../../components/Can';
import { ROLE_LABELS } from '@template/shared';

type EmployeeRole = 'manager' | 'operator' | 'viewer';

const roleOptions: { value: EmployeeRole; label: string }[] = [
  { value: 'manager', label: ROLE_LABELS.manager },
  { value: 'operator', label: ROLE_LABELS.operator },
  { value: 'viewer', label: ROLE_LABELS.viewer },
];

const statusOptions: { value: Employee['status']; label: string }[] = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'on_leave', label: 'Licencia' },
  { value: 'vacation', label: 'Vacaciones' },
  { value: 'suspended', label: 'Suspendido' },
];

interface EmployeeForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  position: string;
  salary: string;
  hasAccount: boolean;
  password: string;
  role: EmployeeRole;
  status: Employee['status'];
  notes: string;
}

const emptyForm: EmployeeForm = {
  name: '',
  email: '',
  phone: '',
  address: '',
  position: '',
  salary: '',
  hasAccount: false,
  password: '',
  role: 'operator',
  status: 'active',
  notes: '',
};

export function EmployeesListTab() {
  const { employees, loading, create, update, remove, refetch } = useEmployees();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EmployeeForm>(emptyForm);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(emp: Employee) {
    setEditingId(emp.id);
    setForm({
      name: emp.name,
      email: emp.email ?? '',
      phone: emp.phone ?? '',
      address: emp.address ?? '',
      position: emp.position ?? '',
      salary: emp.salary?.toString() ?? '',
      hasAccount: emp.hasAccount,
      password: '',
      role: (emp.role ?? 'operator') as EmployeeRole,
      status: emp.status,
      notes: emp.notes ?? '',
    });
    setModalOpen(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const input: CreateEmployeeInput & { password?: string } = {
      name: form.name,
      email: form.email || null,
      phone: form.phone || null,
      address: form.address || null,
      position: form.position || null,
      salary: form.salary ? parseFloat(form.salary) : null,
      hasAccount: form.hasAccount,
      role: form.hasAccount ? form.role : null,
      status: form.status,
      notes: form.notes || null,
      ...(form.hasAccount && form.password ? { password: form.password } : {}),
    };

    if (editingId) {
      await update(editingId, input);
    } else {
      await create(input);
    }
    setModalOpen(false);
  }

  async function handleRemove(id: string) {
    if (!confirm('¿Eliminar este empleado?')) return;
    await remove(id);
  }

  const statusBadgeTones: Record<Employee['status'], 'neutral' | 'info' | 'success' | 'warning' | 'danger'> = {
    active: 'success',
    inactive: 'neutral',
    on_leave: 'info',
    vacation: 'warning',
    suspended: 'danger',
  };

  return (
    <div>
      <PageHeader
        title="Empleados"
        description="Listado de empleados, datos personales, sueldos, horarios y acceso a la plataforma."
        action={
          <Can permission="employees:create">
            <Button type="button" onClick={openCreate}>
              Nuevo empleado
            </Button>
          </Can>
        }
      />

      <Card>
        {loading ? (
          <p className="text-text-muted">Cargando…</p>
        ) : (
          <Table<Employee>
            columns={[
              { header: 'Nombre', render: (e) => e.name },
              { header: 'Cargo', render: (e) => e.position || '—' },
              { header: 'Sueldo', render: (e) => e.salary ? `$${Number(e.salary).toLocaleString('es-AR')}` : '—' },
              {
                header: 'Estado',
                render: (e) => (
                  <Badge tone={statusBadgeTones[e.status]}>
                    {statusOptions.find(s => s.value === e.status)?.label || e.status}
                  </Badge>
                ),
              },
              {
                header: 'Acceso',
                render: (e) => (
                  <Badge tone={e.hasAccount ? 'success' : 'neutral'}>
                    {e.hasAccount ? 'Sí' : 'No'}
                  </Badge>
                ),
              },
              {
                header: 'Rol',
                render: (e) => (e.hasAccount && e.role ? ROLE_LABELS[e.role] : '—'),
              },
              {
                header: '',
                render: (e) => (
                  <div className="flex gap-2">
                    <Can permission="employees:update">
                      <button onClick={() => openEdit(e)} className="text-primary hover:underline text-xs">
                        Editar
                      </button>
                    </Can>
                    <Can permission="employees:delete">
                      <button onClick={() => handleRemove(e.id)} className="text-danger hover:underline text-xs">
                        Quitar
                      </button>
                    </Can>
                  </div>
                ),
              },
            ]}
            rows={employees}
            rowKey={(e) => e.id}
          />
        )}

        <Can permission="employees:create">
          <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar empleado' : 'Nuevo empleado'} size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Nombre *"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
                <Input
                  type="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Teléfono"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
                <Input
                  placeholder="Cargo / Puesto"
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                />
              </div>

              <Input
                placeholder="Dirección"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  type="number"
                  step="1000"
                  placeholder="Sueldo mensual"
                  value={form.salary}
                  onChange={(e) => setForm({ ...form, salary: e.target.value })}
                />
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as Employee['status'] })}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text"
                >
                  {statusOptions.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Acceso a la plataforma</h4>
                <Checkbox
                  checked={form.hasAccount}
                  onChange={(e) => setForm({ ...form, hasAccount: e.target.checked })}
                  label="Tiene cuenta para ingresar a la app"
                />
                {form.hasAccount && (
                  <div className="mt-3 space-y-3 border-l-2 border-primary pl-4 ml-2">
                    <Input
                      type="email"
                      placeholder="Email para login *"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                    />
                    <Input
                      type="password"
                      placeholder="Contraseña *"
                      minLength={8}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required={!editingId}
                    />
                    <select
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value as EmployeeRole })}
                      className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text"
                    >
                      {roleOptions.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-text-muted">
                      El empleado podrá acceder con rol <strong>{ROLE_LABELS[form.role]}</strong> (no administrador).
                    </p>
                  </div>
                )}
              </div>

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
        </Can>
      </Card>
    </div>
  );
}