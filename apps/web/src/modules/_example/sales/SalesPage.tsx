// EJEMPLO: adaptar a la lógica del rubro concreto.
import { useState, useCallback } from 'react';
import type { FormEvent } from 'react';
import { Card } from '../../../ui/Card';
import { Button } from '../../../ui/Button';
import { Input } from '../../../ui/Input';
import { Checkbox } from '../../../ui/Checkbox';
import { Table } from '../../../ui/Table';
import { Badge } from '../../../ui/Badge';
import { Modal } from '../../../ui/Modal';
import { PageHeader } from '../../../components/PageHeader';
import { useApi } from '../../../lib/useApi';
import { apiFetch, ApiError } from '../../../lib/apiFetch';
import type { Item, Sale, Customer } from '@template/shared';
import { Can } from '../../../components/Can';

const ARCA_STATUS_LABELS: Record<string, { label: string; tone: 'neutral' | 'info' | 'success' | 'warning' | 'danger' }> = {
  null: { label: 'Pendiente', tone: 'neutral' },
  authorized: { label: 'Facturado', tone: 'success' },
  rejected: { label: 'Rechazado', tone: 'danger' },
  indeterminate: { label: 'Indeterminado', tone: 'warning' },
};

const ARCA_ERROR_MESSAGES: Record<string, string> = {
  ARCA_NOT_CONFIGURED: 'ARCA no está configurado. Configurá CUIT y certificados en Negocio > Facturación Electrónica.',
  SALE_MISSING_CUSTOMER: 'La venta debe tener un cliente asignado.',
  CUSTOMER_MISSING_FISCAL_ID: 'El cliente necesita CUIT/DNI para facturar.',
  BRANCH_MISSING_SALES_POINT: 'La sucursal activa no tiene punto de venta. Configuralo en Sucursales.',
  SALE_ALREADY_EMITTED: 'Esta venta ya fue facturada.',
  ARCA_TIMEOUT: 'ARCA no respondió. Reintentá en unos segundos.',
};

function handleApiError(err: unknown): string {
  if (err instanceof ApiError) {
    return ARCA_ERROR_MESSAGES[err.code] ?? err.message;
  }
  return err instanceof Error ? err.message : 'Error inesperado';
}

interface IssueResultModalProps {
  open: boolean;
  onClose: () => void;
  result?: {
    saleId: string;
    status: string;
    cae?: string;
    number?: number;
    message?: string;
  };
  error?: string;
}

