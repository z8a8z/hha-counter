import { useState, useEffect, useRef } from 'react';
import {
  getWithdrawalRecords, addWithdrawalRecord,
  getRolls, getRollWidths, getRollTypes, getRollThicknesses, deleteRoll,
  getInks, getInkCompanies, getInkColors, getInkWeights, upsertInk,
  getLiquids, getLiquidTypes, getLiquidVolumes, upsertLiquid,
  getGlues, getGlueTypes, getGlueWeights, upsertGlue,
  getPipes, getPipeLengths, upsertPipe
} from '../../lib/database.js';
import { useAuth } from '../../hooks/useAuth.jsx';

export default function Withdraw() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('roll'); // 'roll', 'ink', 'liquid', 'glue', 'pipe'
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Lookups
  const [widths, setWidths] = useState([]);
  const [rollTypes, setRollTypes] = useState([]);
  const [thicknesses, setThicknesses] = useState([]);
  const [pipeLengths, setPipeLengths] = useState([]);
  const [liquidTypes, setLiquidTypes] = useState([]);
  const [liquidVolumes, setLiquidVolumes] = useState([]);
  const [glueTypes, setGlueTypes] = useState([]);
  const [glueWeights, setGlueWeights] = useState([]);
  const [inkCompanies, setInkCompanies] = useState([]);
  const [inkColors, setInkColors] = useState([]);
  const [inkWeights, setInkWeights] = useState([]);

  // Stocks
  const [rollsList, setRollsList] = useState([]);
  const [inksList, setInksList] = useState([]);
  const [liquidsList, setLiquidsList] = useState([]);
  const [gluesList, setGluesList] = useState([]);
  const [pipesList, setPipesList] = useState([]);

  // Form states
  const [wRollType, setWRollType] = useState('');
  const [wRollThickness, setWRollThickness] = useState('');
  const [wRollWidth, setWRollWidth] = useState('');
  const [wSelectedRollId, setWSelectedRollId] = useState('');

  const [wInkCompany, setWInkCompany] = useState('');
  const [wInkColor, setWInkColor] = useState('');
  const [wInkBarrelCount, setWInkBarrelCount] = useState('1');
  const [wInkWeightId, setWInkWeightId] = useState('');

  const [wLiquidType, setWLiquidType] = useState('');
  const [wLiquidBarrelCount, setWLiquidBarrelCount] = useState('1');
  const [wLiquidVolumeId, setWLiquidVolumeId] = useState('');

  const [wGlueType, setWGlueType] = useState('');
  const [wGlueBarrelCount, setWGlueBarrelCount] = useState('1');
  const [wGlueWeightId, setWGlueWeightId] = useState('');

  const [wPipeLengthId, setWPipeLengthId] = useState('');
  const [wPipeCount, setWPipeCount] = useState('1');

  const [notes, setNotes] = useState('');

  const hasFetched = useRef(false);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    const [
      wRes, rtRes, thRes, plRes, ltRes, lvRes, gtRes, gwRes, icRes, icoRes, iwRes,
      rStock, iStock, lStock, gStock, pStock, histRes
    ] = await Promise.all([
      getRollWidths(), getRollTypes(), getRollThicknesses(),
      getPipeLengths(), getLiquidTypes(), getLiquidVolumes(),
      getGlueTypes(), getGlueWeights(),
      getInkCompanies(), getInkColors(), getInkWeights(),
      getRolls(), getInks(), getLiquids(), getGlues(), getPipes(),
      getWithdrawalRecords()
    ]);

    setLoading(false);

    if (wRes.data) setWidths(wRes.data);
    if (rtRes.data) setRollTypes(rtRes.data);
    if (thRes.data) setThicknesses(thRes.data);
    if (plRes.data) setPipeLengths(plRes.data);
    if (ltRes.data) setLiquidTypes(ltRes.data);
    if (lvRes.data) setLiquidVolumes(lvRes.data);
    if (gtRes.data) setGlueTypes(gtRes.data);
    if (gwRes.data) setGlueWeights(gwRes.data);
    if (icRes.data) setInkCompanies(icRes.data);
    if (icoRes.data) setInkColors(icoRes.data);
    if (iwRes.data) setInkWeights(iwRes.data);

    if (rStock.data) setRollsList(rStock.data);
    if (iStock.data) setInksList(iStock.data);
    if (lStock.data) setLiquidsList(lStock.data);
    if (gStock.data) setGluesList(gStock.data);
    if (pStock.data) setPipesList(pStock.data);

    if (histRes.data) setHistory(histRes.data);
  };

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchData();
    }
  }, []);

  // Filter rolls matching selected criteria
  const availableRolls = rollsList.filter(r => 
    (!wRollType || r.type_id === parseInt(wRollType)) &&
    (!wRollThickness || r.thickness_id === parseInt(wRollThickness)) &&
    (!wRollWidth || r.width_id === parseInt(wRollWidth))
  );

  // Available stock calculations
  const getSelectedInkStock = () => {
    if (!wInkCompany || !wInkColor) return 0;
    const item = inksList.find(i => i.company_id === parseInt(wInkCompany) && i.color_id === parseInt(wInkColor));
    return item ? parseFloat(item.quantity) : 0;
  };

  const getSelectedLiquidStock = () => {
    if (!wLiquidType) return 0;
    const item = liquidsList.find(l => l.type_id === parseInt(wLiquidType));
    return item ? parseFloat(item.quantity) : 0;
  };

  const getSelectedGlueStock = () => {
    if (!wGlueType) return 0;
    const item = gluesList.find(g => g.type_id === parseInt(wGlueType));
    return item ? parseFloat(item.quantity) : 0;
  };

  const getSelectedPipeStock = () => {
    if (!wPipeLengthId) return 0;
    const item = pipesList.find(p => p.length_id === parseInt(wPipeLengthId));
    return item ? parseInt(item.quantity) : 0;
  };

  const handleWithdrawRoll = async (e) => {
    e.preventDefault();
    if (!wSelectedRollId) { setError('الرجاء اختيار الرول المطلوب'); return; }
    const rollObj = rollsList.find(r => r.id === parseInt(wSelectedRollId));
    if (!rollObj) { setError('الرول المحدد غير موجود في المخزن'); return; }

    setSubmitting(true);
    setError('');
    setSuccess('');

    // 1. Delete roll
    const { error: delErr } = await deleteRoll(rollObj.id);
    if (delErr) {
      setError(`فشل حذف الرول: ${delErr}`);
      setSubmitting(false);
      return;
    }

    // 2. Add withdrawal record
    const { error: recErr } = await addWithdrawalRecord({
      item_type: 'roll',
      roll_id: rollObj.id,
      variant_id_1: rollObj.width_id,
      variant_id_2: rollObj.thickness_id,
      variant_id_3: rollObj.type_id,
      quantity: rollObj.weight,
      notes: notes || rollObj.notes || 'سحب إنتاج',
      created_by: user?.email || 'موظف المخزن'
    });

    setSubmitting(false);
    if (recErr) {
      setError(`فشل تسجيل السحب: ${recErr}`);
    } else {
      setSuccess('تم سحب الرول بنجاح وتوثيق العملية في السجل.');
      setWSelectedRollId('');
      setNotes('');
      fetchData();
    }
  };

  const handleWithdrawInk = async (e) => {
    e.preventDefault();
    if (!wInkCompany || !wInkColor || !wInkWeightId) { setError('الرجاء تعبئة كافة الحقول'); return; }
    const wtObj = inkWeights.find(w => w.id === parseInt(wInkWeightId));
    if (!wtObj) return;

    const withdrawQty = parseFloat(wInkBarrelCount) * parseFloat(wtObj.weight);
    const available = getSelectedInkStock();
    if (withdrawQty > available) {
      setError(`الكمية المطلوبة (${withdrawQty} kg) أكبر من المتوفر (${available} kg)`);
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    // Update stock
    const newQty = available - withdrawQty;
    const { error: upsertErr } = await upsertInk(parseInt(wInkCompany), parseInt(wInkColor), newQty, null);
    if (upsertErr) {
      setError(`فشل تعديل المخزون: ${upsertErr}`);
      setSubmitting(false);
      return;
    }

    // Log withdrawal
    const { error: recErr } = await addWithdrawalRecord({
      item_type: 'ink',
      variant_id_1: parseInt(wInkCompany),
      variant_id_2: parseInt(wInkColor),
      quantity: withdrawQty,
      notes: notes || `سحب ${wInkBarrelCount} براميل سعة ${wtObj.weight} kg`,
      created_by: user?.email || 'موظف المخزن'
    });

    setSubmitting(false);
    if (recErr) {
      setError(`فشل تسجيل السحب: ${recErr}`);
    } else {
      setSuccess('تم سحب الحبر بنجاح وتحديث المخزون.');
      setNotes('');
      setWInkBarrelCount('1');
      fetchData();
    }
  };

  const handleWithdrawLiquid = async (e) => {
    e.preventDefault();
    if (!wLiquidType || !wLiquidVolumeId) { setError('الرجاء تعبئة كافة الحقول'); return; }
    const volObj = liquidVolumes.find(v => v.id === parseInt(wLiquidVolumeId));
    if (!volObj) return;

    const withdrawQty = parseFloat(wLiquidBarrelCount) * parseFloat(volObj.volume);
    const available = getSelectedLiquidStock();
    if (withdrawQty > available) {
      setError(`الكمية المطلوبة (${withdrawQty} L) أكبر من المتوفر (${available} L)`);
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    // Update stock
    const newQty = available - withdrawQty;
    const { error: upsertErr } = await upsertLiquid(parseInt(wLiquidType), newQty, null);
    if (upsertErr) {
      setError(`فشل تعديل المخزون: ${upsertErr}`);
      setSubmitting(false);
      return;
    }

    // Log withdrawal
    const { error: recErr } = await addWithdrawalRecord({
      item_type: 'liquid',
      variant_id_1: parseInt(wLiquidType),
      quantity: withdrawQty,
      notes: notes || `سحب ${wLiquidBarrelCount} براميل سعة ${volObj.volume} L`,
      created_by: user?.email || 'موظف المخزن'
    });

    setSubmitting(false);
    if (recErr) {
      setError(`فشل تسجيل السحب: ${recErr}`);
    } else {
      setSuccess('تم سحب السائل بنجاح وتحديث المخزون.');
      setNotes('');
      setWLiquidBarrelCount('1');
      fetchData();
    }
  };

  const handleWithdrawGlue = async (e) => {
    e.preventDefault();
    if (!wGlueType || !wGlueWeightId) { setError('الرجاء تعبئة كافة الحقول'); return; }
    const wtObj = glueWeights.find(w => w.id === parseInt(wGlueWeightId));
    if (!wtObj) return;

    const withdrawQty = parseFloat(wGlueBarrelCount) * parseFloat(wtObj.weight);
    const available = getSelectedGlueStock();
    if (withdrawQty > available) {
      setError(`الكمية المطلوبة (${withdrawQty} kg) أكبر من المتوفر (${available} kg)`);
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    // Update stock
    const newQty = available - withdrawQty;
    const { error: upsertErr } = await upsertGlue(parseInt(wGlueType), newQty, null);
    if (upsertErr) {
      setError(`فشل تعديل المخزون: ${upsertErr}`);
      setSubmitting(false);
      return;
    }

    // Log withdrawal
    const { error: recErr } = await addWithdrawalRecord({
      item_type: 'glue',
      variant_id_1: parseInt(wGlueType),
      quantity: withdrawQty,
      notes: notes || `سحب ${wGlueBarrelCount} براميل سعة ${wtObj.weight} kg`,
      created_by: user?.email || 'موظف المخزن'
    });

    setSubmitting(false);
    if (recErr) {
      setError(`فشل تسجيل السحب: ${recErr}`);
    } else {
      setSuccess('تم سحب الصمغ بنجاح وتحديث المخزون.');
      setNotes('');
      setWGlueBarrelCount('1');
      fetchData();
    }
  };

  const handleWithdrawPipe = async (e) => {
    e.preventDefault();
    if (!wPipeLengthId || !wPipeCount) { setError('الرجاء تعبئة كافة الحقول'); return; }

    const withdrawQty = parseInt(wPipeCount);
    const available = getSelectedPipeStock();
    if (withdrawQty > available) {
      setError(`العدد المطلوب (${withdrawQty}) أكبر من المتوفر (${available})`);
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    // Update stock
    const newQty = available - withdrawQty;
    const { error: upsertErr } = await upsertPipe(parseInt(wPipeLengthId), newQty, null);
    if (upsertErr) {
      setError(`فشل تعديل المخزون: ${upsertErr}`);
      setSubmitting(false);
      return;
    }

    // Log withdrawal
    const { error: recErr } = await addWithdrawalRecord({
      item_type: 'pipe',
      variant_id_1: parseInt(wPipeLengthId),
      quantity: withdrawQty,
      notes: notes || `سحب عدد ${wPipeCount} مواسير`,
      created_by: user?.email || 'موظف المخزن'
    });

    setSubmitting(false);
    if (recErr) {
      setError(`فشل تسجيل السحب: ${recErr}`);
    } else {
      setSuccess('تم سحب المواسير بنجاح وتحديث المخزون.');
      setNotes('');
      setWPipeCount('1');
      fetchData();
    }
  };

  // Helper Maps for display logs
  const widthMap = Object.fromEntries(widths.map(w => [w.id, w.width]));
  const typeMap = Object.fromEntries(rollTypes.map(t => [t.id, t.name]));
  const thickMap = Object.fromEntries(thicknesses.map(t => [t.id, t.thickness]));
  const lengthMap = Object.fromEntries(pipeLengths.map(l => [l.id, l.length]));
  const liquidTypeMap = Object.fromEntries(liquidTypes.map(t => [t.id, t.name]));
  const glueTypeMap = Object.fromEntries(glueTypes.map(t => [t.id, t.name]));
  const inkCompanyMap = Object.fromEntries(inkCompanies.map(c => [c.id, c.name]));
  const inkColorMap = Object.fromEntries(inkColors.map(c => [c.id, c.name]));

  const formatRecordDetails = (r) => {
    switch (r.item_type) {
      case 'roll': {
        const type = typeMap[r.variant_id_3] || '';
        const thick = thickMap[r.variant_id_2] || '';
        const width = widthMap[r.variant_id_1] || '';
        return `رول خام (${type} ${thick} ${width}) [رقم: ${r.roll_id || '-'}]`;
      }
      case 'ink': {
        const comp = inkCompanyMap[r.variant_id_1] || '';
        const col = inkColorMap[r.variant_id_2] || '';
        return `حبر (${comp} - ${col})`;
      }
      case 'liquid':
        return `سائل (${liquidTypeMap[r.variant_id_1] || ''})`;
      case 'glue':
        return `صمغ (${glueTypeMap[r.variant_id_1] || ''})`;
      case 'pipe':
        return `مواسير (${lengthMap[r.variant_id_1] || ''} cm)`;
      default:
        return r.item_type;
    }
  };

  const getUnitLabel = (type) => {
    if (type === 'pipe') return 'قطعة';
    if (type === 'liquid') return 'L';
    return 'kg';
  };

  const getTypeNameLabel = (type) => {
    switch (type) {
      case 'roll': return 'رول خام';
      case 'ink': return 'أحبار';
      case 'liquid': return 'سوائل';
      case 'glue': return 'صمغ';
      case 'pipe': return 'مواسير';
      default: return type;
    }
  };

  if (loading) {
    return <div className="storage-loading"><div className="spinner"></div><p>جاري تحميل البيانات...</p></div>;
  }

  return (
    <div className="storage-container">
      <div className="storage-mode-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>📤 سحب المواد للإنتاج (Withdrawal)</h2>
        <button 
          type="button" 
          className="btn btn-outline" 
          onClick={fetchData} 
          disabled={loading} 
          style={{ padding: '0 0.5rem', minWidth: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}
          title="تحديث البيانات"
        >
          🔄
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      <div className="storage-manage-panel">
        <div className="storage-tabs-header" style={{ marginBottom: '1.5rem' }}>
          <button className={`tab ${activeTab === 'roll' ? 'active' : ''}`} onClick={() => { setActiveTab('roll'); setError(''); setSuccess(''); }}>رول خام</button>
          <button className={`tab ${activeTab === 'ink' ? 'active' : ''}`} onClick={() => { setActiveTab('ink'); setError(''); setSuccess(''); }}>أحبار</button>
          <button className={`tab ${activeTab === 'liquid' ? 'active' : ''}`} onClick={() => { setActiveTab('liquid'); setError(''); setSuccess(''); }}>سوائل</button>
          <button className={`tab ${activeTab === 'glue' ? 'active' : ''}`} onClick={() => { setActiveTab('glue'); setError(''); setSuccess(''); }}>صمغ</button>
          <button className={`tab ${activeTab === 'pipe' ? 'active' : ''}`} onClick={() => { setActiveTab('pipe'); setError(''); setSuccess(''); }}>مواسير</button>
        </div>

        <div className="storage-layout" style={{ gap: '1.5rem' }}>
          {/* Form Side */}
          <div className="storage-sidebar" style={{ flex: '1', minWidth: '320px' }}>
            <div className="sidebar-card" style={{ padding: '1.25rem' }}>
              <h4 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                تسجيل سحب {getTypeNameLabel(activeTab)}
              </h4>

              {/* ROLLS FORM */}
              {activeTab === 'roll' && (
                <form onSubmit={handleWithdrawRoll} className="storage-form">
                  <div className="form-group">
                    <label>عرض الرول (cm)</label>
                    <select value={wRollWidth} onChange={(e) => { setWRollWidth(e.target.value); setWSelectedRollId(''); }}>
                      <option value="">-- الكل --</option>
                      {widths.map(w => <option key={w.id} value={w.id}>{w.width} cm</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>السماكة (ميكرون)</label>
                    <select value={wRollThickness} onChange={(e) => { setWRollThickness(e.target.value); setWSelectedRollId(''); }}>
                      <option value="">-- الكل --</option>
                      {thicknesses.map(t => <option key={t.id} value={t.id}>{t.thickness} mic</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>نوع الرول</label>
                    <select value={wRollType} onChange={(e) => { setWRollType(e.target.value); setWSelectedRollId(''); }}>
                      <option value="">-- الكل --</option>
                      {rollTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>الرولات المتوفرة في المخزن ({availableRolls.length})</label>
                    <select value={wSelectedRollId} onChange={(e) => setWSelectedRollId(e.target.value)} required>
                      <option value="">-- اختر الرول للسحب --</option>
                      {availableRolls.map(r => (
                        <option key={r.id} value={r.id}>
                          رول ID: {r.id} | عرض: {r.width_label} | سمك: {r.thickness_label} | نوع: {r.type_name} | وزن: {r.weight} kg
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>ملاحظات السحب</label>
                    <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="رقم الماكنة، اسم العملية، إلخ..." />
                  </div>
                  <button type="submit" className="btn btn-primary btn-block" disabled={submitting || !wSelectedRollId}>
                    {submitting ? 'جاري السحب...' : 'سحب الرول وتأكيد الاستهلاك'}
                  </button>
                </form>
              )}

              {/* INKS FORM */}
              {activeTab === 'ink' && (
                <form onSubmit={handleWithdrawInk} className="storage-form">
                  <div className="form-group">
                    <label>الشركة المصنعة</label>
                    <select value={wInkCompany} onChange={(e) => setWInkCompany(e.target.value)} required>
                      <option value="">-- اختر الشركة --</option>
                      {inkCompanies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>اللون</label>
                    <select value={wInkColor} onChange={(e) => setWInkColor(e.target.value)} required>
                      <option value="">-- اختر اللون --</option>
                      {inkColors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  {wInkCompany && wInkColor && (
                    <div className="form-group" style={{ background: 'var(--bg-card-header)', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>المخزون المتاح حالياً:</span>
                      <strong style={{ display: 'block', fontSize: '1.2rem', color: 'var(--primary)' }} className="mono">
                        {getSelectedInkStock()} kg
                      </strong>
                    </div>
                  )}

                  <div className="form-group">
                    <label>عدد البراميل المسحوبة</label>
                    <input type="text" inputMode="numeric" value={wInkBarrelCount} onChange={(e) => setWInkBarrelCount(e.target.value.replace(/[^0-9]/g, ''))} required />
                  </div>
                  <div className="form-group">
                    <label>وزن البرميل الواحد</label>
                    <select value={wInkWeightId} onChange={(e) => setWInkWeightId(e.target.value)} required>
                      <option value="">-- اختر وزن البرميل --</option>
                      {inkWeights.map(w => <option key={w.id} value={w.id}>{w.weight} kg</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>ملاحظات السحب</label>
                    <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="ملاحظات اختيارية" />
                  </div>
                  <button type="submit" className="btn btn-primary btn-block" disabled={submitting || !wInkCompany || !wInkColor || !wInkWeightId}>
                    {submitting ? 'جاري السحب...' : 'تأكيد سحب كمية الحبر'}
                  </button>
                </form>
              )}

              {/* LIQUIDS FORM */}
              {activeTab === 'liquid' && (
                <form onSubmit={handleWithdrawLiquid} className="storage-form">
                  <div className="form-group">
                    <label>نوع السائل</label>
                    <select value={wLiquidType} onChange={(e) => setWLiquidType(e.target.value)} required>
                      <option value="">-- اختر نوع السائل --</option>
                      {liquidTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>

                  {wLiquidType && (
                    <div className="form-group" style={{ background: 'var(--bg-card-header)', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>المخزون المتاح حالياً:</span>
                      <strong style={{ display: 'block', fontSize: '1.2rem', color: 'var(--primary)' }} className="mono">
                        {getSelectedLiquidStock()} L
                      </strong>
                    </div>
                  )}

                  <div className="form-group">
                    <label>عدد البراميل المسحوبة</label>
                    <input type="text" inputMode="numeric" value={wLiquidBarrelCount} onChange={(e) => setWLiquidBarrelCount(e.target.value.replace(/[^0-9]/g, ''))} required />
                  </div>
                  <div className="form-group">
                    <label>حجم البرميل الواحد (L)</label>
                    <select value={wLiquidVolumeId} onChange={(e) => setWLiquidVolumeId(e.target.value)} required>
                      <option value="">-- اختر سعة البرميل --</option>
                      {liquidVolumes.map(v => <option key={v.id} value={v.id}>{v.volume} L</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>ملاحظات السحب</label>
                    <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="ملاحظات اختيارية" />
                  </div>
                  <button type="submit" className="btn btn-primary btn-block" disabled={submitting || !wLiquidType || !wLiquidVolumeId}>
                    {submitting ? 'جاري السحب...' : 'تأكيد سحب كمية السائل'}
                  </button>
                </form>
              )}

              {/* GLUES FORM */}
              {activeTab === 'glue' && (
                <form onSubmit={handleWithdrawGlue} className="storage-form">
                  <div className="form-group">
                    <label>نوع الصمغ</label>
                    <select value={wGlueType} onChange={(e) => setWGlueType(e.target.value)} required>
                      <option value="">-- اختر نوع الصمغ --</option>
                      {glueTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>

                  {wGlueType && (
                    <div className="form-group" style={{ background: 'var(--bg-card-header)', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>المخزون المتاح حالياً:</span>
                      <strong style={{ display: 'block', fontSize: '1.2rem', color: 'var(--primary)' }} className="mono">
                        {getSelectedGlueStock()} kg
                      </strong>
                    </div>
                  )}

                  <div className="form-group">
                    <label>عدد البراميل المسحوبة</label>
                    <input type="text" inputMode="numeric" value={wGlueBarrelCount} onChange={(e) => setWGlueBarrelCount(e.target.value.replace(/[^0-9]/g, ''))} required />
                  </div>
                  <div className="form-group">
                    <label>وزن البرميل الواحد (kg)</label>
                    <select value={wGlueWeightId} onChange={(e) => setWGlueWeightId(e.target.value)} required>
                      <option value="">-- اختر وزن البرميل --</option>
                      {glueWeights.map(w => <option key={w.id} value={w.id}>{w.weight} kg</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>ملاحظات السحب</label>
                    <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="ملاحظات اختيارية" />
                  </div>
                  <button type="submit" className="btn btn-primary btn-block" disabled={submitting || !wGlueType || !wGlueWeightId}>
                    {submitting ? 'جاري السحب...' : 'تأكيد سحب كمية الصمغ'}
                  </button>
                </form>
              )}

              {/* PIPES FORM */}
              {activeTab === 'pipe' && (
                <form onSubmit={handleWithdrawPipe} className="storage-form">
                  <div className="form-group">
                    <label>طول الماسورة</label>
                    <select value={wPipeLengthId} onChange={(e) => setWPipeLengthId(e.target.value)} required>
                      <option value="">-- اختر طول الماسورة --</option>
                      {pipeLengths.map(l => <option key={l.id} value={l.id}>{l.length} cm</option>)}
                    </select>
                  </div>

                  {wPipeLengthId && (
                    <div className="form-group" style={{ background: 'var(--bg-card-header)', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>المخزون المتاح حالياً:</span>
                      <strong style={{ display: 'block', fontSize: '1.2rem', color: 'var(--primary)' }} className="mono">
                        {getSelectedPipeStock()} قطعة
                      </strong>
                    </div>
                  )}

                  <div className="form-group">
                    <label>الكمية المسحوبة (بالقطعة)</label>
                    <input type="text" inputMode="numeric" value={wPipeCount} onChange={(e) => setWPipeCount(e.target.value.replace(/[^0-9]/g, ''))} required />
                  </div>
                  <div className="form-group">
                    <label>ملاحظات السحب</label>
                    <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="ملاحظات اختيارية" />
                  </div>
                  <button type="submit" className="btn btn-primary btn-block" disabled={submitting || !wPipeLengthId}>
                    {submitting ? 'جاري السحب...' : 'تأكيد سحب المواسير'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* History List Side */}
          <div className="storage-list-panel" style={{ flex: '2', minWidth: '400px' }}>
            <h3>سجل سحب واستهلاك المواد ({history.length})</h3>
            {history.length === 0 ? (
              <div className="empty-state">لا توجد سجلات سحب مخزنة حالياً</div>
            ) : (
              <div className="storage-table-wrap">
                <table style={{ fontSize: '0.9rem' }}>
                  <thead>
                    <tr>
                      <th>الوقت / التاريخ</th>
                      <th>المادة</th>
                      <th>التفاصيل والمقاسات</th>
                      <th>الكمية</th>
                      <th>الساحب</th>
                      <th>ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((rec) => (
                      <tr key={rec.id}>
                        <td style={{ whiteSpace: 'nowrap' }} className="mono text-muted">
                          {new Date(rec.created_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td>
                          <span className={`item-type-tag item-type-${rec.item_type}`}>
                            {getTypeNameLabel(rec.item_type)}
                          </span>
                        </td>
                        <td><strong>{formatRecordDetails(rec)}</strong></td>
                        <td><span className="mono bold">{rec.quantity}</span> {getUnitLabel(rec.item_type)}</td>
                        <td><span className="text-muted" style={{ fontSize: '0.85rem' }}>{rec.created_by?.split('@')[0]}</span></td>
                        <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rec.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
