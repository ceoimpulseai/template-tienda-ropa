import { useState } from 'react';
import type { FormEvent } from 'react';
import { Card } from '../../../ui/Card';
import { Button } from '../../../ui/Button';
import { Input } from '../../../ui/Input';
import { Table } from '../../../ui/Table';
import { Modal } from '../../../ui/Modal';
import { Badge } from '../../../ui/Badge';
import { PageHeader } from '../../../components/PageHeader';
import { useApi } from '../../../lib/useApi';
import { apiFetch } from '../../../lib/apiFetch';
import type { Item, Variant, Supplier } from '@template/shared';
import { Can } from '../../../components/Can';
import * as XLSX from 'xlsx';

interface VariantDistEntry {
  variantId: string;
  size: string;
  color: string;
  quantity: number;
  unitCost: number | null;
}

interface LineEntry {
  tempId: string;
  itemId: string;
  quantity: number;
  unitCost: number;
  variantDists: VariantDistEntry[];
}

interface ItemWithVariants extends Item {
  variants?: Variant[];
}

interface ImportRowPreview {
  _key: string;
  sku: string;
  quantity: number;
  unitCost: number | null;
  status: 'ok' | 'not_found' | 'duplicate_sku';
  itemName: string | null;
  size: string | null;
  color: string | null;
  variantId: string | null;
  itemId: string | null;
}

function statusBadge(status: string) {
  const tones: Record<string, string> = {
    completed: 'success',
    cancelled: 'danger',
    draft: 'warning',
  };
  const labels: Record<string, string> = {
    completed: 'Completada',
    cancelled: 'Anulada',
    draft: 'Borrador',
  };
  return <Badge tone={tones[status] as any}>{labels[status] ?? status}</Badge>;
}

