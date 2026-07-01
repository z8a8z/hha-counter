import { useState } from 'react';
import StorageView from './StorageView.jsx';
import StorageRolls from './StorageRolls.jsx';
import StoragePipes from './StoragePipes.jsx';
import StorageLiquids from './StorageLiquids.jsx';
import StorageInks from './StorageInks.jsx';
import StorageGlues from './StorageGlues.jsx';

export default function StorageDashboard() {
  const [mode, setMode] = useState('view'); // 'view' or 'manage'
  const [manageTab, setManageTab] = useState('rolls'); // 'rolls', 'pipes', 'liquids', 'inks', 'glues'
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="storage-container">
      {/* Header Mode Selector */}
      <div className="storage-mode-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>🏭 إدارة وجرد مخزن المواد</h2>
          <button 
            type="button" 
            className="btn btn-outline" 
            onClick={() => setRefreshKey(prev => prev + 1)} 
            style={{ padding: '0 0.5rem', minWidth: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}
            title="تحديث البيانات"
          >
            🔄
          </button>
        </div>
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
        <StorageView key={refreshKey} />
      ) : (
        <div className="storage-manage-panel">
          {/* Sub-tabs for management */}
          <div className="storage-tabs-header" style={{ marginBottom: '1rem' }}>
            <button className={`tab ${manageTab === 'rolls' ? 'active' : ''}`} onClick={() => setManageTab('rolls')}>رولات</button>
            <button className={`tab ${manageTab === 'pipes' ? 'active' : ''}`} onClick={() => setManageTab('pipes')}>مواسير</button>
            <button className={`tab ${manageTab === 'liquids' ? 'active' : ''}`} onClick={() => setManageTab('liquids')}>سوائل</button>
            <button className={`tab ${manageTab === 'inks' ? 'active' : ''}`} onClick={() => setManageTab('inks')}>أحبار</button>
            <button className={`tab ${manageTab === 'glues' ? 'active' : ''}`} onClick={() => setManageTab('glues')}>صمغ</button>
          </div>
          <div className="storage-manage-content">
            {manageTab === 'rolls' && <StorageRolls key={refreshKey} />}
            {manageTab === 'pipes' && <StoragePipes key={refreshKey} />}
            {manageTab === 'liquids' && <StorageLiquids key={refreshKey} />}
            {manageTab === 'inks' && <StorageInks key={refreshKey} />}
            {manageTab === 'glues' && <StorageGlues key={refreshKey} />}
          </div>
        </div>
      )}
    </div>
  );
}
