import { useState } from 'react';
import Counter from './Counter.jsx';
import Purchases from './Purchases.jsx';
import ReadyOrders from './ReadyOrders.jsx';
import StorageDashboard from './StorageDashboard.jsx';

export default function Home() {
  const tabs = [
    { id: 'counter', label: 'العداد' },
    { id: 'purchases', label: 'مشتريات' },
    { id: 'ready', label: 'جاهز' },
    { id: 'withdraw', label: 'سحب' },
    { id: 'damaged', label: 'تالف' },
    { id: 'storage', label: 'مخزن' },
    { id: 'report', label: 'تقرير' }
  ];

  const [activeTab, setActiveTab] = useState('counter');
  const [visitedTabs, setVisitedTabs] = useState(new Set(['counter']));

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setVisitedTabs((prev) => {
      if (prev.has(tabId)) return prev;
      const next = new Set(prev);
      next.add(tabId);
      return next;
    });
  };

  return (
    <div className="home-container">
      <div className="home-tabs-header">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {visitedTabs.has('counter') && (
          <div style={{ display: activeTab === 'counter' ? 'block' : 'none' }}>
            <Counter />
          </div>
        )}
        {visitedTabs.has('purchases') && (
          <div style={{ display: activeTab === 'purchases' ? 'block' : 'none' }}>
            <Purchases />
          </div>
        )}
        {visitedTabs.has('ready') && (
          <div style={{ display: activeTab === 'ready' ? 'block' : 'none' }}>
            <ReadyOrders />
          </div>
        )}
        {visitedTabs.has('withdraw') && (
          <div style={{ display: activeTab === 'withdraw' ? 'block' : 'none' }} className="empty-tab">
            قسم سحب فارغ حالياً
          </div>
        )}
        {visitedTabs.has('damaged') && (
          <div style={{ display: activeTab === 'damaged' ? 'block' : 'none' }} className="empty-tab">
            قسم تالف فارغ حالياً
          </div>
        )}
        {visitedTabs.has('storage') && (
          <div style={{ display: activeTab === 'storage' ? 'block' : 'none' }}>
            <StorageDashboard />
          </div>
        )}
        {visitedTabs.has('report') && (
          <div style={{ display: activeTab === 'report' ? 'block' : 'none' }} className="empty-tab">
            قسم تقرير فارغ حالياً
          </div>
        )}
      </div>
    </div>
  );
}
