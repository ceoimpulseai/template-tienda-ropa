import { Button } from '../../ui/Button';
import type { CatalogItem, CatalogVariant } from './PublicCatalogPage';

interface CatalogCartProps {
  items: CatalogItem[];
  quantities: Record<string, number>;
  selectedVariants: Record<string, CatalogVariant | null>;
  businessName: string;
  whatsapp: string | null;
}

export function CatalogCart({
  items,
  quantities,
  selectedVariants,
  businessName,
  whatsapp,
}: CatalogCartProps) {
  const selected = items.filter((item) => (quantities[item.id] ?? 0) > 0);
  const digitsOnly = (whatsapp ?? '').replace(/\D/g, '');

  if (selected.length === 0 || !digitsOnly) return null;

  const lines = selected.map((item) => {
    const qty = quantities[item.id] ?? 0;
    const variant = selectedVariants[item.id];
    if (variant) {
      return `- ${qty}x ${item.name} (${variant.size}, ${variant.color}) — SKU: ${variant.sku}`;
    }
    return `- ${qty}x ${item.name}`;
  });

  const text = `Hola ${businessName}, quiero hacer este pedido:\n${lines.join('\n')}`;
  const href = `https://wa.me/${digitsOnly}?text=${encodeURIComponent(text)}`;

  return (
    <a href={href} target="_blank" rel="noreferrer">
      <Button type="button" className="w-full sm:w-auto">
        Pedir por WhatsApp
      </Button>
    </a>
  );
}