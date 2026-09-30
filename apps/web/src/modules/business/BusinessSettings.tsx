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
import { Can } from '../../components/Can';
import { Badge } from '../../ui/Badge';

const ISSUER_CONDITIONS = [
  'IVA Responsable Inscripto',
  'IVA Responsable No Inscripto',
  'IVA No Responsable',
  'IVA Sujeto Exento',
  'Consumidor Final',
  'Responsable Monotributo',
  'Sujeto No Categorizado',
  'Proveedor del Exterior',
  'Cliente del Exterior',
  'Liberado - Ley 19.640',
  'IVA Responsable Inscripto - Agente de Percepción',
  'Pequeño Contribuyente Eventual',
  'Monotributista Social',
  'Pequeño Contribuyente Eventual Social',
] as const;

interface ArcaConfig {
  taxId: string | null;
  issuerCondition: string | null;
  arcaEnvironment: 'production' | 'homologation';
  arcaConfigured: boolean;
}

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

  const [arcaConfig, setArcaConfig] = useState<ArcaConfig | null>(null);
  const [arcaLoading, setArcaLoading] = useState(true);
  const [arcaForm, setArcaForm] = useState({
    taxId: '',
    issuerCondition: '',
    arcaEnvironment: 'homologation' as 'production' | 'homologation',
    certPem: '',
    keyPem: '',
  });
  const [arcaSaving, setArcaSaving] = useState(false);
  const [arcaMessage, setArcaMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

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

  useEffect(() => {
    loadArcaConfig();
  }, [business]);

  async function loadArcaConfig() {
    if (!business) return;
    setArcaLoading(true);
    try {
      const config = await apiFetch('/business/arca') as ArcaConfig;
      setArcaConfig(config);
    } catch {
      setArcaConfig({ taxId: null, issuerCondition: null, arcaEnvironment: 'homologation', arcaConfigured: false });
    } finally {
      setArcaLoading(false);
    }
  }

  useEffect(() => {
    if (arcaConfig) {
      setArcaForm({
        taxId: arcaConfig.taxId ?? '',
        issuerCondition: arcaConfig.issuerCondition ?? '',
        arcaEnvironment: arcaConfig.arcaEnvironment,
        certPem: '',
        keyPem: '',
      });
    }
  }, [arcaConfig]);

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

  async function handleArcaSubmit(event: FormEvent) {
    event.preventDefault();
    setArcaSaving(true);
    setArcaMessage(null);
    try {
      await apiFetch('/business/arca', {
        method: 'PUT',
        body: JSON.stringify({
          cuit: arcaForm.taxId.replace(/\D/g, ''),
          issuerCondition: arcaForm.issuerCondition,
          arcaEnvironment: arcaForm.arcaEnvironment,
          certPem: arcaForm.certPem || undefined,
          keyPem: arcaForm.keyPem || undefined,
        }),
      });
      await loadArcaConfig();
      setArcaMessage({ text: 'Configuración ARCA guardada', type: 'success' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al guardar';
      setArcaMessage({ text: message, type: 'error' });
    } finally {
      setArcaSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Negocio"
        description="Parámetros generales de tu empresa, moneda y enlace al catálogo público."
        action={
          <Can permission="business:update">
            <Button type="button" onClick={() => setModalOpen(true)}>
              Editar
            </Button>
          </Can>
        }
      />

      {loading ? (
        <p className="text-text-muted">Cargando…</p>
      ) : (
        <>
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

            <Can permission="business:update">
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
            </Can>
          </Card>

          <Card className="mt-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-text">Facturación Electrónica ARCA</h3>
              <p className="text-sm text-text-muted mt-1">Configurá CUIT, condición fiscal y certificados para emitir comprobantes.</p>
            </div>

            {arcaLoading ? (
              <p className="text-text-muted">Cargando configuración ARCA…</p>
            ) : (
              <>
                <div className="mb-4 p-3 rounded-lg border border-border bg-bg-subtle">
                  <div className="flex items-center gap-2">
                    <Badge tone={arcaConfig?.arcaConfigured ? 'success' : 'neutral'}>
                      {arcaConfig?.arcaConfigured ? 'Configurado' : 'Sin configurar'}
                    </Badge>
                    <span className="text-sm text-text-muted">
                      Ambiente: {arcaConfig?.arcaEnvironment === 'production' ? 'Producción' : 'Homologación'}
                    </span>
                  </div>
                  {arcaConfig?.taxId && (
                    <p className="mt-2 text-sm text-text">CUIT: <span className="font-mono">{arcaConfig.taxId}</span></p>
                  )}
                  {arcaConfig?.issuerCondition && (
                    <p className="mt-1 text-sm text-text">Condición: {arcaConfig.issuerCondition}</p>
                  )}
                </div>

                <form onSubmit={handleArcaSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="CUIT"
                      placeholder="30123456789"
                      value={arcaForm.taxId}
                      onChange={(e) => setArcaForm({ ...arcaForm, taxId: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                      maxLength={11}
                    />
                    <div>
                      <label className="block text-sm font-medium text-text-muted mb-1">Condición fiscal</label>
                      <select
                        value={arcaForm.issuerCondition}
                        onChange={(e) => setArcaForm({ ...arcaForm, issuerCondition: e.target.value })}
                        className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text"
                      >
                        <option value="">Seleccionar condición</option>
                        {ISSUER_CONDITIONS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1">Ambiente</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value="homologation"
                          checked={arcaForm.arcaEnvironment === 'homologation'}
                          onChange={(e) => setArcaForm({ ...arcaForm, arcaEnvironment: e.target.value as 'production' | 'homologation' })}
                          className="rounded border-border text-primary"
                        />
                        Homologación
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value="production"
                          checked={arcaForm.arcaEnvironment === 'production'}
                          onChange={(e) => setArcaForm({ ...arcaForm, arcaEnvironment: e.target.value as 'production' | 'homologation' })}
                          className="rounded border-border text-primary"
                        />
                        Producción
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1">Certificado (.pem)</label>
                    <textarea
                      value={arcaForm.certPem}
                      onChange={(e) => setArcaForm({ ...arcaForm, certPem: e.target.value })}
                      placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                      className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text font-mono min-h-[100px] resize-y"
                    />
                    <p className="mt-1 text-xs text-text-muted">Opcional. Requerido junto con clave privada.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1">Clave privada (.pem)</label>
                    <textarea
                      value={arcaForm.keyPem}
                      onChange={(e) => setArcaForm({ ...arcaForm, keyPem: e.target.value })}
                      placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                      className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text font-mono min-h-[100px] resize-y"
                    />
                    <p className="mt-1 text-xs text-text-muted">Opcional. Requerido junto con certificado.</p>
                  </div>

                  {arcaMessage && (
                    <div className={`p-3 rounded-lg text-sm ${arcaMessage.type === 'success' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                      {arcaMessage.text}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="submit" disabled={arcaSaving}>
                      {arcaSaving ? 'Guardando…' : 'Guardar configuración ARCA'}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
