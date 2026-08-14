import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { publicApiFetch } from '../../lib/publicApiFetch';
import { CatalogCart } from './CatalogCart';

interface CatalogItem {
  id: string;
  name: string;
  price: number;
}

interface CatalogResponse {
  business: { name: string; whatsapp: string | null };
  items: CatalogItem[];
}

export function PublicCatalogPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!businessId) return;
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    publicApiFetch(`/catalog/${businessId}`)
      .then((result: CatalogResponse) => {
        if (!cancelled) setCatalog(result);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [businessId]);

  function addOne(itemId: string) {
    setQuantities((q) => ({ ...q, [itemId]: (q[itemId] ?? 0) + 1 }));
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p className="text-text-muted">Cargando…</p>
      </div>
    );
  }

  if (notFound || !catalog) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p className="text-text-muted">Catálogo no encontrado.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold text-text">{catalog.business.name}</h1>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {catalog.items.map((item) => (
          <Card key={item.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium text-text">{item.name}</p>
              <p className="text-text-muted">${item.price}</p>
              {quantities[item.id] ? (
                <p className="text-xs text-text-muted">Cantidad: {quantities[item.id]}</p>
              ) : null}
            </div>
            <Button type="button" onClick={() => addOne(item.id)}>
              Agregar
            </Button>
          </Card>
        ))}
      </div>

      {catalog.items.length === 0 && <p className="text-text-muted">Sin productos disponibles.</p>}

      <CatalogCart
        items={catalog.items}
        quantities={quantities}
        businessName={catalog.business.name}
        whatsapp={catalog.business.whatsapp}
      />
    </div>
  );
}
