import React, { useState, useEffect } from 'react';
import { getOrders, createOrder, createFullOrder, updateOrder, updateFullOrder, deleteOrder, getReadyOrders, getOrderForm, getPrintSettings, deleteReadyOrder, getAutofillData } from '../../lib/database.js';
import OrderForm from './OrderForm.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';
import { usePrint } from '../../hooks/usePrint.js';
import { PrintTemplates } from '../common/PrintTemplates.js';

const STATUS_LABELS = {
  pending: 'قيد الانتظار',
  completed: 'مكتمل',
  cancelled: 'ملغي'
};

const STATUS_CLASSES = {
  pending: 'status-pending',
  completed: 'status-completed',
  cancelled: 'status-cancelled'
};

const READY_STATUS_LABELS = {
  preparing: 'قيد التجهيز',
  ready: 'تجهيز مكتمل'
};

/* ─── Prepared Card (read-only) ─────────────────────────────── */
function PreparedCard({ readyOrder, onDelete, onPrint }) {
  const { user } = useAuth();
  const rolls = readyOrder.ready_order_rolls || [];
  const grossWeight = rolls.reduce((sum, r) => sum + (parseFloat(r.weight) || 0), 0);
  const pipeWeight = parseFloat(readyOrder.pipe_weight) || 0;
  const netWeight = (grossWeight - (rolls.length * pipeWeight)) / 1000;
  const isReady = readyOrder.status === 'ready';

  return (
    <div className={`prepared-card ${isReady ? 'prepared-card-done' : ''}`}>
      <div className="prepared-card-header">
        <span className="prepared-card-name">{readyOrder.name}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span className={`status-badge ${isReady ? 'status-badge-ready' : 'status-badge-preparing'}`}>
            {READY_STATUS_LABELS[readyOrder.status] || READY_STATUS_LABELS.preparing}
          </span>
          {onPrint && user?.role !== 'scale_employee' && (
            <button
              type="button"
              className="card-print-btn"
              onClick={(e) => {
                e.stopPropagation();
                onPrint(readyOrder);
              }}
              title="طباعة بطاقة التجهيز"
            >
              🖨️
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className="card-delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(readyOrder.id, readyOrder.name);
              }}
              title="حذف التجهيز"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.9rem',
                padding: '2px 4px',
                borderRadius: '4px',
                transition: 'background 0.15s'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.15)'}
              onMouseLeave={(e) => e.target.style.background = 'none'}
            >
              🗑️
            </button>
          )}
        </div>
      </div>
      <div className="prepared-card-stats">
        <div className="prepared-stat">
          <span className="prepared-stat-label">الرولات</span>
          <span className="prepared-stat-value">{rolls.length}</span>
        </div>
        <div className="prepared-stat">
          <span className="prepared-stat-label">الوزن الصافي</span>
          <span className="prepared-stat-value">{netWeight.toFixed(2)} kg</span>
        </div>
        {readyOrder.pipe_length > 0 && (
          <div className="prepared-stat">
            <span className="prepared-stat-label">طول الماسورة</span>
            <span className="prepared-stat-value">{readyOrder.pipe_length} cm</span>
          </div>
        )}
      </div>
      <div className="prepared-card-date">
        📅 {new Date(readyOrder.created_at).toLocaleDateString('ar-EG')}
      </div>
    </div>
  );
}

