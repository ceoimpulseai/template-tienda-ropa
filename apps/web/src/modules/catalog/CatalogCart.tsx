import { Button } from '../../ui/Button';

interface CatalogItem {
  id: string;
  name: string;
  price: number;
}

interface CatalogCartProps {
  items: CatalogItem[];
  quantities: Record<string, number>;
  businessName: string;
  whatsapp: string | null;
}

export function CatalogCart({ items, quantities, businessName, whatsapp }: CatalogCartProps) {
  const selected = items.filter((item) => (quantities[item.id] ?? 0) > 0);
  const digitsOnly = (whatsapp ?? '').replace(/\D/g, '');

  if (selected.length === 0 || !digitsOnly) return null;

  const lines = selected.map((item) => `- ${quantities[item.id]}x ${item.name}`);
  const text = `Hola ${businessName}, quiero hacer este pedido:\n${lines.join('\n')}`;
  const href = `https://wa.me/${digitsOnly}?text=${encodeURIComponent(text)}`;

  return (
    <a href={href} target="_blank" rel="noreferrer">
      <Button type="button">Pedir por WhatsApp</Button>
    </a>
  );
}
