import { useState, useEffect, useRef } from 'react';
import {
  getInks, getInkCompanies, getInkColors, getInkWeights,
  addInkCompany, addInkColor, addInkWeight,
  upsertInk, deleteInk, deleteInkCompany, deleteInkColor, deleteInkWeight
} from '../../lib/database.js';

export default function StorageInks() {
  const [items, setItems] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [colors, setColors] = useState([]);
  const [weights, setWeights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Add/update ink form
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState('0');  // kg
  const [notes, setNotes] = useState('');

  // New lookup inputs
  const [newCompany, setNewCompany] = useState('');
  const [newColor, setNewColor] = useState('');
  const [newWeight, setNewWeight] = useState('');

  const hasFetched = useRef(false);

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    const [itemsRes, cRes, colRes, wRes] = await Promise.all([
      getInks(), getInkCompanies(), getInkColors(), getInkWeights()
    ]);
    setLoading(false);
    if (itemsRes.error) setError(itemsRes.error);
    else setItems(itemsRes.data || []);
    if (cRes.error) setError((prev) => prev || cRes.error);
    else setCompanies(cRes.data || []);
    if (colRes.error) setError((prev) => prev || colRes.error);
    else setColors(colRes.data || []);
    if (wRes.error) setError((prev) => prev || wRes.error);
    else setWeights(wRes.data || []);
  };

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchAll();
    }
  }, []);

  const handleUpsert = async (e) => {
    e.preventDefault();
    if (!selectedCompany || !selectedColor) return;
    const { error: err } = await upsertInk(parseInt(selectedCompany), parseInt(selectedColor), quantity, notes || null);
    if (err) { setError(err); return; }
    setSuccessMsg('تم حفظ الحبر!');
    setSelectedCompany('');
    setSelectedColor('');
    setQuantity('0');
    setNotes('');
    fetchAll();
  };

  const handleDeleteInk = async (id, label) => {
    if (!window.confirm(`حذف الحبر "${label}"؟`)) return;
    const { error: err } = await deleteInk(id);
    if (err) { setError(err); return; }
    setSuccessMsg('تم حذف الحبر!');
    fetchAll();
  };

  const handleAddCompany = async () => {
    if (!newCompany.trim()) return;
    const { error: err } = await addInkCompany(newCompany.trim());
    if (err) { setError(err); return; }
    setNewCompany('');
    fetchAll();
  };

  const handleAddColor = async () => {
    if (!newColor.trim()) return;
    const { error: err } = await addInkColor(newColor.trim());
    if (err) { setError(err); return; }
    setNewColor('');
    fetchAll();
  };

  const handleAddWeight = async () => {
    if (!newWeight) return;
    const { error: err } = await addInkWeight(newWeight);
    if (err) { setError(err); return; }
    setNewWeight('');
    fetchAll();
  };

  const handleDeleteCompany = async (id) => {
    await deleteInkCompany(id);
    fetchAll();
  };

  const handleDeleteColor = async (id) => {
    await deleteInkColor(id);
    fetchAll();
  };

  const handleDeleteWeight = async (id) => {
    await deleteInkWeight(id);
    fetchAll();
  };

  if (loading && items.length === 0) {
    return <div className="storage-loading"><div className="spinner"></div><p>جاري تحميل الأحبار...</p></div>;
  }

  const totalKg = items.reduce((sum, i) => sum + (parseFloat(i.quantity) || 0), 0);

  return (
    <div className="storage-entity">
      {error && <div className="error-banner">{error}</div>}
      {successMsg && <div className="success-banner">{successMsg}</div>}

      <div className="storage-stats-bar">
        <div className="stat-item">
          <span className="stat-label">إجمالي الأنواع</span>
          <span className="stat-value">{items.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">الوزن الإجمالي</span>
          <span className="stat-value">{totalKg.toFixed(2)}</span>
          <span className="stat-unit">kg</span>
        </div>
      </div>

      <div className="storage-layout">
        <div className="storage-list-panel">
          <h3>أحبار المخزن ({items.length})</h3>
          {items.length === 0 ? (
            <div className="empty-state">لا توجد أحبار مسجلة بعد</div>
          ) : (
            <div className="storage-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>الشركة</th>
                    <th>اللون</th>
                    <th>الكمية (kg)</th>
                    <th>ملاحظات</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.company_name}</td>
                      <td>{item.color_name}</td>
                      <td><strong className="mono">{item.quantity}</strong></td>
                      <td className="notes-cell">{item.notes || '-'}</td>
                      <td>
                        <button
                          className="btn btn-small btn-outline"
                          onClick={() => handleDeleteInk(item.id, item.label)}
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
            <h4>إضافة / تحديث حبر</h4>
            <form onSubmit={handleUpsert} className="storage-form">
              <div className="form-group">
                <label>الشركة</label>
                <select value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)} required>
                  <option value="">-- اختر الشركة --</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>اللون</label>
                <select value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)} required>
                  <option value="">-- اختر اللون --</option>
                  {colors.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
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
            <h4>إدارة الشركات</h4>
            <div className="lookup-form-row">
              <input type="text" placeholder="شركة جديدة" value={newCompany} onChange={(e) => setNewCompany(e.target.value)} />
              <button className="btn btn-primary btn-small" onClick={handleAddCompany}>+</button>
            </div>
            <ul className="lookup-list">
              {companies.map((c) => (
                <li key={c.id}>
                  <span>{c.name}</span>
                  <button className="btn-delete-mini" onClick={() => handleDeleteCompany(c.id)} title="حذف">x</button>
                </li>
              ))}
            </ul>
          </div>

          <div className="sidebar-card">
            <h4>إدارة الألوان</h4>
            <div className="lookup-form-row">
              <input type="text" placeholder="لون جديد" value={newColor} onChange={(e) => setNewColor(e.target.value)} />
              <button className="btn btn-primary btn-small" onClick={handleAddColor}>+</button>
            </div>
            <ul className="lookup-list">
              {colors.map((c) => (
                <li key={c.id}>
                  <span>{c.name}</span>
                  <button className="btn-delete-mini" onClick={() => handleDeleteColor(c.id)} title="حذف">x</button>
                </li>
              ))}
            </ul>
          </div>

          <div className="sidebar-card">
            <h4>إدارة أوزان البراميل (kg)</h4>
            <div className="lookup-form-row">
              <input type="text" inputMode="decimal" placeholder="وزن (kg)" value={newWeight} onChange={(e) => setNewWeight(e.target.value.replace(/[^0-9.]/g, ''))} />
              <button className="btn btn-primary btn-small" onClick={handleAddWeight}>+</button>
            </div>
            <ul className="lookup-list">
              {weights.map((w) => (
                <li key={w.id}>
                  <span>{w.weight} kg</span>
                  <button className="btn-delete-mini" onClick={() => handleDeleteWeight(w.id)} title="حذف">x</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
