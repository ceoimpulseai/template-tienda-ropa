import { useState } from 'react';
import type { FormEvent } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Checkbox } from '../../ui/Checkbox';
import { Select } from '../../ui/Select';
import { Table } from '../../ui/Table';
import { Modal } from '../../ui/Modal';
import { PageHeader } from '../../components/PageHeader';
import { useApi } from '../../lib/useApi';
import { apiFetch } from '../../lib/apiFetch';
import { businessConfig } from '../../config/business.config';
import type { Item, Variant } from '@template/shared';
import { Can } from '../../components/Can';

interface ItemWithVariants extends Item {
  variants?: Variant[];
}

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Único'];
const CATEGORIES = ['remera', 'pantalon', 'vestido', 'campera', 'calzado', 'buzo', 'pollera', 'camisa', 'short', 'musculosa', 'accesorio'];
const GENDERS = ['male', 'female', 'unisex'];
const SEASONS = ['spring', 'summer', 'fall', 'winter', 'all'];

function getTotalStock(item: ItemWithVariants): number {
  return item.variants?.reduce((sum, v) => sum + v.stock, 0) ?? 0;
}

function genderLabel(g: string | null | undefined): string {
  switch (g) {
    case 'male': return 'Hombre';
    case 'female': return 'Mujer';
    case 'unisex': return 'Unisex';
    default: return '—';
  }
}

export function ItemsPage() {
  const { data, loading, error, refetch } = useApi<ItemWithVariants[]>('/items');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemWithVariants | null>(null);

  const [form, setForm] = useState({
    name: '',
    price: '',
    category: '',
    gender: '',
    season: [] as string[],
    material: '',
    careInstructions: '',
    brand: '',
    description: '',
    sizes: SIZES.slice() as string[],
    customSize: '',
  });

  function resetForm() {
    setForm({
      name: '',
      price: '',
      category: '',
      gender: '',
      season: [],
      material: '',
      careInstructions: '',
      brand: '',
      description: '',
      sizes: SIZES.slice(),
      customSize: '',
    });
  }

  function openCreate() {
    resetForm();
    setCreateModalOpen(true);
  }

  function openEdit(item: ItemWithVariants) {
    setForm({
      name: item.name,
      price: String(item.price),
      category: item.category ?? '',
      gender: item.gender ?? '',
      season: item.season ?? [],
      material: item.material?.join(', ') ?? '',
      careInstructions: item.careInstructions ?? '',
      brand: item.brand ?? '',
      description: item.description ?? '',
      sizes: item.sizes?.length ? item.sizes : SIZES.slice(),
      customSize: '',
    });
    setEditModalOpen(true);
  }

  function openStockDetail(item: ItemWithVariants) {
    setSelectedItem(item);
    setStockModalOpen(true);
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    const allSizes = [...form.sizes];
    if (form.customSize.trim()) {
      allSizes.push(form.customSize.trim().toUpperCase());
    }
    await apiFetch('/items', {
      method: 'POST',
      body: JSON.stringify({
        name: form.name,
        price: Number(form.price),
        category: form.category || null,
        gender: form.gender || null,
        season: form.season.length ? form.season : null,
        material: form.material ? form.material.split(',').map(s => s.trim()) : null,
        careInstructions: form.careInstructions || null,
        brand: form.brand || null,
        description: form.description || null,
        sizes: allSizes,
      }),
    });
    setCreateModalOpen(false);
    refetch();
  }

  async function handleUpdate(event: FormEvent) {
    event.preventDefault();
    if (!selectedItem) return;
    const allSizes = [...form.sizes];
    if (form.customSize.trim()) {
      allSizes.push(form.customSize.trim().toUpperCase());
    }
    await apiFetch(`/items/${selectedItem.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: form.name,
        price: Number(form.price),
        category: form.category || null,
        gender: form.gender || null,
        season: form.season.length ? form.season : null,
        material: form.material ? form.material.split(',').map(s => s.trim()) : null,
        careInstructions: form.careInstructions || null,
        brand: form.brand || null,
        description: form.description || null,
        sizes: allSizes,
      }),
    });
    setEditModalOpen(false);
    refetch();
  }

  async function handleDelete(item: ItemWithVariants) {
    if (!confirm(`¿Eliminar "${item.name}"? Esta acción no se puede deshacer.`)) return;
    await apiFetch(`/items/${item.id}`, { method: 'DELETE' });
    refetch();
  }

  async function handleToggleVisible(item: ItemWithVariants) {
    await apiFetch(`/items/${item.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ visibleInCatalog: !item.visibleInCatalog }),
    });
    refetch();
  }

  function handleSizeChange(size: string, checked: boolean) {
    setForm(prev => ({
      ...prev,
      sizes: checked ? [...prev.sizes, size] : prev.sizes.filter(s => s !== size),
    }));
  }

