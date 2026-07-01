import { useState, useEffect, useRef } from 'react';
import {
  getPurchaseLists, createPurchaseList, updatePurchaseList,
  deletePurchaseList, confirmPurchaseList,
  getPurchaseOffices,
  getPurchaseListItems, addPurchaseListItem,
  updatePurchaseListItem, deletePurchaseListItem,
  getRollWidths, getRollTypes, getRollThicknesses,
  addRollWidth, addRollType, addRollThickness,
  getPipeLengths, addPipeLength,
  getLiquidTypes, addLiquidType, getLiquidVolumes, addLiquidVolume,
  getInkCompanies, getInkColors, getInkWeights,
  addInkCompany, addInkColor, addInkWeight,
  getGlueTypes, addGlueType, getGlueWeights, addGlueWeight
} from '../../lib/database.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import QuickAddSelector from '../common/QuickAddSelector.jsx';

const ITEM_TYPES = [
  { id: 'roll', label: 'رول' },
  { id: 'pipe', label: 'ماسورة' },
  { id: 'liquid', label: 'سائل' },
  { id: 'ink', label: 'حبر' },
  { id: 'glue', label: 'صمغ' }
];

const STATUS_LABELS = {
  draft: 'قيد الإدخال',
  confirmed: 'مؤكد',
  cancelled: 'ملغي'
};

const STATUS_COLORS = {
  draft: '#f59e0b',
  confirmed: '#10b981',
  cancelled: '#ef4444'
};

/* ===========================================================================
   MAIN PURCHASES COMPONENT – قوائم المشتريات
   =========================================================================== */

