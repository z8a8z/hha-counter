import { useState, useEffect, useRef } from 'react';
import {
  getPipes, getPipeLengths,
  addPipeLength,
  upsertPipe, deletePipe, deletePipeLength
} from '../../lib/database.js';
import { useStorageEntity } from '../../hooks/useStorage.js';

const pipesApi = {
  getItems: getPipes,
  getLookups: getPipeLengths,
  addLookup: addPipeLength,
  upsertItem: upsertPipe,
  deleteItem: deletePipe,
  deleteLookup: deletePipeLength
};

export default function StoragePipes() {
  const {
    items, lookups: lengths, loading, error, successMsg,
    fetchAll, addLookup, upsertItem, deleteItem, deleteLookup, clearMessages
  } = useStorageEntity(pipesApi);

  const [selectedLength, setSelectedLength] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [notes, setNotes] = useState('');
  const [newLength, setNewLength] = useState('');

  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchAll();
    }
  }, [fetchAll]);

  const handleUpsert = async (e) => {
    e.preventDefault();
    if (!selectedLength) return;
    await upsertItem(parseInt(selectedLength), quantity, notes || null);
    setSelectedLength('');
    setQuantity('0');
    setNotes('');
  };

  const handleAddLength = async () => {
    if (!newLength) return;
    const ok = await addLookup(newLength);
    if (ok) setNewLength('');
  };

  if (loading && items.length === 0) {
    return <div className="storage-loading"><div className="spinner"></div><p>جاري تحميل المواسير...</p></div>;
  }

  return (
    <div className="storage-entity">
      {error && <div className="error-banner">{error}</div>}
      {successMsg && <div className="success-banner">{successMsg}</div>}

      <div className="storage-layout">
        <div className="storage-list-panel">
          <h3>المواسير ({items.length})</h3>
          {items.length === 0 ? (
            <div className="empty-state">لا توجد مواسير مسجلة بعد</div>
          ) : (
            <div className="storage-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>الطول</th>
                    <th>الكمية</th>
                    <th>ملاحظات</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td><span className="mono">{item.length_label}</span></td>
                      <td><strong>{item.quantity}</strong></td>
                      <td className="notes-cell">{item.notes || '-'}</td>
                      <td>
                        <button
                          className="btn btn-small btn-outline"
                          onClick={() => deleteItem(item.id, `حذف الماسورة "${item.length_label}"؟`)}
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
            <h4>إضافة / تحديث ماسورة</h4>
            <form onSubmit={handleUpsert} className="storage-form">
              <div className="form-group">
                <label>الطول</label>
                <select value={selectedLength} onChange={(e) => setSelectedLength(e.target.value)} required>
                  <option value="">-- اختر الطول --</option>
                  {lengths.map((l) => (
                    <option key={l.id} value={l.id}>{l.length} سم</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>الكمية</label>
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
            <h4>إدارة الأطوال (سم)</h4>
            <div className="lookup-form-row">
              <input type="text" inputMode="decimal" placeholder="طول جديد (سم)" value={newLength} onChange={(e) => setNewLength(e.target.value.replace(/[^0-9.]/g, ''))} />
              <button className="btn btn-primary btn-small" onClick={handleAddLength}>+</button>
            </div>
            <ul className="lookup-list">
              {lengths.map((l) => (
                <li key={l.id}>
                  <span>{l.length} سم</span>
                  <button className="btn-delete-mini" onClick={() => deleteLookup(l.id, `حذف الطول "${l.length} سم"؟`)} title="حذف">x</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
