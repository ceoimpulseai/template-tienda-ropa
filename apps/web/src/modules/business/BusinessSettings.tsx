import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Modal } from '../../ui/Modal';
import { PageHeader } from '../../components/PageHeader';
import { useApi } from '../../lib/useApi';
import { apiFetch } from '../../lib/apiFetch';
import type { Business } from '@template/shared';

export function BusinessSettings() {
  const { data: business, loading, refetch } = useApi<Business>('/business');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    currencySymbol: '$',
    taxPercent: 0,
    catalogWhatsapp: '',
  });
  const [copied, setCopied] = useState(false);

  async function copyCatalogUrl(businessId: string) {
    await navigator.clipboard.writeText(`${window.location.origin}/tienda/${businessId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  useEffect(() => {
    if (business) {
      setForm({
        name: business.name,
        currencySymbol: business.currencySymbol,
        taxPercent: business.taxPercent,
        catalogWhatsapp: business.catalogWhatsapp ?? '',
      });
    }
  }, [business]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await apiFetch('/business', {
      method: 'PATCH',
      body: JSON.stringify({
        name: form.name,
        currencySymbol: form.currencySymbol,
        taxPercent: form.taxPercent,
        catalogWhatsapp: form.catalogWhatsapp || null,
      }),
    });
    setModalOpen(false);
    refetch();
  }

  return (
    <div>
      <PageHeader
        title="Negocio"
        description="Parámetros generales de tu empresa, moneda y enlace al catálogo público."
        action={
          <Button type="button" onClick={() => setModalOpen(true)}>
            Editar
          </Button>
        }
      />

      {loading ? (
        <p className="text-text-muted">Cargando…</p>
      ) : (
        <Card>

      {business && (
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span>
            URL pública: <span className="font-mono">/tienda/{business.id}</span>
          </span>
          <button
            type="button"
            onClick={() => copyCatalogUrl(business.id)}
            className="rounded-md border border-border px-2 py-1 text-text hover:bg-bg-subtle"
          >
            {copied ? 'Copiado' : 'Copiar link'}
          </button>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Editar negocio">
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
          <Input
            placeholder="WhatsApp para pedidos (ej. +54 9 11 1234-5678)"
            value={form.catalogWhatsapp}
            onChange={(e) => setForm({ ...form, catalogWhatsapp: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Guardar</Button>
          </div>
        </form>
      </Modal>
    </Card>
      )}
    </div>
  );
}