export default function Purchases() {
  const { user } = useAuth();
  const [lists, setLists] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // View state: 'list' or 'detail'
  const [view, setView] = useState('list');
  const [selectedListId, setSelectedListId] = useState(null);

  // New list form
  const [showNewForm, setShowNewForm] = useState(false);
  const [newOfficeId, setNewOfficeId] = useState('');
  const [newCompanyNumber, setNewCompanyNumber] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const hasFetched = useRef(false);

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    const [listsRes, officesRes] = await Promise.all([
      getPurchaseLists(),
      getPurchaseOffices()
    ]);
    setLoading(false);
    if (listsRes.error) setError(listsRes.error);
    else setLists(listsRes.data || []);
    if (officesRes.error) setError((prev) => prev || officesRes.error);
    else setOffices(officesRes.data || []);
  };

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchAll();
    }
  }, []);

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newOfficeId) { setError('الرجاء اختيار مكتب الشراء'); return; }
    if (!newCompanyNumber.trim()) { setError('الرجاء إدخال رقم الشركة'); return; }
    setError('');
    setSuccessMsg('');
    const today = new Date().toISOString().slice(0, 10);
    const { data, error: err } = await createPurchaseList(
      parseInt(newOfficeId), newCompanyNumber.trim(), today, newNotes, user?.username || null
    );
    if (err) { setError(err); return; }
    setSuccessMsg('تم إنشاء قائمة المشتريات بنجاح!');
    setShowNewForm(false);
    setNewOfficeId('');
    setNewCompanyNumber('');
    setNewNotes('');
    fetchAll();
    if (data) {
      setSelectedListId(data.id);
      setView('detail');
    }
  };

  const handleConfirm = async (listId) => {
    if (!window.confirm('هل أنت متأكد من تأكيد هذه القائمة؟ سيتم إضافة جميع العناصر إلى المخزن.')) return;
    setError('');
    setSuccessMsg('');
    const { data, error: err } = await confirmPurchaseList(listId);
    if (err) { setError(err); return; }
    setSuccessMsg(data || 'تم تأكيد القائمة وإضافة العناصر إلى المخزن!');
    fetchAll();
  };

  const handleCancel = async (listId) => {
    if (!window.confirm('هل تريد إلغاء هذه القائمة؟')) return;
    setError('');
    setSuccessMsg('');
    const { error: err } = await updatePurchaseList(listId, { status: 'cancelled' });
    if (err) { setError(err); return; }
    setSuccessMsg('تم إلغاء القائمة.');
    fetchAll();
  };

  const handleDelete = async (listId) => {
    if (!window.confirm('حذف هذه القائمة نهائياً؟')) return;
    setError('');
    setSuccessMsg('');
    const { error: err } = await deletePurchaseList(listId);
    if (err) { setError(err); return; }
    setSuccessMsg('تم حذف القائمة.');
    fetchAll();
  };

  const openList = (listId) => {
    setSelectedListId(listId);
    setView('detail');
  };

  const backToList = () => {
    setView('list');
    setSelectedListId(null);
    setError('');
    setSuccessMsg('');
    fetchAll();
  };

  if (loading && lists.length === 0) {
    return <div className="storage-loading"><div className="spinner"></div><p>جاري تحميل قوائم المشتريات...</p></div>;
  }

  if (view === 'detail' && selectedListId) {
    return (
      <PurchaseListDetail
        listId={selectedListId}
        lists={lists}
        offices={offices}
        onBack={backToList}
        onConfirm={handleConfirm}
      />
    );
  }

  return (
    <div className="purchases-dashboard">
      {error && <div className="error-banner">{error}</div>}
      {successMsg && <div className="success-banner">{successMsg}</div>}

      <div className="purchases-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h3>قوائم المشتريات ({lists.length})</h3>
          <button 
            type="button" 
            className="btn btn-outline" 
            onClick={fetchAll} 
            disabled={loading} 
            style={{ padding: '0 0.5rem', minWidth: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}
            title="تحديث البيانات"
          >
            🔄
          </button>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNewForm(!showNewForm)}>
          {showNewForm ? 'إلغاء' : '+ قائمة جديدة'}
        </button>
      </div>

      {/* New List Form */}
      <div style={{
        display: 'grid',
        gridTemplateRows: showNewForm ? '1fr' : '0fr',
        transition: 'grid-template-rows 0.3s ease-out, margin-bottom 0.3s ease-out',
        overflow: 'hidden',
        marginBottom: showNewForm ? '1.5rem' : '0'
      }}>
        <div style={{ minHeight: 0 }}>
          <div className="purchases-new-form">
            <form onSubmit={handleCreateList} className="storage-form">
              <div className="form-row">
                <div className="form-group">
                  <label>مكتب الشراء *</label>
                  <select value={newOfficeId} onChange={(e) => setNewOfficeId(e.target.value)} required>
                    <option value="">-- اختر المكتب --</option>
                    {offices.map((o) => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>رقم الشركة *</label>
                  <input
                    type="text"
                    value={newCompanyNumber}
                    onChange={(e) => setNewCompanyNumber(e.target.value)}
                    placeholder="مثال: INV-2024-001"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>التاريخ</label>
                  <input type="date" value={new Date().toISOString().slice(0, 10)} disabled className="readonly-input" />
                </div>
              </div>
              <div className="form-group">
                <label>ملاحظات</label>
                <input type="text" value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="ملاحظات عامة" />
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.75rem' }}>إنشاء القائمة</button>
            </form>
          </div>
        </div>
      </div>

      {/* Lists Table */}
      {lists.length === 0 ? (
        <div className="empty-state">لا توجد قوائم مشتريات بعد. أنشئ قائمتك الأولى!</div>
      ) : (
        <div className="storage-table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>مكتب الشراء</th>
                <th>رقم الشركة</th>
                <th>التاريخ</th>
                <th>العناصر</th>
                <th>الكمية</th>
                <th>الحالة</th>
                <th>ملاحظات</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lists.map((list) => (
                <tr key={list.id}>
                  <td><span className="mono">#{list.id}</span></td>
                  <td><strong>{list.office_name}</strong></td>
                  <td><span className="mono">{list.company_number || '-'}</span></td>
                  <td>{new Date(list.purchase_date).toLocaleDateString('en-US')}</td>
                  <td>{list.item_count}</td>
                  <td>{list.total_quantity}</td>
                  <td>
                    <span className="status-badge" style={{ backgroundColor: STATUS_COLORS[list.status] }}>
                      {STATUS_LABELS[list.status] || list.status}
                    </span>
                  </td>
                  <td className="notes-cell">{list.notes || '-'}</td>
                  <td>
                    <div className="btn-group">
                      <button className="btn btn-small btn-outline" onClick={() => openList(list.id)}>
                        فتح
                      </button>
                      {list.status === 'draft' && (
                        <>
                          <button className="btn btn-small btn-success" onClick={() => handleConfirm(list.id)}>
                            تأكيد
                          </button>
                          <button className="btn btn-small btn-outline" onClick={() => handleCancel(list.id)}>
                            إلغاء
                          </button>
                        </>
                      )}
                      {list.status !== 'draft' && (
                        <button className="btn btn-small btn-outline" onClick={() => handleDelete(list.id)}>
                          حذف
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ===========================================================================
   PURCHASE LIST DETAIL – عرض/إضافة عناصر لقائمة واحدة
   =========================================================================== */

function PurchaseListDetail({ listId, lists, offices, onBack, onConfirm }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Lookup data for item forms
  const [widths, setWidths] = useState([]);
  const [types, setTypes] = useState([]);
  const [thicknesses, setThicknesses] = useState([]);
  const [pipeLengths, setPipeLengths] = useState([]);
  const [liquidTypes, setLiquidTypes] = useState([]);
  const [liquidVolumes, setLiquidVolumes] = useState([]);
  const [glueTypes, setGlueTypes] = useState([]);
  const [glueWeights, setGlueWeights] = useState([]);
  const [inkCompanies, setInkCompanies] = useState([]);
  const [inkColors, setInkColors] = useState([]);
  const [inkWeights, setInkWeights] = useState([]);

  // Add item form
  const [showAddForm, setShowAddForm] = useState(false);
  const [itemType, setItemType] = useState('roll');
  const [variant1, setVariant1] = useState('');
  const [variant2, setVariant2] = useState('');
  const [qty, setQty] = useState('1');
  const [unit, setUnit] = useState('roll');
  const [weightId, setWeightId] = useState('');
  const [volumeId, setVolumeId] = useState('');
  const [itemNotes, setItemNotes] = useState('');

  const hasFetched = useRef(false);

  const list = lists.find((l) => l.id === listId) || {};
  const isDraft = list.status === 'draft';

  const fetchLookups = async () => {
    const [wRes, tRes, plRes, ltRes, icRes, icoRes, iwRes, thRes, lvRes, gtRes, gwRes] = await Promise.all([
      getRollWidths(), getRollTypes(),
      getPipeLengths(), getLiquidTypes(),
      getInkCompanies(), getInkColors(),
      getInkWeights(),
      getRollThicknesses(),
      getLiquidVolumes(),
      getGlueTypes(),
      getGlueWeights()
    ]);
    if (wRes.data) setWidths(wRes.data);
    if (tRes.data) setTypes(tRes.data);
    if (plRes.data) setPipeLengths(plRes.data);
    if (ltRes.data) setLiquidTypes(ltRes.data);
    if (icRes.data) setInkCompanies(icRes.data);
    if (icoRes.data) setInkColors(icoRes.data);
    if (iwRes.data) setInkWeights(iwRes.data);
    if (thRes.data) setThicknesses(thRes.data);
    if (lvRes.data) setLiquidVolumes(lvRes.data);
    if (gtRes.data) setGlueTypes(gtRes.data);
    if (gwRes.data) setGlueWeights(gwRes.data);
  };

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    const { data, error: err } = await getPurchaseListItems(listId);
    setLoading(false);
    if (err) setError(err);
    else setItems(data || []);
  };

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      Promise.all([fetchItems(), fetchLookups()]);
    }
  }, [listId]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!variant1) { setError('الرجاء اختيار المتغير الأول'); return; }
    if ((itemType === 'roll' || itemType === 'ink') && !variant2) {
      setError(itemType === 'roll' ? 'الرجاء اختيار النوع' : 'الرجاء اختيار اللون');
      return;
    }
    if (itemType === 'roll' && !weightId) { setError('الرجاء اختيار الميكرون (السماكة)'); return; }
    if (itemType === 'ink' && !weightId) { setError('الرجاء اختيار وزن البرميل'); return; }
    if (itemType === 'liquid' && !volumeId) { setError('الرجاء اختيار حجم البرميل'); return; }
    if (itemType === 'glue' && !weightId) { setError('الرجاء اختيار وزن البرميل'); return; }
    
    setError('');
    setSuccessMsg('');

    let finalQty = parseFloat(qty) || 0;
    let finalUnit = '';

    if (itemType === 'roll') {
      finalUnit = 'kg';
    } else if (itemType === 'pipe') {
      finalUnit = 'قطعة';
    } else if (itemType === 'liquid') {
      finalUnit = 'لتر';
      const volObj = liquidVolumes.find(lv => lv.id === parseInt(volumeId));
      if (volObj) {
        finalQty = finalQty * parseFloat(volObj.volume);
      }
    } else if (itemType === 'ink') {
      finalUnit = 'kg';
      const wtObj = inkWeights.find(iw => iw.id === parseInt(weightId));
      if (wtObj) {
        finalQty = finalQty * parseFloat(wtObj.weight);
      }
    } else if (itemType === 'glue') {
      finalUnit = 'kg';
      const wtObj = glueWeights.find(gw => gw.id === parseInt(weightId));
      if (wtObj) {
        finalQty = finalQty * parseFloat(wtObj.weight);
      }
    }

    const { error: err } = await addPurchaseListItem(
      listId, itemType,
      parseInt(variant1),
      variant2 ? parseInt(variant2) : null,
      finalQty,
      finalUnit,
      itemType === 'liquid' ? parseInt(volumeId) : (weightId ? parseInt(weightId) : null),
      itemNotes || null
    );
    if (err) { setError(err); return; }
    setSuccessMsg('تمت إضافة العنصر!');
    setShowAddForm(false);
    setVariant1('');
    setVariant2('');
    setQty('1');
    setUnit('roll');
    setWeightId('');
    setVolumeId('');
    setItemNotes('');
    fetchItems();
  };

  const handleDeleteItem = async (id, label) => {
    if (!window.confirm(`حذف العنصر "${label}"؟`)) return;
    await deletePurchaseListItem(id);
    fetchItems();
  };

  const handleConfirm = async () => {
    if (items.length === 0) { setError('لا توجد عناصر للتأكيد'); return; }
    await onConfirm(listId);
    fetchItems();
  };

  const totalQty = items.reduce((sum, i) => sum + (parseFloat(i.quantity) || 0), 0);

  if (loading && items.length === 0) {
    return <div className="storage-loading"><div className="spinner"></div><p>جاري تحميل العناصر...</p></div>;
  }

  // Get variant labels based on item type
  const getVariant1Label = () => {
    switch (itemType) {
      case 'roll': return 'العرض (سم)';
      case 'pipe': return 'الطول (سم)';
      case 'liquid': return 'نوع السائل';
      case 'ink': return 'الشركة المصنعة';
      case 'glue': return 'نوع الصمغ';
      default: return 'المتغير الأول';
    }
  };

  const getVariant2Label = () => {
    switch (itemType) {
      case 'roll': return 'نوع الرول';
      case 'ink': return 'اللون';
      default: return 'المتغير الثاني';
    }
  };

  const getQuantityLabel = () => {
    switch (itemType) {
      case 'roll': return 'الوزن (kg)';
      case 'ink': return 'عدد البراميل';
      case 'liquid': return 'عدد البراميل';
      case 'glue': return 'عدد البراميل';
      case 'pipe': return 'العدد (قطعة)';
      default: return 'الكمية';
    }
  };

  return (
    <div className="purchases-detail">
      {/* Header */}
      <div className="detail-header">
        <button className="btn btn-outline" onClick={onBack}>
          &larr; العودة للقوائم
        </button>
        <div className="detail-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h3>قائمة #{listId} – {list.office_name}</h3>
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={() => Promise.all([fetchItems(), fetchLookups()])} 
              disabled={loading} 
              style={{ padding: '0 0.5rem', minWidth: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}
              title="تحديث البيانات"
            >
              🔄
            </button>
          </div>
          <span className="detail-date mono">
            {new Date(list.purchase_date).toLocaleDateString('en-US')}
          </span>
          {list.company_number && (
            <span className="mono" style={{ marginLeft: '8px' }}>رقم الشركة: {list.company_number}</span>
          )}
          <span className="status-badge" style={{ backgroundColor: STATUS_COLORS[list.status] }}>
            {STATUS_LABELS[list.status]}
          </span>
        </div>
        {isDraft && (
          <button className="btn btn-success" onClick={handleConfirm}>
            تأكيد وإضافة للمخزن
          </button>
        )}
      </div>

      {list.notes && (
        <div className="detail-notes">
          <strong>ملاحظات:</strong> {list.notes}
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}
      {successMsg && <div className="success-banner">{successMsg}</div>}

      {/* Stats */}
      <div className="storage-stats-bar">
        <div className="stat-item">
          <span className="stat-label">العناصر</span>
          <span className="stat-value">{items.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">إجمالي الكمية</span>
          <span className="stat-value">{totalQty}</span>
        </div>
      </div>

      {/* Add Item Button */}
      {isDraft && (
        <div className="section-header">
          <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? 'إلغاء' : '+ إضافة عنصر'}
          </button>
        </div>
      )}

      {/* Add Item Form – improved readability */}
      {showAddForm && isDraft && (
        <div className="add-item-form">
          <form onSubmit={handleAddItem} className="storage-form item-add-form">
            {/* Item Type Tabs */}
            <div className="form-group">
              <label>نوع العنصر</label>
              <div className="item-type-tabs">
                {ITEM_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`tab ${itemType === t.id ? 'active' : ''}`}
                    onClick={() => { setItemType(t.id); setVariant1(''); setVariant2(''); setWeightId(''); }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Variant Fields – in a clear grid */}
            <div className="item-variants-grid">
              {/* Variant 1 */}
              <div className="form-group">
                <label>{getVariant1Label()}</label>
                {itemType === 'roll' && (
                  <QuickAddSelector
                    value={variant1}
                    onChange={setVariant1}
                    options={widths.map(w => ({ id: w.id, label: `${w.width} cm` }))}
                    placeholder="-- اختر العرض --"
                    label="عرض رول (cm)"
                    isNumeric={true}
                    required={true}
                    onAdd={async (val) => {
                      const { error } = await addRollWidth(val);
                      if (error) throw new Error(error);
                      const list = await getRollWidths();
                      if (list.data) setWidths(list.data);
                      const item = (list.data || []).find(w => parseFloat(w.width) === parseFloat(val));
                      return item ? item.id : null;
                    }}
                  />
                )}
                {itemType === 'pipe' && (
                  <QuickAddSelector
                    value={variant1}
                    onChange={setVariant1}
                    options={pipeLengths.map(pl => ({ id: pl.id, label: `${pl.length} cm` }))}
                    placeholder="-- اختر الطول --"
                    label="طول ماسورة (cm)"
                    isNumeric={true}
                    required={true}
                    onAdd={async (val) => {
                      const { error } = await addPipeLength(val);
                      if (error) throw new Error(error);
                      const list = await getPipeLengths();
                      if (list.data) setPipeLengths(list.data);
                      const item = (list.data || []).find(pl => parseFloat(pl.length) === parseFloat(val));
                      return item ? item.id : null;
                    }}
                  />
                )}
                {itemType === 'liquid' && (
                  <QuickAddSelector
                    value={variant1}
                    onChange={setVariant1}
                    options={liquidTypes.map(lt => ({ id: lt.id, label: lt.name }))}
                    placeholder="-- اختر نوع السائل --"
                    label="نوع سائل"
                    required={true}
                    onAdd={async (val) => {
                      const { error } = await addLiquidType(val);
                      if (error) throw new Error(error);
                      const list = await getLiquidTypes();
                      if (list.data) setLiquidTypes(list.data);
                      const item = (list.data || []).find(lt => lt.name.trim() === val.trim());
                      return item ? item.id : null;
                    }}
                  />
                )}
                {itemType === 'ink' && (
                  <QuickAddSelector
                    value={variant1}
                    onChange={setVariant1}
                    options={inkCompanies.map(ic => ({ id: ic.id, label: ic.name }))}
                    placeholder="-- اختر الشركة --"
                    label="شركة حبر"
                    required={true}
                    onAdd={async (val) => {
                      const { error } = await addInkCompany(val);
                      if (error) throw new Error(error);
                      const list = await getInkCompanies();
                      if (list.data) setInkCompanies(list.data);
                      const item = (list.data || []).find(ic => ic.name.trim() === val.trim());
                      return item ? item.id : null;
                    }}
                  />
                )}
                {itemType === 'glue' && (
                  <QuickAddSelector
                    value={variant1}
                    onChange={setVariant1}
                    options={glueTypes.map(gt => ({ id: gt.id, label: gt.name }))}
                    placeholder="-- اختر نوع الصمغ --"
                    label="نوع الصمغ"
                    required={true}
                    onAdd={async (val) => {
                      const { error } = await addGlueType(val);
                      if (error) throw new Error(error);
                      const list = await getGlueTypes();
                      if (list.data) setGlueTypes(list.data);
                      const item = (list.data || []).find(gt => gt.name.trim() === val.trim());
                      return item ? item.id : null;
                    }}
                  />
                )}
              </div>

              {/* Variant 2 (roll type or ink color) */}
              {itemType === 'roll' && (
                <div className="form-group">
                  <label>{getVariant2Label()}</label>
                  <QuickAddSelector
                    value={variant2}
                    onChange={setVariant2}
                    options={types.map(t => ({ id: t.id, label: t.name }))}
                    placeholder="-- اختر نوع الرول --"
                    label="نوع رول"
                    required={true}
                    onAdd={async (val) => {
                      const { error } = await addRollType(val);
                      if (error) throw new Error(error);
                      const list = await getRollTypes();
                      if (list.data) setTypes(list.data);
                      const item = (list.data || []).find(t => t.name.trim() === val.trim());
                      return item ? item.id : null;
                    }}
                  />
                </div>
              )}

              {itemType === 'ink' && (
                <div className="form-group">
                  <label>{getVariant2Label()}</label>
                  <QuickAddSelector
                    value={variant2}
                    onChange={setVariant2}
                    options={inkColors.map(ico => ({ id: ico.id, label: ico.name }))}
                    placeholder="-- اختر اللون --"
                    label="لون حبر"
                    required={true}
                    onAdd={async (val) => {
                      const { error } = await addInkColor(val);
                      if (error) throw new Error(error);
                      const list = await getInkColors();
                      if (list.data) setInkColors(list.data);
                      const item = (list.data || []).find(ico => ico.name.trim() === val.trim());
                      return item ? item.id : null;
                    }}
                  />
                </div>
              )}

              {/* Roll Thickness Selector */}
              {itemType === 'roll' && (
                <div className="form-group">
                  <label>الميكرون (السماكة)</label>
                  <QuickAddSelector
                    value={weightId}
                    onChange={setWeightId}
                    options={thicknesses.map(t => ({ id: t.id, label: `${t.thickness}` }))}
                    placeholder="-- اختر السمك --"
                    label="سماكة رول"
                    isNumeric={true}
                    required={true}
                    onAdd={async (val) => {
                      const { error } = await addRollThickness(val);
                      if (error) throw new Error(error);
                      const list = await getRollThicknesses();
                      if (list.data) setThicknesses(list.data);
                      const item = (list.data || []).find(t => parseFloat(t.thickness) === parseFloat(val));
                      return item ? item.id : null;
                    }}
                  />
                </div>
              )}

              {/* Quantity */}
              <div className="form-group">
                <label>{getQuantityLabel()}</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={qty}
                  onChange={(e) => setQty(e.target.value.replace(/[^0-9.]/g, ''))}
                  required
                />
              </div>

              {/* Ink barrel weight selector */}
              {itemType === 'ink' && (
                <div className="form-group">
                  <label>وزن البرميل (kg)</label>
                  <QuickAddSelector
                    value={weightId}
                    onChange={setWeightId}
                    options={inkWeights.map(iw => ({ id: iw.id, label: `${iw.weight} kg` }))}
                    placeholder="-- اختر وزن البرميل --"
                    label="وزن برميل حبر (kg)"
                    isNumeric={true}
                    required={true}
                    onAdd={async (val) => {
                      const { error } = await addInkWeight(val);
                      if (error) throw new Error(error);
                      const list = await getInkWeights();
                      if (list.data) setInkWeights(list.data);
                      const item = (list.data || []).find(iw => parseFloat(iw.weight) === parseFloat(val));
                      return item ? item.id : null;
                    }}
                  />
                </div>
              )}

              {/* Liquid barrel volume selector */}
              {itemType === 'liquid' && (
                <div className="form-group">
                  <label>حجم البرميل (L)</label>
                  <QuickAddSelector
                    value={volumeId}
                    onChange={setVolumeId}
                    options={liquidVolumes.map(lv => ({ id: lv.id, label: `${lv.volume} L` }))}
                    placeholder="-- اختر الحجم --"
                    label="حجم برميل سائل (L)"
                    isNumeric={true}
                    required={true}
                    onAdd={async (val) => {
                      const { error } = await addLiquidVolume(val);
                      if (error) throw new Error(error);
                      const list = await getLiquidVolumes();
                      if (list.data) setLiquidVolumes(list.data);
                      const item = (list.data || []).find(lv => parseFloat(lv.volume) === parseFloat(val));
                      return item ? item.id : null;
                    }}
                  />
                </div>
              )}

              {/* Glue barrel weight selector */}
              {itemType === 'glue' && (
                <div className="form-group">
                  <label>وزن البرميل (kg)</label>
                  <QuickAddSelector
                    value={weightId}
                    onChange={setWeightId}
                    options={glueWeights.map(gw => ({ id: gw.id, label: `${gw.weight} kg` }))}
                    placeholder="-- اختر وزن البرميل --"
                    label="وزن برميل صمغ (kg)"
                    isNumeric={true}
                    required={true}
                    onAdd={async (val) => {
                      const { error } = await addGlueWeight(val);
                      if (error) throw new Error(error);
                      const list = await getGlueWeights();
                      if (list.data) setGlueWeights(list.data);
                      const item = (list.data || []).find(gw => parseFloat(gw.weight) === parseFloat(val));
                      return item ? item.id : null;
                    }}
                  />
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="form-group">
              <label>ملاحظات</label>
              <input type="text" value={itemNotes} onChange={(e) => setItemNotes(e.target.value)} placeholder="ملاحظات إضافية" />
            </div>

            <button type="submit" className="btn btn-primary">إضافة العنصر</button>
          </form>
        </div>
      )}

      {/* Items List – improved card-based layout */}
      <div className="storage-view-panel">
        <h4>عناصر القائمة ({items.length})</h4>
        {items.length === 0 ? (
          <div className="empty-state">
            {isDraft ? 'لا توجد عناصر مضافة بعد. استخدم زر "إضافة عنصر" أعلاه.' : 'لا توجد عناصر في هذه القائمة.'}
          </div>
        ) : (
          <div className="items-cards-grid">
            {items.map((item) => {
              const typeInfo = ITEM_TYPES.find((t) => t.id === item.item_type);
              return (
                <div key={item.id} className="item-card">
                  <div className="item-card-header">
                    <span className={`item-type-tag item-type-${item.item_type}`}>
                      {typeInfo?.label || item.item_type}
                    </span>
                    {isDraft && (
                      <button
                        className="btn-delete-roll"
                        onClick={() => handleDeleteItem(item.id, item.item_label || item.description)}
                        title="حذف العنصر"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="item-card-body">
                    <div className="item-card-name">
                      <strong>{item.item_label || item.description}</strong>
                    </div>
                    <div className="item-card-details">
                      <div className="item-detail-row">
                        <span className="detail-label">الكمية:</span>
                        <span className="detail-value mono">{item.quantity} {item.unit}</span>
                      </div>
                      {item.notes && (
                        <div className="item-detail-row">
                          <span className="detail-label">ملاحظات:</span>
                          <span className="detail-value">{item.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
