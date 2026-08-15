'use client';

import { useState, createContext, useContext } from 'react';

// Tabs Context for proper state management
const TabsContext = createContext({
  activeTab: '',
  setActiveTab: () => {},
});

export function TabsProvider({
  children,
  defaultTab,
  tabs
}: {
  children: React.ReactNode;
  defaultTab: string;
  tabs: { id: string; label: string }[]
}) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            role="tab"
            aria-selected={activeTab === tab.id}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {children}
    </TabsContext.Provider>
  );
}

// Fix TabPanel to properly check active tab
export function TabPanel({ activeTab, children }: { activeTab: string; children: React.ReactNode }) {
  const { activeTab: currentActiveTab } = useContext(TabsContext);
  if (currentActiveTab !== activeTab) {
    return null;
  }
  return <div>{children}</div>;
}

// Keep other components
export function TabItem({ id, children }: { id: string; children: React.ReactNode }) {
  return <div id={id} role="tabpanel">{children}</div>;
}

export function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="card">
      <h2>{title}</h2>
      <div className="chart-wrapper">{children}</div>
    </article>
  );
}

export function Grid({ children, columns = 1 }: { children: React.ReactNode; columns?: 1 | 2 }) {
  return <div className={`grid grid-${columns}`}>{children}</div>;
}

// Export TabsProvider as Tabs for backward compatibility
export { TabsProvider as Tabs };
