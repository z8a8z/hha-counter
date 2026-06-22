import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import UserManagement from './UserManagement.jsx';
import VariationManager from './VariationManager.jsx';

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');

  // Protect route
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Only admins can see the settings
  if (user.role !== 'admin') {
    return (
      <div className="settings-container">
        <div className="settings-card">
          <h2>غير مصرح</h2>
          <p>ليس لديك صلاحية لعرض هذه الصفحة.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'users', label: 'المستخدمين' },
    { id: 'purchase_offices', label: 'مكاتب الشراء' },
    { id: 'roll_widths', label: 'عروض الرولات' },
    { id: 'roll_types', label: 'أنواع الرولات' },
    { id: 'pipe_lengths', label: 'أطوال المواسير' },
    { id: 'liquid_types', label: 'أنواع السوائل' },
    { id: 'ink_companies', label: 'شركات الأحبار' },
    { id: 'ink_colors', label: 'ألوان الأحبار' },
    { id: 'ink_weights', label: 'أوزان الأحبار' }
  ];

  return (
    <div className="settings-container">
      <div className="settings-card">
        <h2>الإعدادات</h2>
        <div className="settings-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="tab-content">
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'purchase_offices' && <VariationManager entity="purchase_offices" />}
          {activeTab === 'roll_widths' && <VariationManager entity="roll_widths" />}
          {activeTab === 'roll_types' && <VariationManager entity="roll_types" />}
          {activeTab === 'pipe_lengths' && <VariationManager entity="pipe_lengths" />}
          {activeTab === 'liquid_types' && <VariationManager entity="liquid_types" />}
          {activeTab === 'ink_companies' && <VariationManager entity="ink_companies" />}
          {activeTab === 'ink_colors' && <VariationManager entity="ink_colors" />}
          {activeTab === 'ink_weights' && <VariationManager entity="ink_weights" />}
        </div>
      </div>
    </div>
  );
}
