import { useState } from 'react';
import Counter from './counter/Counter.jsx';
import Purchases from './purchases/Purchases.jsx';
import ReadyOrders from './orders/ReadyOrders.jsx';
import Orders from './orders/Orders.jsx';
import StorageDashboard from './storage/StorageDashboard.jsx';

const TABS = [
  { id: 'counter',   label: 'العداد',     icon: '🔢' },
  { id: 'purchases', label: 'مشتريات',    icon: '🛒' },
  { id: 'ready',     label: 'جاهز',       icon: '📦' },
  { id: 'orders',    label: 'الطلبيات',   icon: '📋' },
  { id: 'withdraw',  label: 'سحب',        icon: '📤' },
  { id: 'damaged',   label: 'تالف',       icon: '⚠️' },
  { id: 'storage',   label: 'مخزن',       icon: '🏭' },
  { id: 'report',    label: 'تقرير',      icon: '📊' },
];

export default function Home() {
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
      {/* Tab strip */}
      <div className="home-tabs-header">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
          >
            <span style={{ marginLeft: '0.3rem', fontSize: '0.9em', opacity: 0.8 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels (kept mounted after first visit for performance) */}
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
        {visitedTabs.has('orders') && (
          <div style={{ display: activeTab === 'orders' ? 'block' : 'none' }}>
            <Orders />
          </div>
        )}
        {visitedTabs.has('withdraw') && (
          <div style={{ display: activeTab === 'withdraw' ? 'block' : 'none' }} className="empty-tab">
            قسم السحب قيد التطوير 🔧
          </div>
        )}
        {visitedTabs.has('damaged') && (
          <div style={{ display: activeTab === 'damaged' ? 'block' : 'none' }} className="empty-tab">
            قسم التالف قيد التطوير 🔧
          </div>
        )}
        {visitedTabs.has('storage') && (
          <div style={{ display: activeTab === 'storage' ? 'block' : 'none' }}>
            <StorageDashboard />
          </div>
        )}
        {visitedTabs.has('report') && (
          <div style={{ display: activeTab === 'report' ? 'block' : 'none' }} className="empty-tab">
            قسم التقارير قيد التطوير 🔧
          </div>
        )}
      </div>
    </div>
  );
}
