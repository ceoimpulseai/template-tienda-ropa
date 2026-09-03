// EJEMPLO: adaptar a la lógica del rubro concreto.
import { useSearchParams } from 'react-router-dom';
import { Tabs } from '../../../ui/Tabs';
import { Container } from '../../../ui/Container';
import { IncomeStatementTab } from './IncomeStatementTab';
import { BreakEvenTab } from './BreakEvenTab';
import { ProductMarginsTab } from './ProductMarginsTab';
import { RatiosTab } from './RatiosTab';

const TABS = [
  { key: 'income-statement', label: 'Estado de Resultados' },
  { key: 'break-even', label: 'Punto de Equilibrio' },
  { key: 'product-margins', label: 'Márgenes por Producto' },
  { key: 'ratios', label: 'Ratios Financieros' },
];

export function FinancialsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'income-statement';

  const handleTabChange = (key: string) => {
    setSearchParams({ tab: key });
  };

  return (
    <Container>
      <h1 className="mb-6 text-2xl font-semibold text-text">Financiero</h1>
      <Tabs tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />
      <div className="mt-6">
        {activeTab === 'income-statement' && <IncomeStatementTab />}
        {activeTab === 'break-even' && <BreakEvenTab />}
        {activeTab === 'product-margins' && <ProductMarginsTab />}
        {activeTab === 'ratios' && <RatiosTab />}
      </div>
    </Container>
  );
}