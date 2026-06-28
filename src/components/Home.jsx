import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import Purchases from './purchases/Purchases.jsx';
import ReadyOrders from './orders/ReadyOrders.jsx';
import Orders from './orders/Orders.jsx';
import StorageDashboard from './storage/StorageDashboard.jsx';

const TABS = [
  { id: 'purchases', label: 'مشتريات',    icon: '🛒' },
  { id: 'ready',     label: 'جاهز',       icon: '📦' },
  { id: 'orders',    label: 'الطلبيات',   icon: '📋' },
  { id: 'withdraw',  label: 'سحب',        icon: '📤' },
  { id: 'damaged',   label: 'تالف',       icon: '⚠️' },
  { id: 'storage',   label: 'مخزن',       icon: '🏭' },
  { id: 'report',    label: 'تقرير',      icon: '📊' },
];



export default function Home() {
  const { user, allowedTabs } = useAuth();
  const [activeTab, setActiveTab] = useState('purchases');
  const [visitedTabs, setVisitedTabs] = useState(new Set(['purchases']));

  const filteredTabs = TABS.filter(tab => allowedTabs.includes(tab.id));

  // If current active tab is not allowed, switch to the first allowed tab
  useEffect(() => {
    if (filteredTabs.length > 0 && !allowedTabs.includes(activeTab)) {
      const firstAllowed = filteredTabs[0].id;
      setActiveTab(firstAllowed);
      setVisitedTabs((prev) => {
        const next = new Set(prev);
        next.add(firstAllowed);
        return next;
      });
    }
  }, [allowedTabs, activeTab, filteredTabs]);

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
        {filteredTabs.map((tab) => (
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

      {/* Tab panels (kept mounted after first visit for performance, filtered by role permission) */}
      <div className="tab-content">
        {allowedTabs.includes('purchases') && visitedTabs.has('purchases') && (
          <div style={{ display: activeTab === 'purchases' ? 'block' : 'none' }}>
            <Purchases />
          </div>
        )}
        {allowedTabs.includes('ready') && visitedTabs.has('ready') && (
          <div style={{ display: activeTab === 'ready' ? 'block' : 'none' }}>
            <ReadyOrders />
          </div>
        )}
        {allowedTabs.includes('orders') && visitedTabs.has('orders') && (
          <div style={{ display: activeTab === 'orders' ? 'block' : 'none' }}>
            <Orders />
          </div>
        )}
        {allowedTabs.includes('withdraw') && visitedTabs.has('withdraw') && (
          <div style={{ display: activeTab === 'withdraw' ? 'block' : 'none' }} className="empty-tab">
            قسم السحب قيد التطوير 🔧
          </div>
        )}
        {allowedTabs.includes('damaged') && visitedTabs.has('damaged') && (
          <div style={{ display: activeTab === 'damaged' ? 'block' : 'none' }} className="empty-tab">
            قسم التالف قيد التطوير 🔧
          </div>
        )}
        {allowedTabs.includes('storage') && visitedTabs.has('storage') && (
          <div style={{ display: activeTab === 'storage' ? 'block' : 'none' }}>
            <StorageDashboard />
          </div>
        )}
        {allowedTabs.includes('report') && visitedTabs.has('report') && (
          <div style={{ display: activeTab === 'report' ? 'block' : 'none' }} className="empty-tab">
            قسم التقارير قيد التطوير 🔧
          </div>
        )}
      </div>
    </div>
  );
}
