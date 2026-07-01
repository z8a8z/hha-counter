import { useState, useEffect, useRef } from 'react';
import {
  getGlues, getGlueTypes,
  addGlueType, deleteGlueType,
  upsertGlue, deleteGlue
} from '../../lib/database.js';
import { useStorageEntity } from '../../hooks/useStorage.js';

const gluesApi = {
  getItems: getGlues,
  getLookups: getGlueTypes,
  addLookup: addGlueType,
  upsertItem: upsertGlue,
  deleteItem: deleteGlue,
  deleteLookup: deleteGlueType
};

export default function StorageGlues() {
  const {
    items, lookups: types, loading, error, successMsg,
    fetchAll, addLookup, upsertItem, deleteItem, deleteLookup
  } = useStorageEntity(gluesApi);

  const [selectedType, setSelectedType] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [notes, setNotes] = useState('');
  const [newTypeName, setNewTypeName] = useState('');
  const [localError, setLocalError] = useState('');

  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchAll();
    }
  }, [fetchAll]);

  const handleUpsert = async (e) => {
    e.preventDefault();
    if (!selectedType) return;
    await upsertItem(parseInt(selectedType), quantity, notes || null);
    setSelectedType('');
    setQuantity('0');
    setNotes('');
  };

  const handleAddType = async () => {
    if (!newTypeName.trim()) return;
    const ok = await addLookup(newTypeName.trim());
    if (ok) setNewTypeName('');
  };

  const handleDeleteType = async (id, name) => {
    const ok = await deleteLookup(id, `حذف نوع الصمغ "${name}"؟`);
    if (!ok && error) setLocalError(error);
    else setLocalError('');
  };

  if (loading && items.length === 0) {
    return <div className="storage-loading"><div className="spinner"></div><p>جاري تحميل الصمغ...</p></div>;
  }

  return (
    <div className="storage-entity">
      {(error || localError) && <div className="error-banner">{error || localError}</div>}
      {successMsg && <div className="success-banner">{successMsg}</div>}

      <div className="storage-layout">
        <div className="storage-list-panel">
          <h3>الصمغ ({items.length})</h3>
          {items.length === 0 ? (
            <div className="empty-state">لا يوجد صمغ مسجل بعد</div>
          ) : (
            <div className="storage-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>النوع</th>
                    <th>الكمية الكلية</th>
                    <th>الوحدة</th>
                    <th>ملاحظات</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.type_name}</strong></td>
                      <td><span className="mono">{item.quantity}</span></td>
                      <td>kg</td>
                      <td className="notes-cell">{item.notes || '-'}</td>
                      <td>
                        <button
                          className="btn btn-small btn-outline"
                          onClick={() => deleteItem(item.id, `حذف الصمغ "${item.type_name}"؟`)}
                        >حذف</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="storage-sidebar">
          <div className="sidebar-card">
            <h4>إضافة / تحديث صمغ</h4>
            <form onSubmit={handleUpsert} className="storage-form">
              <div className="form-group">
                <label>النوع</label>
                <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} required>
                  <option value="">-- اختر النوع --</option>
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>الكمية (kg)</label>
                <input type="text" inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value.replace(/[^0-9.]/g, ''))} />
              </div>
              <div className="form-group">
                <label>ملاحظات</label>
                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary btn-block">حفظ</button>
            </form>
          </div>

          <div className="sidebar-card">
            <h4>إدارة الأنواع</h4>
            <div className="lookup-form-row">
              <input type="text" placeholder="نوع صمغ جديد" value={newTypeName} onChange={(e) => setNewTypeName(e.target.value)} />
              <button className="btn btn-primary btn-small" onClick={handleAddType}>+</button>
            </div>
            <ul className="lookup-list">
              {types.map((t) => (
                <li key={t.id}>
                  <span>{t.name}</span>
                  <button className="btn-delete-mini" onClick={() => handleDeleteType(t.id, t.name)} title="حذف">x</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
