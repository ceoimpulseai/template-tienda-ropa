export interface Tab {
  key: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

/**
 * Tabs — pill-style tab bar with accessible ARIA attributes.
 * Active tab uses bg-primary/10 + text-primary; inactive uses text-muted.
 */
export function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  return (
    <div className="flex flex-wrap gap-1" role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.key)}
            className={[
          'rounded-md px-4 py-2 text-sm font-medium transition outline-none',
          'focus-visible:ring-2 focus-visible:ring-primary-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-text-muted hover:text-text',
            ].join(' ')}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}