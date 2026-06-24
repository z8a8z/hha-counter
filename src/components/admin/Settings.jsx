import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import UserManagement from './UserManagement.jsx';
import VariationManager from './VariationManager.jsx';
import { getPrintSettings, savePrintSettings } from '../../lib/database.js';
import { PrintTemplates } from '../common/PrintTemplates.js';

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');

  // Protect route
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Only admins can see the settings
  if (user.role !== 'admin') {
    return (
      <div className="settings-container">
        <div className="settings-card">
          <h2>غير مصرح</h2>
          <p>ليس لديك صلاحية لعرض هذه الصفحة.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'users', label: 'المستخدمين' },
    { id: 'print_settings', label: 'إعدادات الطباعة' },
    { id: 'purchase_offices', label: 'مكاتب الشراء' },
    { id: 'roll_widths', label: 'عروض الرولات' },
    { id: 'roll_types', label: 'أنواع الرولات' },
    { id: 'pipe_lengths', label: 'أطوال المواسير' },
    { id: 'liquid_types', label: 'أنواع السوائل' },
    { id: 'ink_companies', label: 'شركات الأحبار' },
    { id: 'ink_colors', label: 'ألوان الأحبار' },
    { id: 'ink_weights', label: 'أوزان الأحبار' }
  ];

  return (
    <div className="settings-container">
      <div className="settings-card">
        <div className="page-header">
          <h2>⚙️ الإعدادات</h2>
        </div>
        <div className="settings-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="tab-content">
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'print_settings' && <PrintSettings />}
          {activeTab === 'purchase_offices' && <VariationManager entity="purchase_offices" />}
          {activeTab === 'roll_widths' && <VariationManager entity="roll_widths" />}
          {activeTab === 'roll_types' && <VariationManager entity="roll_types" />}
          {activeTab === 'pipe_lengths' && <VariationManager entity="pipe_lengths" />}
          {activeTab === 'liquid_types' && <VariationManager entity="liquid_types" />}
          {activeTab === 'ink_companies' && <VariationManager entity="ink_companies" />}
          {activeTab === 'ink_colors' && <VariationManager entity="ink_colors" />}
          {activeTab === 'ink_weights' && <VariationManager entity="ink_weights" />}
        </div>
      </div>
    </div>
  );
}

function PrintSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('general');
  const [previewType, setPreviewType] = useState('mgmt');

  // General Settings
  const [factoryName, setFactoryName] = useState('');
  const [phone, setPhone] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [fontFamily, setFontFamily] = useState('Tahoma');
  const [lineWidthFree, setLineWidthFree] = useState('1');
  const [lineWidthTable, setLineWidthTable] = useState('1');

  // Preparation Card Settings
  const [prepTitle, setPrepTitle] = useState('');
  const [prepNotes, setPrepNotes] = useState('');

  // Management Order Settings
  const [mgmtTitle, setMgmtTitle] = useState('');
  const [mgmtNotes, setMgmtNotes] = useState('');

  // Workspace Order Settings
  const [workTitle, setWorkTitle] = useState('');
  const [workNotes, setWorkNotes] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error: err } = await getPrintSettings();
    setLoading(false);
    if (err) {
      setError('فشل تحميل الإعدادات من السيرفر: ' + err);
      return;
    }

    const s = data || {};
    const gen = s.general || {};
    const prep = s.prepCard || {};
    const mgmt = s.mgmtOrder || {};
    const work = s.workOrder || {};

    setFactoryName(gen.factoryName || 'شركة HHA للتجارة والتجهيز');
    setPhone(gen.phone || '07700000000');
    setLogoUrl(gen.logoUrl || '');
    setFontFamily(gen.fontFamily || 'Tahoma');
    setLineWidthFree(gen.lineWidthFree || '1');
    setLineWidthTable(gen.lineWidthTable || '1');

    setPrepTitle(prep.title || 'بطاقة تجهيز رولات');
    setPrepNotes(prep.notes || '');

    setMgmtTitle(mgmt.title || 'طلبية إدارة');
    setMgmtNotes(mgmt.notes || 'شكراً لتعاملكم معنا');

    setWorkTitle(work.title || 'أمر تشغيل وإنتاج');
    setWorkNotes(work.notes || 'تنبيه للإنتاج والورشة: يرجى التحقق من أبعاد الميكرون قبل البدء.');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const payload = {
      general: {
        factoryName,
        phone,
        logoUrl,
        fontFamily,
        lineWidthFree,
        lineWidthTable
      },
      prepCard: {
        title: prepTitle,
        notes: prepNotes
      },
      mgmtOrder: {
        title: mgmtTitle,
        notes: mgmtNotes
      },
      workOrder: {
        title: workTitle,
        notes: workNotes
      }
    };

    const { error: saveErr } = await savePrintSettings(payload);
    setSaving(false);
    if (saveErr) {
      setError('فشل حفظ الإعدادات: ' + saveErr);
    } else {
      setSuccess('تم حفظ إعدادات الطباعة على السيرفر بنجاح');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  // Dummy variables for preview
  const mockOrder = {
    id: 999,
    customer_name: 'شركة الرافدين للتجارة العامة المحدودة',
    order_date: new Date().toISOString(),
    created_by: 'فني الطباعة'
  };

  const mockFormDetails = {
    customer_phone: '07701234567',
    organizer_name: 'علي عبد الله المحترم',
    technician: 'م. أحمد الخبير',
    assistant_technician: 'سعد كريم',
    shift: 'صباحي',
    functional_desc: 'أكياس تسوق بلاستيكية مع مقبض مدعم للأسواق الكبرى',
    job_types: ['طباعة', 'لامنيشن', 'تقطيع'],
    weight_kg: 500,
    production_length: 550,
    production_width: 350,
    design_source: 'جاهز من الزبون',
    clishe_source: 'نحن نصمم ونكتب',
    print_style: 'شفاف',
    print_subtype: 'سفلية',
    material: 'LDPE شفاف نقي',
    mic_value: 50,
    print_quantity: 12000,
    print_color_count: 6,
    material_measure: 400,
    glue_type: 'غراء تركي لاصق قوي',
    lamination_needed: true,
    lamination_mat1: 'PET مادة 1',
    lamination_meas1: 380,
    lamination_mic1: 15,
    cutting_needed: true,
    packaging_needed: true,
    wrap_shape: 'شكل ب',
    wrap_diameter: 250,
    wrap_weight: 15,
    delivery_location: 'موقع المخازن الرئيسي - البصرة',
    payment_method: 'شيك الدفع الآجل',
    payment_details: 'مقدم شيك 30% والمستند الباقي بعد فحص الاستلام',
    total_amount: 1250000
  };

  const mockReadyOrder = {
    id: 'test-prep-id',
    name: 'تجهيز رولات الأكياس - وجبة إنتاج رقم A',
    pipe_length: 45,
    pipe_weight: 0.950,
    created_at: new Date().toISOString(),
    ready_order_rolls: [
      { id: '1', weight: '14.20' },
      { id: '2', weight: '15.50' },
      { id: '3', weight: '13.80' },
      { id: '4', weight: '14.90' },
      { id: '5', weight: '16.10' }
    ]
  };

  const activeSettings = {
    general: { factoryName, phone, logoUrl, fontFamily, lineWidthFree, lineWidthTable },
    prepCard: { title: prepTitle, notes: prepNotes },
    mgmtOrder: { title: mgmtTitle, notes: mgmtNotes },
    workOrder: { title: workTitle, notes: workNotes }
  };

  let previewHtml = '';
  if (previewType === 'mgmt') {
    previewHtml = PrintTemplates.orderManagement(mockOrder, mockFormDetails, activeSettings);
  } else if (previewType === 'work') {
    previewHtml = PrintTemplates.orderWork(mockOrder, mockFormDetails, activeSettings);
  } else if (previewType === 'prep') {
    previewHtml = PrintTemplates.preparationCard(mockReadyOrder, activeSettings);
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div className="spinner"></div>
        <p>جاري تحميل إعدادات الطباعة من السيرفر...</p>
      </div>
    );
  }

  return (
    <div className="print-settings-dashboard">
      {/* Settings Form */}
      <div className="settings-controls-pane">
        <h3>تخصيص تصاميم المطبوعات</h3>
        {success && <div className="success-banner">{success}</div>}
        {error && <div className="error-banner">{error}</div>}

        <div className="accordion-menu" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
          {/* Section: General */}
          <div className={`accordion-item ${activeSection === 'general' ? 'open' : ''}`} style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px' }}>
            <div 
              style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', fontWeight: 'bold' }} 
              onClick={() => setActiveSection('general')}
            >
              ⚙️ الإعدادات العامة والخطوط
            </div>
            {activeSection === 'general' && (
              <div style={{ padding: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label>اسم المصنع أو الشركة الرئيسي</label>
                  <input type="text" value={factoryName} onChange={(e) => setFactoryName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>رقم الاتصال للمطبوعات</label>
                  <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>رابط الشعار أو شعار النص</label>
                  <input type="text" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="رابط URL لشعار الشركة (اختياري)" />
                </div>
                <div className="form-group">
                  <label>نوع الخط المعتمد للطباعة</label>
                  <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
                    <option value="Tahoma">Tahoma (موصى به للغة العربية)</option>
                    <option value="Segoe UI">Segoe UI</option>
                    <option value="Arial">Arial</option>
                    <option value="Courier New">Courier New (أحادي المسافة)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>عرض خطوط الفواصل الحرة (بكسل)</label>
                  <input type="number" min="1" max="10" value={lineWidthFree} onChange={(e) => setLineWidthFree(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>عرض خطوط الجداول والشبكة (بكسل)</label>
                  <input type="number" min="1" max="10" value={lineWidthTable} onChange={(e) => setLineWidthTable(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          {/* Section: Prep Card */}
          <div className={`accordion-item ${activeSection === 'prep' ? 'open' : ''}`} style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px' }}>
            <div 
              style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', fontWeight: 'bold' }} 
              onClick={() => setActiveSection('prep')}
            >
              🖨️ إعدادات بطاقة تجهيز رولات
            </div>
            {activeSection === 'prep' && (
              <div style={{ padding: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label>عنوان بطاقة التجهيز الرئيسي</label>
                  <input type="text" value={prepTitle} onChange={(e) => setPrepTitle(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>ملاحظة تذييل بطاقة التجهيز</label>
                  <input type="text" value={prepNotes} onChange={(e) => setPrepNotes(e.target.value)} placeholder="ملاحظة أسفل الكارت (اختياري)" />
                </div>
              </div>
            )}
          </div>

          {/* Section: Mgmt Order */}
          <div className={`accordion-item ${activeSection === 'mgmt' ? 'open' : ''}`} style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px' }}>
            <div 
              style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', fontWeight: 'bold' }} 
              onClick={() => setActiveSection('mgmt')}
            >
              📄 إعدادات طلبية الإدارة
            </div>
            {activeSection === 'mgmt' && (
              <div style={{ padding: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label>عنوان مستند الإدارة الرئيسي</label>
                  <input type="text" value={mgmtTitle} onChange={(e) => setMgmtTitle(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>ملاحظة تذييل مستند الإدارة</label>
                  <input type="text" value={mgmtNotes} onChange={(e) => setMgmtNotes(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          {/* Section: Work Order */}
          <div className={`accordion-item ${activeSection === 'work' ? 'open' : ''}`} style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px' }}>
            <div 
              style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', fontWeight: 'bold' }} 
              onClick={() => setActiveSection('work')}
            >
              🛠️ إعدادات أمر تشغيل الورشة
            </div>
            {activeSection === 'work' && (
              <div style={{ padding: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label>عنوان أمر التشغيل الرئيسي</label>
                  <input type="text" value={workTitle} onChange={(e) => setWorkTitle(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>ملاحظة تحذير وتوجيه الفنيين</label>
                  <textarea value={workNotes} onChange={(e) => setWorkNotes(e.target.value)} rows="3" style={{ background: '#111', color: '#fff', border: '1px solid #333', padding: '8px', borderRadius: '4px' }}></textarea>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <button type="button" onClick={handleSave} className="btn btn-primary" disabled={saving}>
            {saving ? 'جاري الحفظ على السيرفر...' : '💾 حفظ جميع الإعدادات'}
          </button>
        </div>
      </div>

      {/* Live Preview Panel */}
      <div className="settings-preview-pane">
        <h3>👀 معاينة حية للمطبوعات</h3>
        <div className="preview-selector-tabs">
          <button 
            type="button" 
            className={`btn btn-small ${previewType === 'mgmt' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setPreviewType('mgmt')}
          >
            طلبية الإدارة
          </button>
          <button 
            type="button" 
            className={`btn btn-small ${previewType === 'work' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setPreviewType('work')}
          >
            أمر الورشة
          </button>
          <button 
            type="button" 
            className={`btn btn-small ${previewType === 'prep' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setPreviewType('prep')}
          >
            بطاقة التجهيز (A5)
          </button>
        </div>
        <div className="preview-frame-wrapper">
          <iframe
            title="Live print template preview"
            srcDoc={previewHtml}
            className="preview-iframe"
          />
        </div>
      </div>
    </div>
  );
}


