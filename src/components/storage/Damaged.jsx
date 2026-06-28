import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import {
  getDamagedRecords, addDamagedRecord,
  getRolls, getRollWidths, getRollTypes,
  getPipes, getPipeLengths,
  getLiquids, getLiquidTypes,
  getInks, getInkCompanies, getInkColors
} from '../../lib/database.js';

export default function Damaged() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dropdown lookups
  const [lookups, setLookups] = useState({
    rolls: [],
    widths: [],
    types: [],
    pipes: [],
    lengths: [],
    liquids: [],
    liquidTypes: [],
    inks: [],
    companies: [],
    colors: []
  });

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [itemType, setItemType] = useState('roll');
  const [rollId, setRollId] = useState('');
  const [variant1, setVariant1] = useState('');
  const [variant2, setVariant2] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');

  // Active stock validation helper
  const [availableStock, setAvailableStock] = useState(null);

  const hasFetched = useRef(false);

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    
    const [
      recordsRes, rollsRes, widthsRes, typesRes,
      pipesRes, lengthsRes, liquidsRes, liquidTypesRes,
      inksRes, companiesRes, colorsRes
    ] = await Promise.all([
      getDamagedRecords(), getRolls(), getRollWidths(), getRollTypes(),
      getPipes(), getPipeLengths(), getLiquids(), getLiquidTypes(),
      getInks(), getInkCompanies(), getInkColors()
    ]);

    setLoading(false);

    if (recordsRes.error) {
      setError(recordsRes.error);
      return;
    }

    setRecords(recordsRes.data || []);
    setLookups({
      rolls: rollsRes.data || [],
      widths: widthsRes.data || [],
      types: typesRes.data || [],
      pipes: pipesRes.data || [],
      lengths: lengthsRes.data || [],
      liquids: liquidsRes.data || [],
      liquidTypes: liquidTypesRes.data || [],
      inks: inksRes.data || [],
      companies: companiesRes.data || [],
      colors: colorsRes.data || []
    });
  };

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchAll();
    }
  }, []);

  // Update dynamic stock indicators when form selections change
  useEffect(() => {
    if (itemType === 'roll' && rollId) {
      const selected = lookups.rolls.find(r => r.id === parseInt(rollId));
      setAvailableStock(selected ? `${selected.weight} kg` : null);
      if (selected) setQuantity(selected.weight.toString());
    } else if (itemType === 'pipe' && variant1) {
      const selected = lookups.pipes.find(p => p.length_id === parseInt(variant1));
      setAvailableStock(selected ? `${selected.quantity} pcs` : '0 pcs');
    } else if (itemType === 'liquid' && variant1) {
      const selected = lookups.liquids.find(l => l.type_id === parseInt(variant1));
      setAvailableStock(selected ? `${selected.quantity} L` : '0 L');
    } else if (itemType === 'ink' && variant1 && variant2) {
      const selected = lookups.inks.find(i => i.company_id === parseInt(variant1) && i.color_id === parseInt(variant2));
      setAvailableStock(selected ? `${selected.quantity} kg` : '0 kg');
    } else {
      setAvailableStock(null);
    }
  }, [itemType, rollId, variant1, variant2, lookups]);

  const handleOpenModal = () => {
    setItemType('roll');
    setRollId('');
    setVariant1('');
    setVariant2('');
    setQuantity('');
    setNotes('');
    setAvailableStock(null);
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const qtyVal = parseFloat(quantity);
    if (!quantity || isNaN(qtyVal) || qtyVal <= 0) {
      setError('الرجاء إدخال كمية تالفة صالحة وأكبر من صفر');
      return;
    }

    // Validation against active stock
    if (itemType === 'roll') {
      if (!rollId) { setError('الرجاء اختيار الرول التالف'); return; }
      const selected = lookups.rolls.find(r => r.id === parseInt(rollId));
      if (!selected) { setError('الرول المختار غير موجود في المخزن'); return; }
      if (qtyVal > selected.weight) {
        setError(`الكمية التالفة (${qtyVal} kg) لا يمكن أن تتجاوز وزن الرول الحالي (${selected.weight} kg)`);
        return;
      }
    } else if (itemType === 'pipe') {
      if (!variant1) { setError('الرجاء اختيار طول الماسورة'); return; }
      const selected = lookups.pipes.find(p => p.length_id === parseInt(variant1));
      const stock = selected ? selected.quantity : 0;
      if (qtyVal > stock) {
        setError(`الكمية التالفة (${qtyVal} pcs) تتجاوز الرصيد المتوفر في المخزن (${stock} pcs)`);
        return;
      }
    } else if (itemType === 'liquid') {
      if (!variant1) { setError('الرجاء اختيار نوع السائل'); return; }
      const selected = lookups.liquids.find(l => l.type_id === parseInt(variant1));
      const stock = selected ? selected.quantity : 0;
      if (qtyVal > stock) {
        setError(`الكمية التالفة (${qtyVal} L) تتجاوز الرصيد المتوفر في المخزن (${stock} L)`);
        return;
      }
    } else if (itemType === 'ink') {
      if (!variant1) { setError('الرجاء اختيار شركة الحبر'); return; }
      if (!variant2) { setError('الرجاء اختيار لون الحبر'); return; }
      const selected = lookups.inks.find(i => i.company_id === parseInt(variant1) && i.color_id === parseInt(variant2));
      const stock = selected ? selected.quantity : 0;
      if (qtyVal > stock) {
        setError(`الكمية التالفة (${qtyVal} kg) تتجاوز الرصيد المتوفر في المخزن (${stock} kg)`);
        return;
      }
    }

    setSubmitting(true);

    // Build payload
    const payload = {
      item_type: itemType,
      quantity: qtyVal,
      notes: notes || null,
      created_by: user?.username || 'مجهول'
    };

    if (itemType === 'roll') {
      const selected = lookups.rolls.find(r => r.id === parseInt(rollId));
      payload.roll_id = parseInt(rollId);
      payload.variant_id_1 = selected.width_id;
      payload.variant_id_2 = selected.type_id;
    } else {
      payload.variant_id_1 = parseInt(variant1);
      if (variant2) payload.variant_id_2 = parseInt(variant2);
    }

    const { error: insertErr } = await addDamagedRecord(payload);
    setSubmitting(false);

    if (insertErr) {
      setError('فشل في تسجيل التالف: ' + insertErr);
    } else {
      setSuccess('تم تسجيل التالف وتحديث المخزن بنجاح!');
      setShowModal(false);
      fetchAll();
    }
  };

  // Helper map to read friendly names in table list
  const getRecordDetails = (rec) => {
    switch (rec.item_type) {
      case 'roll': {
        const w = lookups.widths.find(x => x.id === rec.variant_id_1);
        const t = lookups.types.find(x => x.id === rec.variant_id_2);
        return `رول بلاستيك - عرض ${w ? w.width : rec.variant_id_1} cm (${t ? t.name : '—'})` + (rec.roll_id ? ` [رقم #${rec.roll_id}]` : '');
      }
      case 'pipe': {
        const l = lookups.lengths.find(x => x.id === rec.variant_id_1);
        return `ماسورة كرتون - طول ${l ? l.length : rec.variant_id_1} cm`;
      }
      case 'liquid': {
        const lt = lookups.liquidTypes.find(x => x.id === rec.variant_id_1);
        return `سائل - ${lt ? lt.name : '—'}`;
      }
      case 'ink': {
        const comp = lookups.companies.find(x => x.id === rec.variant_id_1);
        const col = lookups.colors.find(x => x.id === rec.variant_id_2);
        return `حبر - ${comp ? comp.name : '—'} (${col ? col.name : '—'})`;
      }
      default:
        return 'غير معروف';
    }
  };

  const getRecordUnit = (type) => {
    if (type === 'roll' || type === 'ink') return 'kg';
    if (type === 'pipe') return 'pcs';
    if (type === 'liquid') return 'L';
    return '';
  };

  const getCategoryLabel = (type) => {
    if (type === 'roll') return 'رول';
    if (type === 'pipe') return 'ماسورة';
    if (type === 'liquid') return 'سائل';
    if (type === 'ink') return 'حبر';
    return type;
  };

  // Calculate totals
  const totalRolls = records.filter(r => r.item_type === 'roll').reduce((sum, r) => sum + parseFloat(r.quantity), 0);
  const totalPipes = records.filter(r => r.item_type === 'pipe').reduce((sum, r) => sum + parseFloat(r.quantity), 0);
  const totalLiquids = records.filter(r => r.item_type === 'liquid').reduce((sum, r) => sum + parseFloat(r.quantity), 0);
  const totalInks = records.filter(r => r.item_type === 'ink').reduce((sum, r) => sum + parseFloat(r.quantity), 0);

  return (
    <div className="ready-layout">
      <div className="ready-container">
        <div className="ready-header-bar">
          <h2>قسم التالف والفاقد</h2>
          <button className="btn btn-primary" onClick={handleOpenModal} disabled={loading && records.length === 0}>
            تسجيل تالف +
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}
        {success && <div className="success-banner">{success}</div>}

        {/* Stats Grid */}
        <div className="storage-stats-bar" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="stat-item">
            <span className="stat-label">رولات تالفة</span>
            <span className="stat-value mono">{totalRolls.toFixed(2)}</span>
            <span className="stat-unit">kg</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">مواسير تالفة</span>
            <span className="stat-value mono">{totalPipes}</span>
            <span className="stat-unit">pcs</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">سوائل تالفة</span>
            <span className="stat-value mono">{totalLiquids.toFixed(2)}</span>
            <span className="stat-unit">L</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">أحبار تالفة</span>
            <span className="stat-value mono">{totalInks.toFixed(2)}</span>
            <span className="stat-unit">kg</span>
          </div>
        </div>

        {/* Logs Table */}
        <div className="storage-view-panel">
          <h3>سجل الكميات التالفة والمعدومة</h3>
          {records.length === 0 ? (
            <div className="empty-state">لا يوجد كميات تالفة مسجلة بعد</div>
          ) : (
            <div className="storage-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>النوع</th>
                    <th>المادة / التفاصيل</th>
                    <th>الكمية التالفة</th>
                    <th>بواسطة</th>
                    <th>ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec) => (
                    <tr key={rec.id}>
                      <td><span className="mono">{new Date(rec.created_at).toLocaleDateString('ar-EG')}</span></td>
                      <td><span className="status-badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{getCategoryLabel(rec.item_type)}</span></td>
                      <td><strong>{getRecordDetails(rec)}</strong></td>
                      <td><strong className="mono">{rec.quantity} {getRecordUnit(rec.item_type)}</strong></td>
                      <td><span className="creator-badge">👤 {rec.created_by}</span></td>
                      <td className="notes-cell">{rec.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Form overlay */}
      {showModal && (
        <div className="form-overlay" onClick={() => setShowModal(false)}>
          <div className="form-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h3>تسجيل كمية تالفة جديدة</h3>
            <p style={{ color: 'var(--txt-secondary)', fontSize: '0.85rem', marginBottom: '1.2rem' }}>
              تسجيل التالف سيقوم تلقائياً بخصم القيمة المحددة من مخزن المواد الحالي.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>نوع المادة</label>
                <select value={itemType} onChange={(e) => { setItemType(e.target.value); setRollId(''); setVariant1(''); setVariant2(''); setQuantity(''); }}>
                  <option value="roll">رول بلاستيك</option>
                  <option value="pipe">ماسورة كرتون</option>
                  <option value="liquid">سائل / مذيب</option>
                  <option value="ink">حبر طباعة</option>
                </select>
              </div>

              {/* DYNAMIC FORMS BASED ON CATEGORY */}
              {itemType === 'roll' && (
                <div className="form-group">
                  <label>اختر الرول التالف من المخزن</label>
                  <select value={rollId} onChange={(e) => setRollId(e.target.value)} required>
                    <option value="">-- اختر رول --</option>
                    {lookups.rolls.map(r => (
                      <option key={r.id} value={r.id}>
                        رول #{r.id} | عرض {r.width_label} cm | {r.type_name} | المتاح: {r.weight} kg
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {itemType === 'pipe' && (
                <div className="form-group">
                  <label>طول الماسورة</label>
                  <select value={variant1} onChange={(e) => setVariant1(e.target.value)} required>
                    <option value="">-- اختر الطول --</option>
                    {lookups.lengths.map(l => (
                      <option key={l.id} value={l.length_id || l.id}>
                        {l.length} cm
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {itemType === 'liquid' && (
                <div className="form-group">
                  <label>نوع السائل</label>
                  <select value={variant1} onChange={(e) => setVariant1(e.target.value)} required>
                    <option value="">-- اختر النوع --</option>
                    {lookups.liquidTypes.map(lt => (
                      <option key={lt.id} value={lt.id}>
                        {lt.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {itemType === 'ink' && (
                <>
                  <div className="form-group">
                    <label>الشركة المصنعة</label>
                    <select value={variant1} onChange={(e) => setVariant1(e.target.value)} required>
                      <option value="">-- اختر الشركة --</option>
                      {lookups.companies.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>اللون</label>
                    <select value={variant2} onChange={(e) => setVariant2(e.target.value)} required>
                      <option value="">-- اختر اللون --</option>
                      {lookups.colors.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Dynamic stock indicator */}
              {availableStock !== null && (
                <div style={{ fontSize: '0.85rem', color: '#fbbf24', padding: '0.2rem 0.5rem', background: 'rgba(251, 191, 36, 0.08)', borderRadius: '4px', border: '1px solid rgba(251, 191, 36, 0.15)', textAlign: 'right' }}>
                  📦 الرصيد الحالي المتوفر في المخزن: <strong>{availableStock}</strong>
                </div>
              )}

              <div className="form-group">
                <label>الكمية التالفة ({getRecordUnit(itemType)})</label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder={`الكمية بـ ${getRecordUnit(itemType)}`}
                  required
                />
              </div>

              <div className="form-group">
                <label>ملاحظات وسبب التلف</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: تلف أثناء ضبط التشغيل، انتهاء الصلاحية..."
                  rows="3"
                  style={{ background: '#111', color: '#fff', border: '1px solid #333', padding: '8px', borderRadius: '4px', width: '100%', fontFamily: 'inherit' }}
                />
              </div>

              <div className="modal-actions" style={{ gap: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'جاري الحفظ...' : 'تسجيل التالف'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)} disabled={submitting}>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
