import { useState, useEffect, useRef, useCallback } from 'react';
import {
  getRolls, getRollWidths, getRollTypes,
  addRollWidth, addRollType,
  insertRoll, updateRoll, deleteRoll, deleteRollWidth, deleteRollType
} from '../../lib/database.js';

export default function StorageRolls() {
  const [items, setItems] = useState([]);
  const [widths, setWidths] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sidebar form state – add new individual roll
  const [selectedWidth, setSelectedWidth] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [weight, setWeight] = useState('');   // kg, per roll
  const [notes, setNotes] = useState('');

  // Edit existing roll
  const [editingRoll, setEditingRoll] = useState(null);
  const [editWeight, setEditWeight] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // New lookup inputs
  const [newWidth, setNewWidth] = useState('');
  const [newTypeName, setNewTypeName] = useState('');

  const hasFetched = useRef(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    const [itemsRes, wRes, tRes] = await Promise.all([
      getRolls(), getRollWidths(), getRollTypes()
    ]);
    setLoading(false);
    if (itemsRes.error) setError(itemsRes.error);
    else setItems(itemsRes.data || []);
    if (wRes.error) setError((prev) => prev || wRes.error);
    else setWidths(wRes.data || []);
    if (tRes.error) setError((prev) => prev || tRes.error);
    else setTypes(tRes.data || []);
  }, []);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchAll();
    }
  }, [fetchAll]);

  const resetForm = () => {
    setSelectedWidth('');
    setSelectedType('');
    setWeight('');
    setNotes('');
    setError('');
    setSuccessMsg('');
  };

  const handleInsert = async (e) => {
    e.preventDefault();
    if (!selectedWidth || !selectedType || !weight) {
      setError('الرجاء إدخال العرض، النوع، والوزن');
      return;
    }
    const { error: err } = await insertRoll(
      parseInt(selectedWidth), parseInt(selectedType), weight, notes || null
    );
    if (err) { setError(err); return; }
    setSuccessMsg('تمت إضافة الرول بنجاح!');
    resetForm();
    fetchAll();
  };

  const handleEdit = (item) => {
    setEditingRoll(item.id);
    setEditWeight(item.weight);
    setEditNotes(item.notes || '');
  };

  const handleSaveEdit = async (id) => {
    const { error: err } = await updateRoll(id, {
      weight: parseFloat(editWeight) || 0,
      notes: editNotes || null
    });
    if (err) { setError(err); return; }
    setSuccessMsg('تم تحديث الرول!');
    setEditingRoll(null);
    fetchAll();
  };

  const handleCancelEdit = () => {
    setEditingRoll(null);
  };

  const handleDeleteRoll = async (id, label) => {
    if (!window.confirm(`حذف الرول "${label}"؟`)) return;
    const { error: err } = await deleteRoll(id);
    if (err) { setError(err); return; }
    setSuccessMsg('تم حذف الرول!');
    fetchAll();
  };

  const handleAddWidth = async () => {
    if (!newWidth) return;
    const { error: err } = await addRollWidth(newWidth);
    if (err) { setError(err); return; }
    setNewWidth('');
    setSuccessMsg('تمت إضافة العرض!');
    fetchAll();
  };

  const handleAddType = async () => {
    if (!newTypeName.trim()) return;
    const { error: err } = await addRollType(newTypeName);
    if (err) { setError(err); return; }
    setNewTypeName('');
    setSuccessMsg('تمت إضافة النوع!');
    fetchAll();
  };

  const handleDeleteWidth = async (id) => {
    const { error: err } = await deleteRollWidth(id);
    if (err) { setError(err); return; }
    fetchAll();
  };

  const handleDeleteType = async (id) => {
    const { error: err } = await deleteRollType(id);
    if (err) { setError(err); return; }
    fetchAll();
  };

  if (loading && items.length === 0) {
    return <div className="storage-loading"><div className="spinner"></div><p>جاري تحميل الرولات...</p></div>;
  }

  const totalWeight = items.reduce((sum, i) => sum + (parseFloat(i.weight) || 0), 0);

  return (
    <div className="storage-entity">
      {error && <div className="error-banner">{error}</div>}
      {successMsg && <div className="success-banner">{successMsg}</div>}

      <div className="storage-stats-bar">
        <div className="stat-item">
          <span className="stat-label">إجمالي الرولات</span>
          <span className="stat-value">{items.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">الوزن الإجمالي</span>
          <span className="stat-value">{totalWeight.toFixed(2)}</span>
          <span className="stat-unit">كجم</span>
        </div>
      </div>

      <div className="storage-layout">
        {/* Left: Inventory List */}
        <div className="storage-list-panel">
          <h3>رولات المخزن ({items.length})</h3>
          {items.length === 0 ? (
            <div className="empty-state">لا توجد رولات مسجلة بعد</div>
          ) : (
            <div className="storage-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>العرض</th>
                    <th>النوع</th>
                    <th>الوزن (كجم)</th>
                    <th>ملاحظات</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td><span className="mono">#{item.id}</span></td>
                      <td><span className="mono">{item.width_label}</span></td>
                      <td>{item.type_name}</td>
                      <td>
                        {editingRoll === item.id ? (
                          <input
                            type="text"
                            inputMode="decimal"
                            value={editWeight}
                            onChange={(e) => setEditWeight(e.target.value.replace(/[^0-9.]/g, ''))}
                            className="inline-edit-input"
                            autoFocus
                          />
                        ) : (
                          <strong className="mono">{item.weight}</strong>
                        )}
                      </td>
                      <td className="notes-cell">
                        {editingRoll === item.id ? (
                          <input
                            type="text"
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            className="inline-edit-input"
                          />
                        ) : (
                          item.notes || '-'
                        )}
                      </td>
                      <td>
                        {editingRoll === item.id ? (
                          <div className="btn-group">
                            <button className="btn btn-small btn-success" onClick={() => handleSaveEdit(item.id)}>حفظ</button>
                            <button className="btn btn-small btn-outline" onClick={handleCancelEdit}>إلغاء</button>
                          </div>
                        ) : (
                          <div className="btn-group">
                            <button className="btn btn-small btn-outline" onClick={() => handleEdit(item)}>تعديل</button>
                            <button className="btn btn-small btn-outline" onClick={() => handleDeleteRoll(item.id, `#${item.id} - ${item.width_label} ${item.type_name}`)}>حذف</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Sidebar */}
        <div className="storage-sidebar">
          {/* Add New Roll */}
          <div className="sidebar-card">
            <h4>إضافة رول جديد</h4>
            <form onSubmit={handleInsert} className="storage-form">
              <div className="form-group">
                <label>العرض</label>
                <select value={selectedWidth} onChange={(e) => setSelectedWidth(e.target.value)} required>
                  <option value="">-- اختر العرض --</option>
                  {widths.map((w) => (
                    <option key={w.id} value={w.id}>{w.width} سم</option>
                  ))}
                </select>
              </div>
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
                <label>الوزن (كجم)</label>
                <input type="text" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value.replace(/[^0-9.]/g, ''))} required />
              </div>
              <div className="form-group">
                <label>ملاحظات</label>
                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary btn-block">إضافة رول</button>
            </form>
          </div>

          {/* Manage Widths */}
          <div className="sidebar-card">
            <h4>إدارة العروض (سم)</h4>
            <div className="lookup-form-row">
              <input type="text" inputMode="decimal" placeholder="عرض (سم)" value={newWidth} onChange={(e) => setNewWidth(e.target.value.replace(/[^0-9.]/g, ''))} className="small-input" />
              <button className="btn btn-primary btn-small" onClick={handleAddWidth}>+</button>
            </div>
            <ul className="lookup-list">
              {widths.map((w) => (
                <li key={w.id}>
                  <span>{w.width} سم</span>
                  <button className="btn-delete-mini" onClick={() => handleDeleteWidth(w.id)} title="حذف">x</button>
                </li>
              ))}
            </ul>
          </div>

          {/* Manage Types */}
          <div className="sidebar-card">
            <h4>إدارة الأنواع</h4>
            <div className="lookup-form-row">
              <input type="text" placeholder="اسم نوع جديد" value={newTypeName} onChange={(e) => setNewTypeName(e.target.value)} />
              <button className="btn btn-primary btn-small" onClick={handleAddType}>+</button>
            </div>
            <ul className="lookup-list">
              {types.map((t) => (
                <li key={t.id}>
                  <span>{t.name}</span>
                  <button className="btn-delete-mini" onClick={() => handleDeleteType(t.id)} title="حذف">x</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
