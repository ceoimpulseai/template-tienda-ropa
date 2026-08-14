import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { useApi } from '../../lib/useApi';
import { apiFetch } from '../../lib/apiFetch';
import type { Business } from '@template/shared';

export function BusinessSettings() {
  const { data: business, loading, refetch } = useApi<Business>('/business');
  const [form, setForm] = useState({ name: '', currencySymbol: '$', taxPercent: 0 });

  useEffect(() => {
    if (business) {
      setForm({ name: business.name, currencySymbol: business.currencySymbol, taxPercent: business.taxPercent });
    }
  }, [business]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await apiFetch('/business', { method: 'PATCH', body: JSON.stringify(form) });
    refetch();
  }

  if (loading) return <p className="text-text-muted">Cargando…</p>;

  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold text-text">Información del negocio</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          placeholder="Nombre del negocio"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <Input
          placeholder="Símbolo de moneda"
          value={form.currencySymbol}
          onChange={(e) => setForm({ ...form, currencySymbol: e.target.value })}
        />
        <Input
          type="number"
          placeholder="IVA %"
          value={form.taxPercent}
          onChange={(e) => setForm({ ...form, taxPercent: Number(e.target.value) })}
        />
        <Button type="submit">Guardar</Button>
      </form>
    </Card>
  );
}
