import { useState, useEffect, useRef, useCallback } from 'react';
import { getReadyOrders, createReadyOrder, saveReadyOrder, deleteReadyOrder, markReadyOrder, getOrders, getPrintSettings } from '../../lib/database.js';
import { debug } from '../../lib/debug.js';
import { usePrint } from '../../hooks/usePrint.js';
import { PrintTemplates } from '../common/PrintTemplates.js';

const MODULE = 'ReadyOrders';

const STATUS_LABELS = {
  preparing: 'قيد التجهيز',
  ready: 'تجهيز مكتمل'
};

/* ─── Numeric Keypad layout ──────────────────────────────── */
const KEYPAD_ROWS = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  ['.', '0', '⌫'],
];

/* ─── NumericKeyboard component ──────────────────────────── */
function NumericKeyboard({ onKey }) {
  return (
    <div className="numeric-keyboard">
      {KEYPAD_ROWS.map((row, rIdx) => (
        <div key={rIdx} className="keyboard-row">
          {row.map((key) => {
            let extraClass = '';
            if (key === '⌫') extraClass = 'key-backspace';
            return (
              <button
                key={key}
                className={`keyboard-key ${extraClass}`}
                onMouseDown={(e) => {
                  // prevent blur on the active input
                  e.preventDefault();
                  onKey(key);
                }}
              >
                {key}
              </button>
            );
          })}
        </div>
      ))}
      {/* Clear row */}
      <div className="keyboard-row">
        <button
          className="keyboard-key key-clear"
          onMouseDown={(e) => { e.preventDefault(); onKey('CLEAR'); }}
        >
          مسح
        </button>
      </div>
    </div>
  );
}

