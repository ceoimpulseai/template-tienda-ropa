// EJEMPLO: adaptar a la lógica del rubro concreto.
import { useSearchParams } from 'react-router-dom';
import { Tabs } from '../../../ui/Tabs';
import { PageHeader } from '../../../components/PageHeader';
import { IncomeStatementTab } from './IncomeStatementTab';
import { BreakEvenTab } from './BreakEvenTab';
import { ProductMarginsTab } from './ProductMarginsTab';
import { RatiosTab } from './RatiosTab';

const TABS = [
  { key: 'income-statement', label: 'Estado de Resultados' },
  { key: 'break-even', label: 'Punto de Equilibrio' },
  { key: 'product-margins', label: 'Márgenes por Prenda' },
  { key: 'ratios', label: 'Ratios Financieros' },
];

export function FinancialsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'income-statement';

  const handleTabChange = (key: string) => {
    setSearchParams({ tab: key });
  };

  return (
    <div>
      <PageHeader
        title="Financiero"
        description="Estado de resultados, punto de equilibrio y análisis de márgenes."
      />
      <Tabs tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />
      <div className="mt-6">
        {activeTab === 'income-statement' && <IncomeStatementTab />}
        {activeTab === 'break-even' && <BreakEvenTab />}
        {activeTab === 'product-margins' && <ProductMarginsTab />}
        {activeTab === 'ratios' && <RatiosTab />}
      </div>
    </div>
  );
}