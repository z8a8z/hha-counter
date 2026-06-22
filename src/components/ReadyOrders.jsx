import { useState, useEffect } from 'react';
import { getReadyOrders, createReadyOrder, saveReadyOrder, deleteReadyOrder, markReadyOrder } from '../lib/database.js';
import { debug } from '../lib/debug.js';

const MODULE = 'ReadyOrders';

const STATUS_LABELS = {
  preparing: 'قيد التجهيز',
  ready: 'تجهيز مكتمل'
};

export default function ReadyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Editing state
  const [editingOrder, setEditingOrder] = useState(null); // null = list view, object = editing/viewing
  const [orderName, setOrderName] = useState('');
  const [pipeLength, setPipeLength] = useState('0');
  const [pipeWeight, setPipeWeight] = useState('0');
  const [rolls, setRolls] = useState([]); // Array of { id, weight }

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

  const handleAddOrder = async () => {
    setError('');
    setLoading(true);
    const defaultName = `طلبية جديدة بتاريخ ${new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric' })}`;
    const { data, error: createErr } = await createReadyOrder(defaultName);
    setLoading(false);

    if (createErr) {
      setError('فشل في إنشاء طلبية جديدة: ' + createErr);
    } else if (data) {
      startEditing(data);
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
    setPipeLength(order.pipe_length?.toString() || '0');
    setPipeWeight(order.pipe_weight?.toString() || '0');

    if (order.ready_order_rolls) {
      setRolls(order.ready_order_rolls.map((r, index) => ({
        id: r.id || `${Date.now()}-${index}-${Math.random()}`,
        weight: r.weight?.toString() || '0'
      })));
    } else {
      setRolls([]);
    }
    setError('');
    setSuccessMsg('');
  };

  const handleAddRoll = () => {
    setRolls([...rolls, { id: `${Date.now()}-${Math.random()}`, weight: '0' }]);
  };

  const handleRollWeightChange = (id, newWeight) => {
    const sanitized = newWeight.replace(/[^0-9.]/g, '');
    setRolls(rolls.map(r => r.id === id ? { ...r, weight: sanitized } : r));
  };

  const handleDeleteRoll = (id) => {
    setRolls(rolls.filter(r => r.id !== id));
  };

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
      setTimeout(() => {
        setEditingOrder(null);
        fetchOrders();
      }, 1000);
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

  const handlePrint = () => {
    alert('وظيفة الطباعة غير مفعلة حالياً. (نسخة تجريبية)');
  };

  // Calculations – all in grams
  const grossWeight = rolls.reduce((sum, r) => sum + (parseFloat(r.weight) || 0), 0);
  const rollsCount = rolls.length;
  const pWeight = parseFloat(pipeWeight) || 0;
  const netWeight = grossWeight - (rollsCount * pWeight);

  // Helper to format order list statistics (in grams)
  const getOrderStats = (order) => {
    const listRolls = order.ready_order_rolls || [];
    const grWeight = listRolls.reduce((sum, r) => sum + (parseFloat(r.weight) || 0), 0);
    const count = listRolls.length;
    const piWeight = parseFloat(order.pipe_weight) || 0;
    const ntWeight = grWeight - (count * piWeight);
    return { count, netWeight: ntWeight };
  };

  /* ─── Edit / View Mode ─────────────────────────────────── */
  if (editingOrder) {
    const isReady = editingOrder.status === 'ready';
    const isViewOnly = isReady; // Ready orders are view-only

    return (
      <div className="ready-edit-container">
        <div className="edit-header">
          <button className="btn btn-outline" onClick={() => setEditingOrder(null)} disabled={loading}>
            رجوع
          </button>
          <h2>{isViewOnly ? 'عرض طلبية' : 'تعديل طلبية'}</h2>
          {isReady && (
            <span className="status-badge status-ready-badge">تجهيز مكتمل</span>
          )}
        </div>

        {error && <div className="error-banner">{error}</div>}
        {successMsg && <div className="success-banner">{successMsg}</div>}

        <div className="settings-card ready-edit-card">
          <div className="form-group">
            <label htmlFor="order-name">اسم الطلبية</label>
            <input
              id="order-name"
              type="text"
              className="order-name-input"
              value={orderName}
              onChange={(e) => setOrderName(e.target.value)}
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
                    <span className="roll-index">رول {index + 1}</span>
                    <div className="roll-input-container">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={roll.weight}
                        onChange={(e) => handleRollWeightChange(roll.id, e.target.value)}
                        placeholder="الوزن (غرام)"
                        disabled={loading || isViewOnly}
                      />
                      <span className="unit">غ</span>
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
                <span className="stat-value">{grossWeight.toFixed(2)} غ</span>
              </div>
              <div className="info-stat">
                <span className="stat-label">عدد الرولات</span>
                <span className="stat-value">{rollsCount}</span>
              </div>

              <div className="info-input-group">
                <div className="form-group">
                  <label htmlFor="pipe-length">طول الماسورة (سم)</label>
                  <input
                    id="pipe-length"
                    type="text"
                    inputMode="decimal"
                    value={pipeLength}
                    onChange={(e) => setPipeLength(e.target.value.replace(/[^0-9.]/g, ''))}
                    disabled={loading || isViewOnly}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="pipe-weight">وزن الماسورة (غرام)</label>
                  <input
                    id="pipe-weight"
                    type="text"
                    inputMode="decimal"
                    value={pipeWeight}
                    onChange={(e) => setPipeWeight(e.target.value.replace(/[^0-9.]/g, ''))}
                    disabled={loading || isViewOnly}
                  />
                </div>
              </div>

              <div className="info-stat net-weight-stat">
                <span className="stat-label">الوزن الصافي</span>
                <span className="stat-value">{netWeight.toFixed(2)} غ</span>
              </div>
            </div>

            <div className="info-actions">
              {!isViewOnly && (
                <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                  {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </button>
              )}
              <button className="btn btn-outline" onClick={handlePrint}>
                طباعة الفاتورة 🖨️
              </button>
              {!isViewOnly && (
                <button className="btn btn-ready" onClick={handleMarkReady} disabled={loading}>
                  {loading ? 'جاري...' : 'جاهز ✓'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── List View ────────────────────────────────────────── */
  return (
    <div className="ready-container">
      <div className="ready-header-bar">
        <h2>قسم جاهز (الطلبيات)</h2>
        <button className="btn btn-primary" onClick={handleAddOrder} disabled={loading}>
          طلبية جديدة +
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading && orders.length === 0 ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>جاري تحميل الطلبيات...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <p>لا توجد طلبيات مضافة حالياً. اضغط على "طلبية جديدة +" للبدء.</p>
        </div>
      ) : (
        <div className="orders-grid">
          {orders.map((order) => {
            const { count, netWeight } = getOrderStats(order);
            const isReady = order.status === 'ready';

            return (
              <div
                key={order.id}
                className={`order-card ${isReady ? 'order-card-ready' : ''}`}
                onClick={() => startEditing(order)}
              >
                <div className="order-card-header">
                  <h3>{order.name}</h3>
                  <button
                    className="btn-delete"
                    onClick={(e) => handleDeleteOrder(order.id, order.name, e)}
                    title="حذف الطلبية"
                    disabled={loading}
                  >
                    🗑️
                  </button>
                </div>

                {/* Status Badge */}
                <div className="order-card-status">
                  <span className={`status-badge ${isReady ? 'status-badge-ready' : 'status-badge-preparing'}`}>
                    {STATUS_LABELS[order.status] || STATUS_LABELS.preparing}
                  </span>
                </div>

                <div className="order-card-body">
                  <div className="card-stat">
                    <span>عدد الرولات:</span>
                    <strong>{count}</strong>
                  </div>
                  <div className="card-stat">
                    <span>الوزن الصافي:</span>
                    <strong>{netWeight.toFixed(2)} غ</strong>
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
  );
}
