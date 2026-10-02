import { useSearchParams } from 'react-router-dom';
import { Tabs } from '../../ui/Tabs';
import { EmployeesListTab } from './EmployeesListTab';
import { EmployeesCalendarTab } from './EmployeesCalendarTab';

const TABS = [
  { key: 'list', label: 'Listado' },
  { key: 'calendar', label: 'Calendario' },
];

export function EmployeesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'list';

  const handleTabChange = (key: string) => {
    setSearchParams({ tab: key });
  };

  return (
    <div>
      <Tabs tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />
      <div className="mt-6">
        {activeTab === 'list' && <EmployeesListTab />}
        {activeTab === 'calendar' && <EmployeesCalendarTab />}
      </div>
    </div>
  );
}