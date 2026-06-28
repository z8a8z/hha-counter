import { useState } from 'react';
import StorageView from './StorageView.jsx';
import StorageRolls from './StorageRolls.jsx';
import StoragePipes from './StoragePipes.jsx';
import StorageLiquids from './StorageLiquids.jsx';
import StorageInks from './StorageInks.jsx';

export default function StorageDashboard() {
  const [mode, setMode] = useState('view'); // 'view' or 'manage'
  const [manageTab, setManageTab] = useState('rolls'); // 'rolls', 'pipes', 'liquids', 'inks'

  return (
    <div className="storage-container">
      {/* Header Mode Selector */}
      <div className="storage-mode-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>🏭 إدارة وجرد مخزن المواد</h2>
        <div className="btn-group" style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className={`btn btn-small ${mode === 'view' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setMode('view')}
          >
            📊 لوحة العرض والجرد
          </button>
          <button 
            className={`btn btn-small ${mode === 'manage' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setMode('manage')}
          >
            ⚙️ تعديل وإدارة الكميات
          </button>
        </div>
      </div>

      {mode === 'view' ? (
        <StorageView />
      ) : (
        <div className="storage-manage-panel">
          {/* Sub-tabs for management */}
          <div className="storage-tabs-header" style={{ marginBottom: '1rem' }}>
            <button className={`tab ${manageTab === 'rolls' ? 'active' : ''}`} onClick={() => setManageTab('rolls')}>رولات</button>
            <button className={`tab ${manageTab === 'pipes' ? 'active' : ''}`} onClick={() => setManageTab('pipes')}>مواسير</button>
            <button className={`tab ${manageTab === 'liquids' ? 'active' : ''}`} onClick={() => setManageTab('liquids')}>سوائل</button>
            <button className={`tab ${manageTab === 'inks' ? 'active' : ''}`} onClick={() => setManageTab('inks')}>أحبار</button>
          </div>
          <div className="storage-manage-content">
            {manageTab === 'rolls' && <StorageRolls />}
            {manageTab === 'pipes' && <StoragePipes />}
            {manageTab === 'liquids' && <StorageLiquids />}
            {manageTab === 'inks' && <StorageInks />}
          </div>
        </div>
      )}
    </div>
  );
}