function IssueResultModal({ open, onClose, result, error }: IssueResultModalProps) {
  if (!open) return null;
  return (
    <Modal open={true} onClose={onClose} title={error ? 'Error al facturar' : 'Factura emitida'} size="md">
      {error ? (
        <div className="space-y-3">
          <p className="text-text">{error}</p>
          <div className="flex justify-end">
            <Button onClick={onClose}>Entendido</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-success-subtle text-success">
            <p className="font-medium">Factura autorizada</p>
            {result?.cae && <p className="text-sm mt-1">CAE: <span className="font-mono">{result.cae}</span></p>}
            {result?.number && <p className="text-sm">Número: {result.number}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>Cerrar</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export function SalesPage() {
  const { data, loading, refetch } = useApi<Sale[]>('/sales');
  const { data: items } = useApi<Item[]>('/items');
  const { data: customers } = useApi<Customer[]>('/customers');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    itemId: '',
    customerId: '',
    quantity: 1,
    unitPrice: 0,
    isInternal: false,
    amountReceived: undefined as number | undefined,
    issueNow: false,
  });
  const [issuingId, setIssuingId] = useState<string | null>(null);
  const [issueModal, setIssueModal] = useState<{ open: boolean; result?: { saleId: string; status: string; cae?: string; number?: number; message?: string }; error?: string }>({
    open: false,
  });

  function openCreate() {
    setForm({ itemId: '', customerId: '', quantity: 1, unitPrice: 0, isInternal: false, amountReceived: undefined, issueNow: false });
    setModalOpen(true);
  }

  async function handleIssue(saleId: string) {
    setIssuingId(saleId);
    try {
      const voucher = await apiFetch(`/sales/${saleId}/issue`, { method: 'POST' });
      setIssueModal({
        open: true,
        result: {
          saleId,
          status: voucher.result,
          cae: voucher.arcaVoucherId,
          number: voucher.arcaVoucherNumber,
          message: voucher.emissionMessage,
        },
      });
      refetch();
    } catch (err: unknown) {
      const friendlyMessage = handleApiError(err);
      setIssueModal({ open: true, error: friendlyMessage });
    } finally {
      setIssuingId(null);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const { customerId, amountReceived, isInternal, issueNow, ...rest } = form;
    const payload: Record<string, unknown> = { ...rest, isInternal };
    if (customerId) payload.customerId = customerId;
    if (isInternal) {
      payload.amountReceived = amountReceived ?? 0;
    } else if (amountReceived !== undefined) {
      payload.amountReceived = amountReceived;
    }
    const sale = await apiFetch('/sales', { method: 'POST', body: JSON.stringify(payload) });
    setModalOpen(false);
    refetch();

    if (issueNow && sale?.id) {
      setIssuingId(sale.id);
      try {
        const voucher = await apiFetch(`/sales/${sale.id}/issue`, { method: 'POST' });
        setIssueModal({
          open: true,
          result: {
            saleId: sale.id,
            status: voucher.result,
            cae: voucher.arcaVoucherId,
            number: voucher.arcaVoucherNumber,
            message: voucher.emissionMessage,
          },
        });
        refetch();
      } catch (err: unknown) {
        const friendlyMessage = handleApiError(err);
        setIssueModal({ open: true, error: friendlyMessage });
      } finally {
        setIssuingId(null);
      }
    }
  }

  function getArcaStatusInfo(sale: Sale) {
    const status = sale.arcaStatus ?? 'null';
    return ARCA_STATUS_LABELS[status] ?? { label: status, tone: 'neutral' as const };
  }

  return (
    <div>
      <PageHeader
        title="Ventas"
        description="Historial y registro de ventas cobradas e internas de tu comercio."
        action={
          <Can permission="sales:create">
            <Button type="button" onClick={openCreate}>
              Nueva venta
            </Button>
          </Can>
        }
      />

      <Card>
        {loading ? (
          <p className="text-text-muted">Cargando…</p>
        ) : (
          <Table<Sale>
            columns={[
              { header: 'Producto', render: (s) => s.itemId },
              { header: 'Cantidad', render: (s) => s.quantity },
              { header: 'Precio unitario', render: (s) => s.unitPrice },
              {
                header: 'Tipo',
                render: (s) => (
                  <Badge tone={s.isInternal ? 'warning' : 'success'}>
                    {s.isInternal ? 'Interna' : 'Normal'}
                  </Badge>
                ),
              },
              { header: 'Recibido', render: (s) => `$${s.amountReceived}` },
              {
                header: 'Facturación',
                render: (s) => {
                  const { label, tone } = getArcaStatusInfo(s);
                  return (
                    <div className="flex items-center gap-2">
                      <Badge tone={tone}>{label}</Badge>
                      <Can permission="sales:update">
                        {s.arcaStatus !== 'authorized' && s.arcaStatus !== 'indeterminate' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleIssue(s.id)}
                            disabled={issuingId === s.id}
                          >
                            {issuingId === s.id ? 'Facturando…' : 'Facturar'}
                          </Button>
                        )}
                        {s.arcaStatus === 'rejected' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleIssue(s.id)}
                            disabled={issuingId === s.id}
                          >
                            Reintentar
                          </Button>
                        )}
                      </Can>
                    </div>
                  );
                },
              },
            ]}
            rows={data ?? []}
            rowKey={(s) => s.id}
          />
        )}
      </Card>

      <Can permission="sales:create">
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva venta">
          <form onSubmit={handleSubmit} className="space-y-3">
            <select
              value={form.itemId}
              onChange={(e) => setForm({ ...form, itemId: e.target.value })}
              required
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text"
            >
              <option value="">Seleccionar producto</option>
              {(items ?? []).map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} — ${i.price}
                </option>
              ))}
            </select>
            <Input
              type="number"
              placeholder="Cantidad"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
              required
            />
            <Input
              type="number"
              placeholder="Precio unitario"
              value={form.unitPrice}
              onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })}
              required
            />
            <select
              value={form.customerId}
              onChange={(e) => setForm({ ...form, customerId: e.target.value })}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text"
            >
              <option value="">Sin cliente</option>
              {(customers ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-text">
              <Checkbox
                checked={form.isInternal}
                onChange={(e) => {
                  setForm({ ...form, isInternal: e.target.checked, amountReceived: e.target.checked ? 0 : undefined });
                }}
              />
              Venta interna
            </label>
            {form.isInternal && (
              <Input
                type="number"
                placeholder="Monto recibido"
                value={form.amountReceived ?? 0}
                onChange={(e) => setForm({ ...form, amountReceived: Number(e.target.value) })}
              />
            )}
            <label className="flex items-center gap-2 text-sm text-text">
              <Checkbox
                checked={form.issueNow}
                onChange={(e) => setForm({ ...form, issueNow: e.target.checked })}
              />
              Facturar ahora
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button type="submit">Registrar venta</Button>
            </div>
          </form>
        </Modal>
      </Can>

      <IssueResultModal
        open={issueModal.open}
        onClose={() => setIssueModal({ open: false })}
        result={issueModal.result}
        error={issueModal.error}
      />
    </div>
  );
}