function formatCurrency(n: number): string {
  return `$${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-AR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function randomString() { return Math.random().toString(36).slice(2, 10); }

export function PurchasesPage() {
  const { data: orders, loading, refetch } = useApi<any[]>('/purchase-orders');
  const { data: items } = useApi<ItemWithVariants[]>('/items');
  const { data: suppliers } = useApi<Supplier[]>('/suppliers');

  const [detailOrder, setDetailOrder] = useState<any | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState(1);

  const [header, setHeader] = useState({ supplierId: '', notes: '' });
  const [lines, setLines] = useState<LineEntry[]>([
    { tempId: randomString(), itemId: '', quantity: 1, unitCost: 0, variantDists: [] },
  ]);
  const [distModalLineIdx, setDistModalLineIdx] = useState<number | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<ImportRowPreview[]>([]);
  const [importFileName, setImportFileName] = useState('');

  function resetWizard() {
    setHeader({ supplierId: '', notes: '' });
    setLines([{ tempId: randomString(), itemId: '', quantity: 1, unitCost: 0, variantDists: [] }]);
    setStep(1);
  }

  function getLastUnitCost(itemId: string): number {
    if (!orders) return 0;
    for (const o of orders) {
      if (!o.lines) continue;
      for (const li of o.lines) {
        if (li.itemId === itemId) return li.unitCost;
      }
    }
    return 0;
  }

  function getItemVariants(itemId: string): Variant[] {
    const item = items?.find((i) => i.id === itemId) as ItemWithVariants | undefined;
    return item?.variants ?? [];
  }

  function autoDistribute(lineIdx: number) {
    const line = lines[lineIdx];
    if (!line) return;
    const variants = getItemVariants(line.itemId);
    if (variants.length === 0) return;
    const perVariant = Math.floor(line.quantity / variants.length);
    const remainder = line.quantity - perVariant * variants.length;
    const dists = variants.map((v, i) => ({
      variantId: v.id,
      size: v.size,
      color: v.color,
      quantity: perVariant + (i < remainder ? 1 : 0),
      unitCost: null as number | null,
    }));
    const newLines = [...lines];
    newLines[lineIdx] = { ...line, variantDists: dists };
    setLines(newLines);
  }

  function openDistModal(lineIdx: number) {
    const line = lines[lineIdx];
    if (!line) return;
    if (line.variantDists.length === 0) {
      autoDistribute(lineIdx);
    }
    setDistModalLineIdx(lineIdx);
  }

  function addLine() {
    setLines([...lines, { tempId: randomString(), itemId: '', quantity: 1, unitCost: 0, variantDists: [] }]);
  }

  function removeLine(idx: number) {
    if (lines.length <= 1) return;
    const newLines = [...lines];
    newLines.splice(idx, 1);
    setLines(newLines);
  }

  function updateLine(idx: number, patch: Partial<LineEntry>) {
    const newLines = [...lines];
    const line = newLines[idx];
    if (!line) return;
    const updated = { ...line, ...patch };
    if (patch.itemId && patch.itemId !== line.itemId) {
      updated.unitCost = getLastUnitCost(patch.itemId);
      updated.variantDists = [];
    }
    newLines[idx] = updated;
    setLines(newLines);
  }

  function updateVariantDist(lineIdx: number, distIdx: number, quantity: number, unitCost?: number) {
    const line = lines[lineIdx];
    if (!line) return;
    const newDists = [...line.variantDists];
    const dist = newDists[distIdx];
    if (!dist) return;
    newDists[distIdx] = { ...dist, quantity, unitCost: unitCost ?? dist.unitCost };
    const newLines = [...lines];
    newLines[lineIdx] = { ...line, variantDists: newDists };
    setLines(newLines);
  }

  function getTotalCost(): number {
    return lines.reduce((sum, l) => sum + l.quantity * l.unitCost, 0);
  }

  function parseCSV(text: string): string[][] {
    const rows: string[][] = [];
    let current: string[] = [];
    let field = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < text.length && text[i + 1] === '"') {
            field += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          field += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        current.push(field.trim());
        field = '';
      } else if (ch === '\n' || (ch === '\r' && text[i + 1] !== '\n')) {
        current.push(field.trim());
        field = '';
        if (current.some(f => f !== '')) rows.push(current);
        current = [];
      } else if (ch === '\r') {
        // skip \r before \n
      } else {
        field += ch;
      }
    }
    current.push(field.trim());
    if (current.some(f => f !== '')) rows.push(current);
    return rows;
  }

  function findColumnIndex(headers: string[], ...names: string[]): number {
    const lower = names.map(n => n.toLowerCase());
    for (let i = 0; i < headers.length; i++) {
      if (lower.some(n => headers[i]!.toLowerCase().includes(n))) return i;
    }
    return -1;
  }

  function findVariantBySku(sku: string): { variant: Variant; item: ItemWithVariants } | null {
    if (!items) return null;
    const trimmed = sku.trim().toUpperCase();
    for (const item of items) {
      const itemWithV = item as ItemWithVariants;
      if (!itemWithV.variants) continue;
      for (const v of itemWithV.variants) {
        if (v.sku.toUpperCase() === trimmed) {
          return { variant: v, item: itemWithV };
        }
      }
    }
    return null;
  }

  async function handleFileImport(file: File) {
    setImportFileName(file.name);
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    let parsed: string[][] = [];

    if (ext === 'csv') {
      const text = await file.text();
      parsed = parseCSV(text);
    } else if (ext === 'xlsx' || ext === 'xls') {
      try {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(new Uint8Array(buf));
        const sheetName = wb.SheetNames[0];
        if (!sheetName) { setImportRows([]); return; }
        const ws = wb.Sheets[sheetName]!;
        const json = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: '' });
        parsed = json as string[][];
      } catch {
        setImportRows([]);
        return;
      }
    } else {
      setImportRows([]);
      return;
    }

    if (parsed.length < 2) { setImportRows([]); return; }

    const headers = parsed[0]!.map(h => h.trim());
    const skuCol = findColumnIndex(headers, 'sku', 'codigo', 'cod', 'código');
    const qtyCol = findColumnIndex(headers, 'cantidad', 'cant', 'qty', 'unidades');
    const priceCol = findColumnIndex(headers, 'precio', 'costo', 'precio compra', 'costo unitario', 'precio unitario');

    if (skuCol === -1 || qtyCol === -1) { setImportRows([]); return; }

    const seenSkus = new Set<string>();
    const previews: ImportRowPreview[] = [];

    for (let i = 1; i < parsed.length; i++) {
      const row = parsed[i];
      if (!row) continue;
      const sku = row[skuCol]?.trim() || '';
      const qtyStr = row[qtyCol]?.trim() || '0';
      const priceStr = priceCol !== -1 ? (row[priceCol]?.trim() || '') : '';

      if (!sku) continue;

      const quantity = Math.max(1, parseInt(qtyStr.replace(/[^0-9]/g, '')) || 1);
      const unitCost = priceStr ? parseFloat(priceStr.replace(',', '.').replace(/[^0-9.]/g, '')) : null;

      const match = findVariantBySku(sku);
      const status = !match ? 'not_found' : seenSkus.has(sku) ? 'duplicate_sku' : 'ok';
      if (match) seenSkus.add(sku);

      previews.push({
        _key: `${sku}-${i}`,
        sku,
        quantity,
        unitCost: unitCost !== null && !isNaN(unitCost) ? unitCost : null,
        status,
        itemName: match?.item.name ?? null,
        size: match?.variant.size ?? null,
        color: match?.variant.color ?? null,
        variantId: match?.variant.id ?? null,
        itemId: match?.item.id ?? null,
      });
    }

    setImportRows(previews);
  }

  function addImportedLines() {
    const okRows = importRows.filter(r => r.status === 'ok' && r.itemId && r.variantId);
    if (okRows.length === 0) return;

    const groups = new Map<string, { itemId: string; unitCost: number; variants: { variantId: string; size: string; color: string; quantity: number; unitCost: number | null }[] }>();
    for (const row of okRows) {
      const key = row.itemId!;
      if (!groups.has(key)) {
        groups.set(key, { itemId: key, unitCost: 0, variants: [] });
      }
      const g = groups.get(key)!;
      g.unitCost = row.unitCost ?? g.unitCost;
      g.variants.push({
        variantId: row.variantId!,
        size: row.size!,
        color: row.color!,
        quantity: row.quantity,
        unitCost: row.unitCost,
      });
    }

    const newLines: LineEntry[] = [];
    for (const [, g] of groups) {
      const totalQty = g.variants.reduce((s, v) => s + v.quantity, 0);
      newLines.push({
        tempId: randomString(),
        itemId: g.itemId,
        quantity: totalQty,
        unitCost: g.unitCost,
        variantDists: g.variants.map(v => ({
          variantId: v.variantId,
          size: v.size,
          color: v.color,
          quantity: v.quantity,
          unitCost: v.unitCost,
        })),
      });
    }

    setLines([...lines, ...newLines]);
    setImportOpen(false);
    setImportRows([]);
    setImportFileName('');
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const body = {
      supplierId: header.supplierId || undefined,
      notes: header.notes || undefined,
      lines: lines.map((l) => ({
        itemId: l.itemId,
        quantity: l.quantity,
        unitCost: l.unitCost,
        variants: l.variantDists.length > 0
          ? l.variantDists.map((d) => ({ variantId: d.variantId, quantity: d.quantity, unitCost: d.unitCost ?? undefined }))
          : undefined,
      })),
    };

    await apiFetch('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    setWizardOpen(false);
    resetWizard();
    refetch();
  }

  function openDetail(order: any) {
    setDetailOrder(order);
    setDetailOpen(true);
  }

  function itemName(id: string): string {
    return items?.find((i) => i.id === id)?.name ?? id;
  }

  function supplierName(id: string | null | undefined): string {
    if (!id) return '—';
    return suppliers?.find((s) => s.id === id)?.name ?? id;
  }

  return (
    <div>
      <PageHeader
        title="Compras"
        description="Órdenes de compra a proveedores. Registro de prendas, talles y costos."
        action={
          <Can permission="purchases:create">
            <Button type="button" onClick={() => { resetWizard(); setWizardOpen(true); }}>
              Nueva compra
            </Button>
          </Can>
        }
      />

      <Card>
        {loading ? (
          <p className="text-text-muted py-8 text-center">Cargando…</p>
        ) : (
          <Table<any>
            columns={[
              { header: 'Proveedor', render: (o) => supplierName(o.supplierId) },
              { header: 'Items', render: (o) => `${o.lines?.length ?? 0} prendas` },
              { header: 'Costo total', render: (o) => formatCurrency(o.totalCost), align: 'right' },
              { header: 'Estado', render: (o) => statusBadge(o.status) },
              { header: 'Fecha', render: (o) => formatDate(o.createdAt) },
              { header: '', render: (o) => (
                <button type="button" onClick={() => openDetail(o)} className="text-xs text-primary underline hover:no-underline">
                  Ver
                </button>
              )},
            ]}
            rows={orders ?? []}
            rowKey={(o) => o.id}
            emptyMessage="No hay compras registradas"
          />
        )}
      </Card>

      {/* Detail Modal */}
      {detailOrder && (
        <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title="Detalle de compra" size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-text-muted">Proveedor</p>
                <p className="text-text">{supplierName(detailOrder.supplierId)}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Fecha</p>
                <p className="text-text">{formatDate(detailOrder.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Estado</p>
                <p>{statusBadge(detailOrder.status)}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Total</p>
                <p className="text-text font-semibold">{formatCurrency(detailOrder.totalCost)}</p>
              </div>
            </div>

            {detailOrder.notes && (
              <div>
                <p className="text-xs text-text-muted">Notas</p>
                <p className="text-sm text-text">{detailOrder.notes}</p>
              </div>
            )}

            <h4 className="text-sm font-semibold text-text mb-1">Prendas</h4>
            <Table<any>
              columns={[
                { header: 'Prenda', render: (li) => li.item?.name ?? itemName(li.itemId) },
                { header: 'Talle / Color', render: (li) => {
                  if (!li.variantDists || li.variantDists.length === 0) return <span className="text-text-muted">Sin distribución</span>;
                  return li.variantDists.map((d: any) => `${d.variant?.size ?? '?'} / ${d.variant?.color ?? '?'} (x${d.quantity})`).join(', ');
                }},
                { header: 'Cant.', render: (li) => li.quantity, align: 'right' },
                { header: 'Costo U.', render: (li) => formatCurrency(li.unitCost), align: 'right' },
                { header: 'Subtotal', render: (li) => formatCurrency(li.quantity * li.unitCost), align: 'right' },
              ]}
              rows={detailOrder.lines ?? []}
              rowKey={(li: any) => li.id}
            />
          </div>
        </Modal>
      )}

      {/* Create Wizard */}
      <Modal open={wizardOpen} onClose={() => setWizardOpen(false)} title={`Nueva compra — Paso ${step} de 3`} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-text-muted">Datos generales de la orden de compra</p>
              <select
                value={header.supplierId}
                onChange={(e) => setHeader({ ...header, supplierId: e.target.value })}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text"
              >
                <option value="">Sin proveedor</option>
                {(suppliers ?? []).map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <textarea
                placeholder="Notas (opcional)"
                value={header.notes}
                onChange={(e) => setHeader({ ...header, notes: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text"
              />
              <div className="flex justify-end">
                <Button type="button" onClick={() => setStep(2)}>Siguiente</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-text-muted">Agregá las prendas de esta compra</p>
              <p className="text-xs text-text-muted">Total estimado: {formatCurrency(getTotalCost())}</p>

              {lines.map((line, idx) => (
                <div key={line.tempId} className="rounded-lg border border-border p-3 space-y-2">
                  <div className="grid grid-cols-4 gap-2 items-center">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-text-muted">Prenda</label>
                      <select
                        value={line.itemId}
                        onChange={(e) => updateLine(idx, { itemId: e.target.value })}
                        required
                        className="w-full rounded border border-border bg-bg px-2 py-1.5 text-xs text-text"
                      >
                        <option value="">Seleccionar</option>
                        {(items ?? []).map((i) => (
                          <option key={i.id} value={i.id}>{i.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-text-muted">Cantidad</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={line.quantity}
                        onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) })}
                        required
                        min="1"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-text-muted">Costo unitario</label>
                      <Input
                        type="number"
                        placeholder="$0"
                        value={line.unitCost}
                        onChange={(e) => updateLine(idx, { unitCost: Number(e.target.value) })}
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-text-muted">&nbsp;</label>
                      <button
                        type="button"
                        onClick={() => openDistModal(idx)}
                        className="w-full rounded px-2 py-1.5 text-xs bg-bg-subtle text-text-muted border border-border hover:bg-border"
                      >
                        Talles
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-text-muted">
                      {line.variantDists.length > 0
                        ? `${line.variantDists.reduce((s, d) => s + d.quantity, 0)}/${line.quantity} distribuidos`
                        : 'Sin distribución por talle'}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeLine(idx)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ))}

              <Button type="button" variant="secondary" onClick={addLine}>
                + Agregar prenda
              </Button>

              <Button type="button" variant="secondary" onClick={() => { setImportRows([]); setImportFileName(''); setImportOpen(true); }}>
                📎 Importar CSV/Excel
              </Button>

              <div className="flex justify-between pt-2">
                <Button type="button" variant="secondary" onClick={() => setStep(1)}>Atrás</Button>
                <Button type="button" onClick={() => setStep(3)}>Revisar</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm text-text-muted">Resumen de la compra</p>
              <div className="text-xs text-text space-y-1">
                <p>Proveedor: {supplierName(header.supplierId)}</p>
                <p>Notas: {header.notes || '—'}</p>
              </div>

              <Table<LineEntry>
                columns={[
                  { header: 'Prenda', render: (l) => itemName(l.itemId) },
                  { header: 'Cant.', render: (l) => l.quantity, align: 'right' },
                  { header: 'Costo U.', render: (l) => formatCurrency(l.unitCost), align: 'right' },
                  { header: 'Subtotal', render: (l) => formatCurrency(l.quantity * l.unitCost), align: 'right' },
                  { header: 'Talles', render: (l) => l.variantDists.length > 0 ? `${l.variantDists.length} talles` : '—' },
                ]}
                rows={lines}
                rowKey={(l) => l.tempId}
              />

              <p className="text-sm font-semibold text-right">Total: {formatCurrency(getTotalCost())}</p>

              <div className="flex justify-between pt-2">
                <Button type="button" variant="secondary" onClick={() => setStep(2)}>Atrás</Button>
                <Button type="submit">Registrar compra</Button>
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* Variant Distribution Modal */}
      {distModalLineIdx !== null && lines[distModalLineIdx] && (
        <Modal
          open={true}
          onClose={() => setDistModalLineIdx(null)}
          title="Distribución por talles"
          size="lg"
        >
          <div className="space-y-2">
            <p className="text-xs text-text-muted">
              Prenda: {itemName(lines[distModalLineIdx]!.itemId)} — Total: {lines[distModalLineIdx]!.quantity} unidades
            </p>
            <p className="text-xs text-text-muted">
              Ajustá las cantidades por talle/color. La suma debe coincidir con el total.
            </p>
            <Table<{ idx: number } & VariantDistEntry>
              columns={[
                { header: 'Talle', render: (d) => d.size },
                { header: 'Color', render: (d) => d.color },
                { header: 'Cantidad', render: (d) => (
                  <input
                    type="number"
                    value={d.quantity}
                    onChange={(e) => updateVariantDist(distModalLineIdx, d.idx, Number(e.target.value))}
                    min="0"
                    className="w-20 rounded border border-border px-2 py-1 text-xs text-text"
                  />
                )},
                { header: 'Precio compra', render: (d) => (
                  <input
                    type="number"
                    value={d.unitCost ?? lines[distModalLineIdx]!.unitCost}
                    onChange={(e) => updateVariantDist(distModalLineIdx, d.idx, d.quantity, Number(e.target.value))}
                    min="0"
                    step="0.01"
                    className="w-24 rounded border border-border px-2 py-1 text-xs text-text"
                  />
                )},
              ]}
              rows={lines[distModalLineIdx]!.variantDists.map((d, i) => ({ ...d, idx: i }))}
              rowKey={(d) => d.variantId}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setDistModalLineIdx(null)}>Cerrar</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Import CSV/Excel Modal */}
      <Modal open={importOpen} onClose={() => { setImportOpen(false); setImportRows([]); setImportFileName(''); }} title="Importar CSV / Excel" size="lg">
        <div className="space-y-4">
          {importRows.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-text-muted">
                Seleccioná un archivo <strong>.csv</strong> o <strong>.xlsx</strong> con las columnas:
              </p>
              <ul className="text-xs text-text-muted list-disc ml-4 space-y-1">
                <li><strong>SKU</strong> (obligatorio) — código de la variante, ej: RLIS-S-BLA</li>
                <li><strong>Cantidad</strong> (obligatorio) — unidades por variante</li>
                <li><strong>Precio Compra</strong> (opcional) — costo unitario por variante</li>
              </ul>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileImport(f);
                }}
                className="block w-full text-sm text-text"
              />
              {importFileName && (
                <p className="text-xs text-text-muted">Archivo seleccionado: {importFileName}</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-text-muted">
                {importRows.filter(r => r.status === 'ok').length} de {importRows.length} filas válidas
              </p>
              <Table<ImportRowPreview>
                columns={[
                  { header: 'SKU', render: (r) => r.sku },
                  { header: 'Prenda', render: (r) => r.itemName ?? <span className="text-red-500">No encontrada</span> },
                  { header: 'Talle', render: (r) => r.size ?? '—' },
                  { header: 'Color', render: (r) => r.color ?? '—' },
                  { header: 'Cantidad', render: (r) => r.quantity, align: 'right' },
                  { header: 'P.Compra', render: (r) => r.unitCost !== null ? formatCurrency(r.unitCost) : '—', align: 'right' },
                  { header: 'Estado', render: (r) => (
                    r.status === 'ok' ? <Badge tone="success">✅ OK</Badge>
                    : r.status === 'duplicate_sku' ? <Badge tone="warning">⚠️ Duplicado</Badge>
                    : <Badge tone="danger">❌ No encontrado</Badge>
                  )},
                ]}
                rows={importRows}
                rowKey={(r) => r._key}
              />
              <div className="flex justify-between pt-2">
                <Button type="button" variant="secondary" onClick={() => { setImportRows([]); setImportFileName(''); }}>
                  Volver
                </Button>
                <Button type="button" onClick={addImportedLines}>
                  Agregar al wizard ({importRows.filter(r => r.status === 'ok').length})
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}