/* ─── KeyboardSidebar component ──────────────────────────── */
function KeyboardSidebar({ activeField, onKey, onSave, saveDisabled }) {
  const [keyboardOn, setKeyboardOn] = useState(true);

  return (
    <aside className="keyboard-sidebar">
      <div className="numeric-keyboard-wrapper">
        {/* Toggle row */}
        <div className="keyboard-toggle-row">
          <span className="keyboard-toggle-label">لوحة الأرقام</span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={keyboardOn}
              onChange={(e) => setKeyboardOn(e.target.checked)}
            />
            <span className="toggle-slider" />
          </label>
        </div>

        {/* Active-field indicator */}
        <div className="keyboard-active-indicator">
          {keyboardOn
            ? (activeField ? `◉ ${activeField.label}` : 'انقر على حقل لتفعيله')
            : null}
        </div>

        {/* Keyboard grid */}
        {keyboardOn && <NumericKeyboard onKey={onKey} />}

        {/* Save shortcut */}
        {keyboardOn && (
          <div className="keyboard-row" style={{ marginTop: '0.5rem' }}>
            <button
              className="keyboard-key key-save"
              onMouseDown={(e) => { e.preventDefault(); onSave(); }}
              disabled={saveDisabled}
            >
              تأكيد + رول جديد
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

/* ─── Main Component ─────────────────────────────────────── */
export default function ReadyOrders() {
  const [orders, setOrders] = useState([]);
  const { printHtml } = usePrint();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handlePrint = async (order, e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    
    let targetOrder;
    if (order) {
      targetOrder = order;
    } else if (editingOrder) {
      // Build from current editor state so unsaved inputs are printed!
      targetOrder = {
        ...editingOrder,
        name: orderName,
        pipe_length: parseFloat(pipeLength) || 0,
        pipe_weight: parseFloat(pipeWeight) || 0,
        ready_order_rolls: rolls
          .map(r => ({
            id: r.id,
            weight: parseFloat(r.weight) || 0
          }))
          .filter(r => r.weight > 0)
      };
    }
    
    if (!targetOrder) return;
    
    setLoading(true);
    const { data: settings } = await getPrintSettings();
    setLoading(false);
    
    const html = PrintTemplates.preparationCard(targetOrder, settings || {});
    printHtml(html);
  };

  // Editing state
  const [editingOrder, setEditingOrder] = useState(null);
  const [orderName, setOrderName] = useState('');
  const [pipeLength, setPipeLength] = useState('');
  const [pipeWeight, setPipeWeight] = useState('');
  const [rolls, setRolls] = useState([]);    // Array of { id, weight }

  // Keyboard / focus state
  // activeField: { type: 'roll'|'pipe-length'|'pipe-weight'|'order-name', id?: string, label: string }
  const [activeField, setActiveField] = useState(null);

  // Ready order link state
  const [availableOrders, setAvailableOrders] = useState([]);
  const [showSelectOrderModal, setShowSelectOrderModal] = useState(false);

  // Refs for roll inputs: map from roll.id → HTMLInputElement
  const rollInputRefs = useRef({});
  const pipeLengthRef = useRef(null);
  const pipeWeightRef = useRef(null);
  const orderNameRef = useRef(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    const { data, error: fetchErr } = await getReadyOrders();
    setLoading(false);
    if (fetchErr) {
      setError('حدث خطأ أثناء تحميل الطلبيات: ' + fetchErr);
    } else {
      setOrders(data || []);
    }
  };

  const handleOpenPrepareOrder = async () => {
    setError('');
    setLoading(true);
    const { data, error: fetchErr } = await getOrders();
    setLoading(false);
    if (fetchErr) {
      setError('حدث خطأ أثناء تحميل الطلبيات المتاحة: ' + fetchErr);
    } else {
      const pending = (data || []).filter(o => o.status === 'pending');
      setAvailableOrders(pending);
      setShowSelectOrderModal(true);
    }
  };

  const handleConfirmPrepareOrder = async (selectedOrder) => {
    setShowSelectOrderModal(false);
    setError('');
    setLoading(true);
    const name = `تجهيز طلبية: ${selectedOrder.customer_name}`;
    const { data, error: createErr } = await createReadyOrder(name, selectedOrder.id);
    setLoading(false);

    if (createErr) {
      setError('فشل في إنشاء طلبية جديدة: ' + createErr);
    } else if (data) {
      const { data: refreshedData } = await getReadyOrders();
      if (refreshedData) {
        const found = refreshedData.find(o => o.id === data.id);
        if (found) {
          startEditing(found);
        } else {
          startEditing(data);
        }
      } else {
        startEditing(data);
      }
    }
  };

  const handleDeleteOrder = async (id, name, e) => {
    e.stopPropagation();
    if (!window.confirm(`هل أنت متأكد من حذف الطلبية "${name}"؟`)) {
      return;
    }

    setError('');
    setLoading(true);
    const { error: deleteErr } = await deleteReadyOrder(id);
    if (deleteErr) {
      setError('فشل في حذف الطلبية: ' + deleteErr);
      setLoading(false);
    } else {
      fetchOrders();
    }
  };

  const startEditing = (order) => {
    setEditingOrder(order);
    setOrderName(order.name);
    // Clean state: default to empty string, not '0'
    setPipeLength(order.pipe_length?.toString() || '');
    setPipeWeight(order.pipe_weight?.toString() || '');

    if (order.ready_order_rolls) {
      setRolls(order.ready_order_rolls.map((r, index) => ({
        id: r.id || `${Date.now()}-${index}-${Math.random()}`,
        weight: r.weight?.toString() || ''
      })));
    } else {
      setRolls([]);
    }
    setError('');
    setSuccessMsg('');
    // Auto-focus the order name field when entering edit mode
    setActiveField({ type: 'order-name', label: 'اسم الطلبية' });
    setTimeout(() => orderNameRef.current?.focus(), 80);
  };

  /* ─── Roll Management ────────────────────────────────────── */
  const handleAddRoll = useCallback(() => {
    const newId = `${Date.now()}-${Math.random()}`;
    // Prepend: insert at top of list
    setRolls(prev => {
      const newRolls = [{ id: newId, weight: '' }, ...prev];
      // New roll is at index 0, its number = newRolls.length
      const newNumber = newRolls.length;
      setActiveField({ type: 'roll', id: newId, label: `رول ${newNumber}` });
      return newRolls;
    });

    // Wait one tick for the DOM to mount the new input then focus it
    setTimeout(() => {
      const el = rollInputRefs.current[newId];
      if (el) el.focus();
    }, 60);
  }, []);

  const handleRollWeightChange = (id, newWeight) => {
    const sanitized = newWeight.replace(/[^0-9.]/g, '');
    setRolls(prev => prev.map(r => r.id === id ? { ...r, weight: sanitized } : r));
  };

  const handleDeleteRoll = (id) => {
    setRolls(prev => prev.filter(r => r.id !== id));
    if (activeField?.id === id) setActiveField(null);
  };

  /* ─── Save ───────────────────────────────────────────────── */
  const handleSave = async () => {
    if (!orderName.trim()) {
      setError('يجب إدخال اسم الطلبية');
      return;
    }

    setError('');
    setSuccessMsg('');
    setLoading(true);

    const { error: saveErr } = await saveReadyOrder(editingOrder.id, {
      name: orderName,
      pipeLength,
      pipeWeight,
      rolls
    });

    setLoading(false);

    if (saveErr) {
      setError('فشل في حفظ البيانات: ' + saveErr);
    } else {
      setSuccessMsg('تم حفظ الطلبية بنجاح!');
      // Keep focus on the active field after save – re-focus it
      setTimeout(() => {
        if (activeField?.type === 'roll' && activeField.id) {
          rollInputRefs.current[activeField.id]?.focus();
        } else if (activeField?.type === 'pipe-length') {
          pipeLengthRef.current?.focus();
        } else if (activeField?.type === 'pipe-weight') {
          pipeWeightRef.current?.focus();
        } else {
          orderNameRef.current?.focus();
        }
      }, 100);
      // Clear success message after a moment but stay on this page
      setTimeout(() => setSuccessMsg(''), 2000);
    }
  };

  const handleMarkReady = async () => {
    if (!window.confirm('هل أنت متأكد من تعليم الطلبية كـ "جاهز"؟ لن تتمكن من تعديلها بعد ذلك.')) {
      return;
    }

    setError('');
    setSuccessMsg('');
    setLoading(true);

    const { error: markErr } = await markReadyOrder(editingOrder.id);

    setLoading(false);

    if (markErr) {
      setError('فشل في تعليم الطلبية كجاهزة: ' + markErr);
    } else {
      setSuccessMsg('تم تعليم الطلبية كجاهزة بنجاح!');
      setTimeout(() => {
        setEditingOrder(null);
        fetchOrders();
      }, 1000);
    }
  };


  /* ─── Keyboard injection ─────────────────────────────────── */
  const handleKeypadKey = useCallback((key) => {
    if (!activeField) return;

    const applyToValue = (current) => {
      if (key === 'CLEAR') return '';
      if (key === '⌫') return current.slice(0, -1);
      // Prevent double dots
      if (key === '.' && current.includes('.')) return current;
      return current + key;
    };

    if (activeField.type === 'roll') {
      const { id } = activeField;
      setRolls(prev => prev.map(r =>
        r.id === id ? { ...r, weight: applyToValue(r.weight) } : r
      ));
      // Keep focus on that roll input
      setTimeout(() => rollInputRefs.current[id]?.focus(), 0);
    } else if (activeField.type === 'pipe-length') {
      setPipeLength(prev => applyToValue(prev));
      setTimeout(() => pipeLengthRef.current?.focus(), 0);
    } else if (activeField.type === 'pipe-weight') {
      setPipeWeight(prev => applyToValue(prev));
      setTimeout(() => pipeWeightRef.current?.focus(), 0);
    } else if (activeField.type === 'order-name') {
      // Order name is text – only inject for backspace/clear
      if (key === 'CLEAR') setOrderName('');
      else if (key === '⌫') setOrderName(prev => prev.slice(0, -1));
      else setOrderName(prev => prev + key);
      setTimeout(() => orderNameRef.current?.focus(), 0);
    }
  }, [activeField]);

  /* ─── Calculations ───────────────────────────────────────── */
  const grossWeight = rolls.reduce((sum, r) => sum + (parseFloat(r.weight) || 0), 0);
  const rollsCount = rolls.length;
  const pWeight = parseFloat(pipeWeight) || 0;
  const netWeight = grossWeight - (rollsCount * pWeight);

  const getOrderStats = (order) => {
    const listRolls = order.ready_order_rolls || [];
    const grWeight = listRolls.reduce((sum, r) => sum + (parseFloat(r.weight) || 0), 0);
    const count = listRolls.length;
    const piWeight = parseFloat(order.pipe_weight) || 0;
    const ntWeight = grWeight - (count * piWeight);
    return { count, netWeight: ntWeight };
  };

  /* ─── Helpers ────────────────────────────────────────────── */
  // Rolls are stored newest-first (prepended), so the oldest roll (bottom) = #1,
  // newest roll (top) = #N. Label uses: rolls.length - index.
  const rollNumber = (index) => rolls.length - index;

  const makeRollFocusHandler = (roll, index) => () => {
    setActiveField({ type: 'roll', id: roll.id, label: `رول ${rollNumber(index)}` });
  };

  /* ─── Edit / View Mode ───────────────────────────────────── */
  if (editingOrder) {
    const isReady = editingOrder.status === 'ready';
    const parentOrderClosed = editingOrder.orders && (editingOrder.orders.status === 'completed' || editingOrder.orders.status === 'cancelled');
    const isViewOnly = isReady || parentOrderClosed;

    return (
      <div className="ready-layout">
        {/* ── Main edit panel ── */}
        <div className="ready-edit-container">
          <div className="edit-header">
            <button className="btn btn-outline" onClick={() => setEditingOrder(null)} disabled={loading}>
              رجوع
            </button>
            <h2>{isViewOnly ? 'عرض طلبية' : 'تعديل طلبية'}</h2>
            {editingOrder.orders && (
              <span className="creator-badge" style={{ marginRight: '1rem' }}>
                👤 العميل: {editingOrder.orders.customer_name}
              </span>
            )}
            {isReady && (
              <span className="status-badge status-ready-badge">تجهيز مكتمل</span>
            )}
          </div>

          {parentOrderClosed && (
            <div className="warning-banner" style={{ margin: '1rem 0', padding: '1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#f87171', textAlign: 'center', fontWeight: '500' }}>
              ⚠️ الطلبية المرتبطة بهذا التجهيز تم إغلاقها (مكتملة أو ملغية) ولا يمكن تعديلها.
            </div>
          )}

          {error && <div className="error-banner">{error}</div>}
          {successMsg && <div className="success-banner">{successMsg}</div>}

          <div className="settings-card ready-edit-card">
            <div className="form-group">
              <label htmlFor="order-name">اسم الطلبية</label>
              <input
                id="order-name"
                ref={orderNameRef}
                type="text"
                className="order-name-input"
                value={orderName}
                onChange={(e) => setOrderName(e.target.value)}
                onFocus={() => setActiveField({ type: 'order-name', label: 'اسم الطلبية' })}
                placeholder="مثال: طلبية شهر يونيو"
                disabled={loading || isViewOnly}
              />
            </div>

            <div className="rolls-section">
              <div className="rolls-header">
                <h3>الرولات ({rolls.length})</h3>
                {!isViewOnly && (
                  <button className="btn btn-primary btn-sm" onClick={handleAddRoll} disabled={loading}>
                    إضافة رول +
                  </button>
                )}
              </div>

              <div className="rolls-list">
                {rolls.length === 0 ? (
                  <div className="no-rolls-msg">لا يوجد رولات مضافة بعد. اضغط على "إضافة رول" للبدء.</div>
                ) : (
                  rolls.map((roll, index) => (
                    <div key={roll.id} className="roll-row">
                      <span className="roll-index">رول {rollNumber(index)}</span>
                      <div className="roll-input-container">
                        <input
                          ref={(el) => {
                            if (el) rollInputRefs.current[roll.id] = el;
                            else delete rollInputRefs.current[roll.id];
                          }}
                          type="text"
                          inputMode="decimal"
                          value={roll.weight}
                          onChange={(e) => handleRollWeightChange(roll.id, e.target.value)}
                          onFocus={makeRollFocusHandler(roll, index)}
                          placeholder="الوزن (g)"
                          disabled={loading || isViewOnly}
                        />
                        <span className="unit">g</span>
                      </div>
                      {!isViewOnly && (
                        <button
                          className="btn-delete-roll"
                          onClick={() => handleDeleteRoll(roll.id)}
                          title="حذف الرول"
                          disabled={loading}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bottom Info Tab */}
            <div className="order-info-tab">
              <h4>تفاصيل الطلبية العامة</h4>
              <div className="info-grid">
                <div className="info-stat">
                  <span className="stat-label">إجمالي الوزن (القائم)</span>
                  <span className="stat-value">{(grossWeight / 1000).toFixed(2)} kg</span>
                </div>
                <div className="info-stat">
                  <span className="stat-label">عدد الرولات</span>
                  <span className="stat-value">{rollsCount}</span>
                </div>

                <div className="info-input-group">
                  <div className="form-group">
                    <label htmlFor="pipe-length">طول الماسورة (cm)</label>
                    <input
                      id="pipe-length"
                      ref={pipeLengthRef}
                      type="text"
                      inputMode="decimal"
                      value={pipeLength}
                      onChange={(e) => setPipeLength(e.target.value.replace(/[^0-9.]/g, ''))}
                      onFocus={() => setActiveField({ type: 'pipe-length', label: 'طول الماسورة' })}
                      disabled={loading || isViewOnly}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="pipe-weight">وزن الماسورة (g)</label>
                    <input
                      id="pipe-weight"
                      ref={pipeWeightRef}
                      type="text"
                      inputMode="decimal"
                      value={pipeWeight}
                      onChange={(e) => setPipeWeight(e.target.value.replace(/[^0-9.]/g, ''))}
                      onFocus={() => setActiveField({ type: 'pipe-weight', label: 'وزن الماسورة' })}
                      disabled={loading || isViewOnly}
                    />
                  </div>
                </div>

                <div className="info-stat net-weight-stat">
                  <span className="stat-label">الوزن الصافي</span>
                  <span className="stat-value">{(netWeight / 1000).toFixed(2)} kg</span>
                </div>
              </div>

              <div className="info-actions">
                {!isViewOnly && (
                  <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                    {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                  </button>
                )}
                {!isViewOnly && (
                  <button className="btn btn-ready" onClick={handleMarkReady} disabled={loading}>
                    {loading ? 'جاري...' : 'جاهز ✓'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Keyboard sidebar ── */}
        {!isViewOnly && (
          <KeyboardSidebar
            activeField={activeField}
            onKey={handleKeypadKey}
            onSave={handleAddRoll}
            saveDisabled={loading}
          />
        )}
      </div>
    );
  }

  /* ─── List View ──────────────────────────────────────────── */

  // Hide preparing cards whose parent order is completed (archived)
  const visibleOrders = orders.filter(order => {
    if (order.orders && order.orders.status === 'completed') return false;
    return true;
  });

  return (
    <div className="ready-layout">
      <div className="ready-container">
        <div className="ready-header-bar">
          <h2>قسم جاهز (الطلبيات)</h2>
          <button className="btn btn-primary" onClick={handleOpenPrepareOrder} disabled={loading}>
            تجهيز طلبية +
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {loading && orders.length === 0 ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>جاري تحميل الطلبيات...</p>
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className="empty-state">
            <p>لا توجد طلبيات مضافة حالياً. اضغط على "تجهيز طلبية +" للبدء.</p>
          </div>
        ) : (
          <div className="orders-grid">
            {visibleOrders.map((order) => {
              const { count, netWeight } = getOrderStats(order);
              const isReady = order.status === 'ready';
              const parentOrderClosed = order.orders && order.orders.status === 'cancelled';


              return (
                <div
                  key={order.id}
                  className={`order-card ${isReady ? 'order-card-ready' : ''} ${parentOrderClosed ? 'order-card-closed' : ''}`}
                  onClick={() => startEditing(order)}
                >
                  <div className="order-card-header">
                    <h3>{order.name}</h3>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button
                        type="button"
                        className="card-print-btn"
                        onClick={(e) => handlePrint(order, e)}
                        title="طباعة بطاقة التجهيز"
                        disabled={loading}
                      >
                        🖨️
                      </button>
                      <button
                        type="button"
                        className="card-print-btn"
                        onClick={(e) => handleDeleteOrder(order.id, order.name, e)}
                        title="حذف بطاقة التجهيز"
                        disabled={loading}
                        style={{ color: '#f87171' }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {order.orders && (
                    <div className="card-stat" style={{ margin: '0 1.2rem 0.5rem 1.2rem', padding: '0.4rem 0.6rem', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '0.85rem' }}>
                      <span>للعميل:</span>
                      <strong style={{ color: '#a5b4fc' }}>{order.orders.customer_name}</strong>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="order-card-status">
                    <span className={`status-badge ${isReady ? 'status-badge-ready' : 'status-badge-preparing'}`}>
                      {STATUS_LABELS[order.status] || STATUS_LABELS.preparing}
                    </span>
                    {parentOrderClosed && (
                      <span className="status-badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', marginRight: '0.5rem' }}>
                        مغلق
                      </span>
                    )}
                  </div>

                  <div className="order-card-body">
                    <div className="card-stat">
                      <span>عدد الرولات:</span>
                      <strong>{count}</strong>
                    </div>
                    <div className="card-stat">
                      <span>الوزن الصافي:</span>
                      <strong>{(netWeight / 1000).toFixed(2)} kg</strong>
                    </div>
                    <div className="card-date">
                      <span>تاريخ الإنشاء:</span>
                      <span>{new Date(order.created_at).toLocaleDateString('ar-EG')}</span>
                    </div>
                  </div>
                  <div className="order-card-footer">
                    {isReady ? (
                      <button className="btn btn-outline btn-block btn-sm" disabled>
                        تجهيز مكتمل ✓
                      </button>
                    ) : parentOrderClosed ? (
                      <button className="btn btn-outline btn-block btn-sm" disabled style={{ borderColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
                        عرض التفاصيل فقط 👁️
                      </button>
                    ) : (
                      <button className="btn btn-outline btn-block btn-sm">تعديل الطلبية ✏️</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Select Order Modal Overlay */}
      {showSelectOrderModal && (
        <div className="form-overlay" onClick={() => setShowSelectOrderModal(false)}>
          <div className="form-modal" onClick={(e) => e.stopPropagation()}>
            <h3>تجهيز طلبية جديدة</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              الرجاء اختيار طلبية من إدارة الطلبيات للبدء في تجهيزها:
            </p>
            
            {availableOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px dashed rgba(255, 255, 255, 0.1)' }}>
                <p style={{ color: '#fbbf24', marginBottom: '1rem' }}>⚠️ لا توجد طلبيات قيد الانتظار حالياً</p>
                <button 
                  className="btn btn-outline btn-sm" 
                  onClick={() => setShowSelectOrderModal(false)}
                >
                  إغلاق
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                {availableOrders.map(order => (
                  <div 
                    key={order.id} 
                    className="select-order-item"
                    onClick={() => handleConfirmPrepareOrder(order)}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', textAlign: 'right' }}>
                      <span style={{ fontWeight: '600', color: '#fff' }}>{order.customer_name}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>#{order.id} | {new Date(order.order_date).toLocaleDateString('ar-EG')}</span>
                    </div>
                    <span style={{ color: 'var(--color-primary-hover)', fontWeight: 'bold' }}>تجهيز ←</span>
                  </div>
                ))}
              </div>
            )}
            
            <div className="modal-actions" style={{ marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowSelectOrderModal(false)}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