function handleSeasonChange(season: string, checked: boolean): void {
    setForm(prev => ({
      ...prev,
      season: checked ? [...prev.season, season] : prev.season.filter(s => s !== season),
    }));
  }

  return (
    <div>
      <PageHeader
        title={businessConfig.terminology.itemPlural}
        description="Administra el catálogo de prendas, precios y disponibilidad en la tienda."
        action={
          <Can permission="items:create">
            <Button type="button" onClick={openCreate}>
              Nueva {businessConfig.terminology.item}
            </Button>
          </Can>
        }
      />

      <Card>
        {error && <p className="mb-4 text-sm text-danger">{error.message}</p>}

        {loading ? (
          <p className="text-text-muted">Cargando…</p>
        ) : (
          <Table<ItemWithVariants>
            columns={[
              { header: 'Nombre', render: (i) => i.name },
              {
                header: 'Precio',
                render: (i) => `$${Number(i.price).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
                align: 'right',
              },
              { header: 'Categoría', render: (i) => i.category ?? '—' },
              { header: 'Género', render: (i) => genderLabel(i.gender) },
              { header: 'Marca', render: (i) => i.brand ?? '—' },
              {
                header: 'Stock (total talles)',
                render: (i) => getTotalStock(i),
                align: 'right',
              },
              {
                header: 'Visible en catálogo',
                render: (i) => (
                  <Can permission="items:update">
                    <Checkbox
                      aria-label={`Visible en catálogo público: ${i.name}`}
                      checked={i.visibleInCatalog}
                      onChange={() => handleToggleVisible(i)}
                    />
                  </Can>
                ),
              },
              {
                header: 'Acciones',
                width: '240px',
                render: (i) => (
                  <Can permission="items:update">
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(i)}
                        title="Editar"
                      >
                        ✏️
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openStockDetail(i)}
                        title="Stock por talle"
                      >
                        📦
                      </Button>
                    </div>
                  </Can>
                ),
              },
              {
                header: '',
                width: '60px',
                render: (i) => (
                  <Can permission="items:delete">
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(i)}
                      title="Eliminar"
                    >
                      🗑️
                    </Button>
                  </Can>
                ),
              },
            ]}
            rows={data ?? []}
            rowKey={(i) => i.id}
          />
        )}
      </Card>

      <Can permission="items:create">
        <Modal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title={`Nueva ${businessConfig.terminology.item}`}
          size="lg"
        >
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                placeholder="Nombre"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Precio"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
              <Select
                placeholder="Categoría"
                value={form.category}
                onChange={(value) => setForm({ ...form, category: value })}
                options={CATEGORIES.map(c => ({ value: c, label: c }))}
              />
              <Select
                placeholder="Género"
                value={form.gender}
                onChange={(value) => setForm({ ...form, gender: value })}
                options={GENDERS.map(g => ({ value: g, label: genderLabel(g) }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Temporada</label>
                <div className="flex flex-wrap gap-2">
                  {SEASONS.map(s => (
                    <label key={s} className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <Checkbox
                        checked={form.season.includes(s)}
                        onChange={(e) => handleSeasonChange(s, e.target.checked)}
                      />
                      <span className="capitalize">{s === 'all' ? 'Todas' : s}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Talles</label>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {SIZES.map(s => (
                    <label key={s} className="flex items-center gap-1.5 text-sm cursor-pointer whitespace-nowrap">
                      <Checkbox
                        checked={form.sizes.includes(s)}
                        onChange={(e) => handleSizeChange(s, e.target.checked)}
                      />
                      <span>{s}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <Input
              placeholder="Talle personalizado (ej: 38, 42, 85)"
              value={form.customSize}
              onChange={(e) => setForm({ ...form, customSize: e.target.value })}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                placeholder="Material (separado por comas)"
                value={form.material}
                onChange={(e) => setForm({ ...form, material: e.target.value })}
              />
              <Input
                placeholder="Marca"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <textarea
                placeholder="Instrucciones de cuidado"
                value={form.careInstructions}
                onChange={(e) => setForm({ ...form, careInstructions: e.target.value })}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text resize-y min-h-[80px]"
                rows={3}
              />
              <textarea
                placeholder="Descripción"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text resize-y min-h-[80px]"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setCreateModalOpen(false)}>Cancelar</Button>
              <Button type="submit">Crear</Button>
            </div>
          </form>
        </Modal>
      </Can>

      <Can permission="items:update">
        <Modal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title={`Editar ${businessConfig.terminology.item}`}
          size="lg"
        >
          <form onSubmit={handleUpdate} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                placeholder="Nombre"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Precio"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
              <Select
                placeholder="Categoría"
                value={form.category}
                onChange={(value) => setForm({ ...form, category: value })}
                options={CATEGORIES.map(c => ({ value: c, label: c }))}
              />
              <Select
                placeholder="Género"
                value={form.gender}
                onChange={(value) => setForm({ ...form, gender: value })}
                options={GENDERS.map(g => ({ value: g, label: genderLabel(g) }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Temporada</label>
                <div className="flex flex-wrap gap-2">
                  {SEASONS.map(s => (
                    <label key={s} className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <Checkbox
                        checked={form.season.includes(s)}
                        onChange={(e) => handleSeasonChange(s, e.target.checked)}
                      />
                      <span className="capitalize">{s === 'all' ? 'Todas' : s}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Talles</label>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {SIZES.map(s => (
                    <label key={s} className="flex items-center gap-1.5 text-sm cursor-pointer whitespace-nowrap">
                      <Checkbox
                        checked={form.sizes.includes(s)}
                        onChange={(e) => handleSizeChange(s, e.target.checked)}
                      />
                      <span>{s}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <Input
              placeholder="Talle personalizado (ej: 38, 42, 85)"
              value={form.customSize}
              onChange={(e) => setForm({ ...form, customSize: e.target.value })}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                placeholder="Material (separado por comas)"
                value={form.material}
                onChange={(e) => setForm({ ...form, material: e.target.value })}
              />
              <Input
                placeholder="Marca"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <textarea
                placeholder="Instrucciones de cuidado"
                value={form.careInstructions}
                onChange={(e) => setForm({ ...form, careInstructions: e.target.value })}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text resize-y min-h-[80px]"
                rows={3}
              />
              <textarea
                placeholder="Descripción"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text resize-y min-h-[80px]"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setEditModalOpen(false)}>Cancelar</Button>
              <Button type="submit">Guardar cambios</Button>
            </div>
          </form>
        </Modal>
      </Can>

      <Modal
        open={stockModalOpen}
        onClose={() => { setStockModalOpen(false); setSelectedItem(null); }}
        title={`Stock por talle — ${selectedItem?.name ?? ''}`}
        size="lg"
      >
        {selectedItem && (
          <div>
            {selectedItem.variants && selectedItem.variants.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-text-muted">
                      <th className="pb-2 px-2">Talle</th>
                      <th className="pb-2 px-2">Color</th>
                      <th className="pb-2 px-2">SKU</th>
                      <th className="pb-2 px-2 text-right">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const bySize = new Map<string, typeof selectedItem.variants>();
                      selectedItem.variants!.forEach(v => {
                        const arr = bySize.get(v.size) || [];
                        arr.push(v);
                        bySize.set(v.size, arr);
                      });
                      return Array.from(bySize.entries()).map(([size, variants]) => {
                        const total = variants.reduce((s, v) => s + v.stock, 0);
                        return (
                          <tbody key={size}>
                            <tr className="bg-bg-subtle/50 font-medium">
                              <td className="py-2 px-2">{size}</td>
                              <td className="py-2 px-2" colSpan={2}>Total</td>
                              <td className="py-2 px-2 text-right">{total}</td>
                            </tr>
                            {variants.map(v => (
                              <tr key={v.id} className="border-t border-border/50">
                                <td className="py-2 px-2 text-text-muted">—</td>
                                <td className="py-2 px-2">{v.color}</td>
                                <td className="py-2 px-2 font-mono text-xs">{v.sku}</td>
                                <td className="py-2 px-2 text-right">{v.stock}</td>
                              </tr>
                            ))}
                          </tbody>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-text-muted text-center py-8">Sin variantes registradas para esta prenda.</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}