export default function Orders({ onStatusChange }) {
  const { user } = useAuth();
  const { printHtml } = usePrint();
  const [orders, setOrders] = useState([]);
  const [readyOrders, setReadyOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handlePrint = async (order, type) => {
    setLoading(true);
    setError('');
    const [formRes, settingsRes] = await Promise.all([
      getOrderForm(order.id),
      getPrintSettings()
    ]);
    setLoading(false);
    if (formRes.error) {
      setError('فشل جلب تفاصيل الاستمارة للطباعة: ' + formRes.error);
      return;
    }
    if (!formRes.data) {
      setError('لم يتم العثور على استمارة تفصيلية لهذه الطلبية. لا يمكن طباعتها.');
      return;
    }
    const html = type === 'management' 
      ? PrintTemplates.orderManagement(order, formRes.data, settingsRes.data || {})
      : PrintTemplates.orderWork(order, formRes.data, { ...(settingsRes.data || {}), printedBy: user?.username || 'مجهول' });
    printHtml(html);
  };

  const handlePrintReadyOrder = async (readyOrder) => {
    setLoading(true);
    setError('');
    const { data: settings } = await getPrintSettings();
    setLoading(false);
    const html = PrintTemplates.preparationCard(readyOrder, settings || {});
    printHtml(html);
  };

  // Dedicated canvas toggle
  const [showPrepared, setShowPrepared] = useState(false);
  // Track which order row has the canvas expanded
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // Form / dialog state
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [autofillData, setAutofillData] = useState({
    technicians: [],
    assistants: [],
    organizers: [],
    customers: {}
  });

  // Fields
  const [customerName, setCustomerName] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [details, setDetails] = useState('');
  const [status, setStatus] = useState('pending');

  // Filter
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    const [ordersRes, readyRes, autofillRes] = await Promise.all([
      getOrders(),
      getReadyOrders(),
      getAutofillData()
    ]);
    setLoading(false);
    if (ordersRes.error) {
      setError('حدث خطأ أثناء تحميل الطلبيات: ' + ordersRes.error);
    } else {
      setOrders(ordersRes.data || []);
    }
    if (!readyRes.error) {
      setReadyOrders(readyRes.data || []);
    }
    if (!autofillRes.error && autofillRes.data) {
      setAutofillData(autofillRes.data);
    }
  };

  const openAddForm = () => {
    setEditingOrder(null);
    setCustomerName('');
    setOrderDate(new Date().toISOString().split('T')[0]);
    setDetails('');
    setStatus('pending');
    setShowForm(true);
  };

  const openEditForm = async (order) => {
    setLoading(true);
    setError('');
    const { data, error } = await getOrderForm(order.id);
    setLoading(false);
    if (error) {
      setError('فشل تحميل تفاصيل الاستمارة: ' + error);
      return;
    }
    setEditingOrder({
      ...(data || {}),
      ...order,
      id: order.id
    });
    setCustomerName(order.customer_name);
    setOrderDate(order.order_date);
    setDetails(order.details || '');
    setStatus(order.status);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setError('يرجى إدخال اسم العميل');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    if (editingOrder) {
      const { error: updateErr } = await updateOrder(editingOrder.id, {
        customer_name: customerName,
        order_date: orderDate,
        details: details || null,
        status: status
      });

      setLoading(false);
      if (updateErr) {
        setError('فشل تعديل الطلبية: ' + updateErr);
      } else {
        setSuccessMsg('تم تعديل الطلبية بنجاح');
        setShowForm(false);
        fetchAll();
      }
    } else {
      const { data, error: createErr } = await createOrder(
        customerName,
        orderDate,
        details,
        status,
        user?.username || 'مجهول'
      );

      setLoading(false);
      if (createErr) {
        setError('فشل إضافة الطلبية: ' + createErr);
      } else {
        setSuccessMsg('تم إضافة الطلبية بنجاح');
        setShowForm(false);
        fetchAll();
      }
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`هل أنت متأكد من حذف طلبية العميل "${name}"؟`)) {
      return;
    }

    setLoading(true);
    setError('');
    const { error: delErr } = await deleteOrder(id);
    setLoading(false);

    if (delErr) {
      setError('فشل حذف الطلبية: ' + delErr);
    } else {
      setSuccessMsg('تم حذف الطلبية بنجاح');
      fetchAll();
    }
  };

  const handleDeleteReadyOrder = async (id, name) => {
    if (!window.confirm(`هل أنت متأكد من حذف التجهيز "${name}"؟`)) {
      return;
    }

    setLoading(true);
    setError('');
    const { error: delErr } = await deleteReadyOrder(id);
    setLoading(false);

    if (delErr) {
      setError('فشل حذف التجهيز: ' + delErr);
    } else {
      setSuccessMsg('تم حذف التجهيز بنجاح');
      fetchAll();
    }
  };

  const toggleExpandedOrder = (orderId) => {
    setExpandedOrderId(prev => prev === orderId ? null : orderId);
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    if (filterStatus === 'all') return true;
    return order.status === filterStatus;
  });

  // Get ready orders linked to a specific order id
  const getLinkedReadyOrders = (orderId) => {
    return readyOrders.filter(ro => ro.order_id === orderId);
  };

  return (
    <div className="orders-layout">
      <div className="orders-container">
        <div className="orders-header-bar">
          <h2>إدارة الطلبيات</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Show Prepared toggle */}
            <div className="prepared-toggle-row">
              <span className="prepared-toggle-label">عرض التجهيزات</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={showPrepared}
                  onChange={(e) => {
                    setShowPrepared(e.target.checked);
                    if (!e.target.checked) setExpandedOrderId(null);
                  }}
                />
                <span className="toggle-slider" />
              </label>
            </div>
            
            {/* Migrated print button */}
            <button
              className="btn btn-small btn-outline"
              style={{ backgroundColor: 'rgb(240, 249, 255)', borderColor: 'rgb(186, 230, 253)', minHeight: '36px' }}
              title="طباعة الإدارة"
              disabled={!expandedOrderId || loading}
              onClick={() => {
                const selectedOrder = orders.find(o => o.id === expandedOrderId);
                if (selectedOrder) handlePrint(selectedOrder, 'management');
              }}
            >
              📄 إدارة
            </button>

            <button className="btn btn-primary" onClick={openAddForm} disabled={loading}>
              طلبية جديدة +
            </button>
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}
        {successMsg && <div className="success-banner">{successMsg}</div>}

        {/* Filters */}
        <div className="orders-filters">
          <button
            className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            الكل
          </button>
          <button
            className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
            onClick={() => setFilterStatus('pending')}
          >
            قيد الانتظار
          </button>
          <button
            className={`filter-btn ${filterStatus === 'completed' ? 'active' : ''}`}
            onClick={() => setFilterStatus('completed')}
          >
            مكتمل
          </button>
          <button
            className={`filter-btn ${filterStatus === 'cancelled' ? 'active' : ''}`}
            onClick={() => setFilterStatus('cancelled')}
          >
            ملغي
          </button>
        </div>

        {/* Modal / Form Overlay */}
        {showForm && (
          <OrderForm
            onCancel={() => {
              setShowForm(false);
              setEditingOrder(null);
            }}
            initialData={editingOrder}
            autofillData={autofillData}
            onSuccess={async (formData) => {
              setLoading(true);
              setError('');
              setSuccessMsg('');
              
              if (editingOrder) {
                // Update mode
                const { error: baseErr } = await updateOrder(editingOrder.id, {
                  customer_name: formData.customer_name || formData.organizer_name || '',
                  order_date: formData.order_date || new Date().toISOString().split('T')[0],
                  details: formData.extra_details || '',
                  status: editingOrder.status
                });
                if (baseErr) {
                  setError('فشل تعديل الطلبية الأساسية: ' + baseErr);
                  setLoading(false);
                  return;
                }
                const { customer_name, order_date, ...detailedFields } = formData;
                const { error: fullErr } = await updateFullOrder(editingOrder.id, detailedFields);
                setLoading(false);
                if (fullErr) {
                  setError('فشل تعديل تفاصيل الاستمارة: ' + fullErr);
                } else {
                  setSuccessMsg('تم تعديل الطلبية بنجاح');
                  setShowForm(false);
                  setEditingOrder(null);
                  fetchAll();
                }
              } else {
                // Create mode
                const { data: baseData, error: baseErr } = await createOrder(
                  formData.customer_name || formData.organizer_name || '',
                  formData.order_date || new Date().toISOString().split('T')[0],
                  formData.extra_details || '',
                  'pending',
                  user?.username || 'مجهول'
                );
                if (baseErr) {
                  setError('فشل إنشاء الطلبية الأساسية: ' + baseErr);
                  setLoading(false);
                  return;
                }
                const orderId = baseData.id;
                const { customer_name, order_date, ...detailedFields } = formData;
                const { data: fullData, error: fullErr } = await createFullOrder(orderId, detailedFields);
                setLoading(false);
                if (fullErr) {
                  setError('فشل حفظ بيانات الاستمارة: ' + fullErr);
                } else {
                  setSuccessMsg('تم إنشاء الطلبية بنجاح');
                  setShowForm(false);
                  fetchAll();
                }
              }
            }}
          />
        )}

        {/* Orders List */}
        {loading && orders.length === 0 ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>جاري تحميل الطلبيات...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-state">
            <p>لا توجد طلبيات مطابقة للبحث أو مضافة حالياً.</p>
          </div>
        ) : (
          <div className="orders-table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>رقم الطلب</th>
                  <th>اسم العميل</th>
                  <th>تاريخ الطلبية</th>
                  <th>التفاصيل</th>
                  <th>أنشئ بواسطة</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                  {showPrepared && <th>التجهيزات</th>}
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const linked = getLinkedReadyOrders(order.id);
                  const isExpanded = expandedOrderId === order.id;

                  return (
                    <React.Fragment key={order.id}>
                      <tr 
                        className={`${isExpanded ? 'order-row-selected' : ''} ${isExpanded && showPrepared ? 'order-row-expanded' : ''}`}
                        onClick={() => toggleExpandedOrder(order.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>#{order.id}</td>
                        <td className="font-bold">{order.customer_name}</td>
                        <td>{new Date(order.order_date).toLocaleDateString('ar-EG')}</td>
                        <td className="details-cell">{order.details || '—'}</td>
                        <td>
                          <span className="creator-badge">👤 {order.created_by || 'مجهول'}</span>
                        </td>
                        <td>
                          <select
                            className={`status-badge ${STATUS_CLASSES[order.status]}`}
                            value={order.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={async (e) => {
                              const newStatus = e.target.value;
                              setLoading(true);
                              const { error: err } = await updateOrder(order.id, { status: newStatus });
                              setLoading(false);
                              if (err) {
                                setError('فشل تحديث حالة الطلبية: ' + err);
                              } else {
                                setSuccessMsg('تم تحديث حالة الطلبية بنجاح');
                                fetchAll();
                                if (onStatusChange) onStatusChange();
                              }
                            }}
                            style={{
                              border: 'none',
                              outline: 'none',
                              cursor: 'pointer',
                              padding: '0.2rem 0.4rem 0.2rem 0.6rem',
                              fontFamily: 'inherit',
                              fontSize: '0.72rem',
                              fontWeight: '600'
                            }}
                          >
                            <option value="pending" style={{ background: '#1e1b4b', color: '#fbbf24' }}>قيد الانتظار</option>
                            <option value="completed" style={{ background: '#1e1b4b', color: '#34d399' }}>مكتمل</option>
                            <option value="cancelled" style={{ background: '#1e1b4b', color: '#f87171' }}>ملغي</option>
                          </select>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              className="btn btn-small btn-outline"
                              onClick={(e) => { e.stopPropagation(); openEditForm(order); }}
                              title="تعديل"
                            >
                              ✏️ تعديل
                            </button>
                            <button
                              className="btn btn-small btn-delete"
                              onClick={(e) => { e.stopPropagation(); handleDelete(order.id, order.customer_name); }}
                              title="حذف"
                            >
                              🗑️ حذف
                            </button>
                            <button
                              className="btn btn-small btn-outline"
                              onClick={(e) => { e.stopPropagation(); handlePrint(order, 'work'); }}
                              style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}
                              title="طباعة الورشة"
                            >
                              🛠️ ورشة
                            </button>
                          </div>
                        </td>
                        {showPrepared && (
                          <td>
                            {linked.length > 0 ? (
                              <button
                                className={`btn btn-small ${isExpanded ? 'btn-primary' : 'btn-outline'}`}
                                onClick={(e) => { e.stopPropagation(); toggleExpandedOrder(order.id); }}
                                style={{ minWidth: '80px' }}
                              >
                                {isExpanded ? '▲ إخفاء' : `▼ عرض (${linked.length})`}
                              </button>
                            ) : (
                              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>لا يوجد</span>
                            )}
                          </td>
                        )}
                      </tr>

                      {/* ── Dedicated Prepared Canvas ── */}
                      {showPrepared && isExpanded && linked.length > 0 && (
                        <tr className="prepared-canvas-row">
                          <td colSpan={8} style={{ padding: 0 }}>
                            <div className="prepared-canvas">
                              <div className="prepared-canvas-header">
                                <span className="prepared-canvas-title">
                                  🗂️ التجهيزات المرتبطة بـ <strong>{order.customer_name}</strong>
                                </span>
                                <span className="prepared-canvas-count">{linked.length} تجهيز</span>
                              </div>
                              <div className="prepared-canvas-grid">
                                {linked.map(ro => (
                                  <PreparedCard
                                    key={ro.id}
                                    readyOrder={ro}
                                    onDelete={handleDeleteReadyOrder}
                                    onPrint={handlePrintReadyOrder}
                                  />
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
