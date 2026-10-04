import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Select } from '../../ui/Select';
import { publicApiFetch } from '../../lib/publicApiFetch';
import { useApi } from '../../lib/useApi';
import { CatalogCart } from './CatalogCart';

export interface CatalogVariant {
  id: string;
  size: string;
  color: string;
  colorHex: string | null;
  sku: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  thumbnailUrl: string | null;
}

export interface CatalogItem {
  id: string;
  name: string;
  price: number;
  category: string | null;
  gender: string | null;
  brand: string | null;
  description: string | null;
  material: string[] | null;
  careInstructions: string | null;
  thumbnailUrl: string | null;
  variants: CatalogVariant[];
}

export interface CatalogBusiness {
  id: string;
  name: string;
  displayName: string | null;
  description: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  whatsapp: string | null;
  currencySymbol: string;
  shippingPolicy: string | null;
  returnPolicy: string | null;
  socialLinks: Record<string, string> | null;
}

export interface CatalogResponse {
  business: CatalogBusiness;
  items: CatalogItem[];
}

type SelectedVariantMap = Record<string, CatalogVariant | null>;

export function PublicCatalogPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const {
    data: catalog,
    loading,
    error,
  } = useApi<CatalogResponse>(businessId ? `/catalog/${businessId}` : null, publicApiFetch);
  const [selectedVariants, setSelectedVariants] = useState<SelectedVariantMap>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  function selectVariant(itemId: string, variant: CatalogVariant) {
    setSelectedVariants((prev) => ({ ...prev, [itemId]: variant }));
  }

  function getSelectedVariant(itemId: string): CatalogVariant | null {
    return selectedVariants[itemId] ?? null;
  }

  function addOne(itemId: string) {
    const variant = getSelectedVariant(itemId);
    if (!variant || variant.stock <= 0) return;
    setQuantities((q) => ({ ...q, [itemId]: (q[itemId] ?? 0) + 1 }));
  }

  function removeOne(itemId: string) {
    setQuantities((q) => {
      const next = { ...q };
      const current = next[itemId] ?? 0;
      if (current <= 1) {
        delete next[itemId];
      } else {
        next[itemId] = current - 1;
      }
      return next;
    });
  }

  function getQuantity(itemId: string): number {
    return quantities[itemId] ?? 0;
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <div className="aspect-square bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !catalog) {
    return (
      <div className="mx-auto max-w-4xl p-6 text-center">
        <p className="text-text-muted">Catálogo no encontrado.</p>
      </div>
    );
  }

  const businessName = catalog.business.displayName ?? catalog.business.name;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="space-y-4">
        {catalog.business.coverUrl && (
          <div className="aspect-video w-full rounded-xl overflow-hidden">
            <img
              src={catalog.business.coverUrl}
              alt={businessName}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex items-center gap-4">
          {catalog.business.logoUrl && (
            <img
              src={catalog.business.logoUrl}
              alt={businessName}
              className="h-16 w-16 rounded-full object-cover"
            />
          )}
          <div>
            <h1 className="text-2xl font-semibold text-text">{businessName}</h1>
            {catalog.business.description && (
              <p className="text-text-muted mt-1">{catalog.business.description}</p>
            )}
          </div>
        </div>
      </header>

      {catalog.items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-muted">Sin productos disponibles.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.items.map((item) => {
            const variant = getSelectedVariant(item.id);
            const displayVariant = variant ?? item.variants[0] ?? null;
            const showVariantSelector = item.variants.length > 1;

            return (
              <Card key={item.id} className="flex flex-col h-full overflow-hidden">
                <div className="aspect-square relative overflow-hidden bg-muted">
                  {displayVariant?.imageUrl ? (
                    <img
                      src={displayVariant.imageUrl}
                      alt={`${item.name} ${displayVariant.size} ${displayVariant.color}`}
                      className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
                    />
                  ) : item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-muted">
                      Sin imagen
                    </div>
                  )}
                  {displayVariant && displayVariant.stock <= 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-medium px-3 py-1 bg-red-600 rounded">
                        Sin stock
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-3 space-y-2 flex-1 flex flex-col">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-text flex-1 truncate">{item.name}</p>
                    {item.category && (
                      <span className="px-2 py-0.5 text-xs bg-muted rounded text-text-muted capitalize">
                        {item.category}
                      </span>
                    )}
                  </div>

                  {item.gender && (
                    <span className="text-xs text-text-muted capitalize">
                      {item.gender === 'unisex' ? 'Unisex' : item.gender === 'male' ? 'Hombre' : item.gender === 'female' ? 'Mujer' : 'Niños'}
                    </span>
                  )}

                  {item.brand && (
                    <span className="text-xs text-text-muted">Marca: {item.brand}</span>
                  )}

                  <p className="text-lg font-semibold text-primary">
                    {catalog.business.currencySymbol}{displayVariant?.price ?? item.price}
                  </p>

                  {showVariantSelector && (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs text-text-muted mb-1">Talle</label>
                        <Select
                          value={displayVariant?.size ?? ''}
                          onChange={(size) => {
                            const matchedVariant = item.variants.find(
                              (v) => v.size === size && v.color === displayVariant?.color
                            );
                            if (matchedVariant) selectVariant(item.id, matchedVariant);
                          }}
                          options={[
                            ...new Set(
                              item.variants.map((v) => v.size)
                            ),
                          ].map((size) => ({ value: size, label: size }))}
                          placeholder="Seleccionar talle"
                          disabled={item.variants.filter((v) => v.stock > 0).length === 0}
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-text-muted mb-1">Color</label>
                        <Select
                          value={displayVariant?.color ?? ''}
                          onChange={(color) => {
                            const matchedVariant = item.variants.find(
                              (v) => v.color === color && v.size === displayVariant?.size
                            );
                            if (matchedVariant) selectVariant(item.id, matchedVariant);
                          }}
                          options={[
                            ...new Set(
                              item.variants.map((v) => v.color)
                            ),
                          ].map((color) => ({
                            value: color,
                            label: color,
                          }))}
                          placeholder="Seleccionar color"
                          disabled={item.variants.filter((v) => v.stock > 0).length === 0}
                        />
                      </div>
                    </div>
                  )}

                  {displayVariant && displayVariant.colorHex && (
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: displayVariant.colorHex }} />
                      <span>{displayVariant.color}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-auto">
                    {getQuantity(item.id) === 0 ? (
                      <Button
                        type="button"
                        onClick={() => addOne(item.id)}
                        disabled={!displayVariant || displayVariant.stock <= 0}
                        className="flex-1"
                      >
                        Agregar
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 flex-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOne(item.id)}
                          aria-label="Quitar uno"
                        >
                          −
                        </Button>
                        <span className="w-8 text-center font-medium">{getQuantity(item.id)}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => addOne(item.id)}
                          disabled={!displayVariant || displayVariant.stock <= getQuantity(item.id)}
                          aria-label="Agregar uno"
                        >
                          +
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <CatalogCart
        items={catalog.items}
        quantities={quantities}
        selectedVariants={selectedVariants}
        businessName={businessName}
        whatsapp={catalog.business.whatsapp}
      />
    </div>
  );
}