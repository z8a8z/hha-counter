import { useState, useEffect, useCallback } from 'react';
import { getStorageSummary } from '../../lib/database.js';

const storageTabs = [
  { id: 'rolls', label: 'رولات خام', icon: 'رولات' },
  { id: 'inks', label: 'أحبار', icon: 'أحبار' },
  { id: 'liquids', label: 'سوائل', icon: 'سوائل' },
  { id: 'glues', label: 'صمغ', icon: 'صمغ' },
  { id: 'pipes', label: 'مواسير', icon: 'مواسير' }
];

export default function StorageView() {
  const [activeTab, setActiveTab] = useState('rolls');
  const [duration, setDuration] = useState('all'); // 'all', 'week', 'month', 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError('');
    let durParam = duration;
    if (duration === 'custom') {
      if (!startDate || !endDate) {
        setLoading(false);
        return;
      }
      durParam = { start: startDate, end: endDate };
    }

    const { data, error: err } = await getStorageSummary(durParam);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      setSummaryData(data);
    }
  }, [duration, startDate, endDate]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleCustomApply = (e) => {
    e.preventDefault();
    fetchSummary();
  };

  if (loading && !summaryData) {
    return <div className="storage-loading"><div className="spinner"></div><p>جاري تحميل بيانات الجرد والمخزن...</p></div>;
  }

  return (
    <div className="storage-view-dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Duration Control Panel */}
      <div className="card duration-filter-card" style={{ padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>📅 فترة حساب الوارد والمستهلك:</span>
            <div className="btn-group" style={{ display: 'flex', gap: '0.35rem' }}>
              <button
                type="button"
                className={`btn btn-small ${duration === 'all' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setDuration('all')}
              >
                الكل (All Time)
              </button>
              <button
                type="button"
                className={`btn btn-small ${duration === 'week' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setDuration('week')}
              >
                آخر أسبوع
              </button>
              <button
                type="button"
                className={`btn btn-small ${duration === 'month' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setDuration('month')}
              >
                آخر شهر
              </button>
              <button
                type="button"
                className={`btn btn-small ${duration === 'custom' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setDuration('custom')}
              >
                فترة مخصصة
              </button>
            </div>
          </div>

          {duration === 'custom' && (
            <form onSubmit={handleCustomApply} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                style={{ padding: '0.25rem 0.5rem', height: '34px', fontSize: '0.9rem' }}
              />
              <span style={{ fontSize: '0.85rem' }}>إلى</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                style={{ padding: '0.25rem 0.5rem', height: '34px', fontSize: '0.9rem' }}
              />
              <button type="submit" className="btn btn-small btn-primary" style={{ padding: '0 0.75rem', height: '34px' }}>تطبيق</button>
            </form>
          )}
        </div>
        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          * ملاحظة: الفلتر الزمني يؤثر على الكميات المستلمة والمستخدمة فقط، أما الباقي/المتاح فهو دائم وتراكمي لجميع الأوقات.
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Main Inventory Tabs */}
      <div className="storage-tabs-header">
        {storageTabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="storage-tab-content">
        {summaryData && (
          <>
            {activeTab === 'rolls' && <RollsInventoryView data={summaryData.rolls} />}
            {activeTab === 'inks' && <InksInventoryView data={summaryData.inks} />}
            {activeTab === 'liquids' && <LiquidsInventoryView data={summaryData.liquids} />}
            {activeTab === 'glues' && <GluesInventoryView data={summaryData.glues} />}
            {activeTab === 'pipes' && <PipesInventoryView data={summaryData.pipes} />}
          </>
        )}
      </div>

    </div>
  );
}

/* ===========================================================================
   A. ROLLS VIEW (رول خام)
   =========================================================================== */
function RollsInventoryView({ data = [] }) {
  // Vertically listed sections: متاليزا, شفاف opp, مات opp, PET, LDPE, CPP
  const sections = [
    { title: 'متاليزا', key: 'metallized', match: (t) => t.includes('متاليزا') || t.toLowerCase().includes('metallized') },
    { title: 'شفاف opp', key: 'transparent', match: (t) => t.toLowerCase().includes('شفاف') || t.toLowerCase().includes('transparent') },
    { title: 'مات opp', key: 'matt', match: (t) => t.toLowerCase().includes('مات') || t.toLowerCase().includes('matt') },
    { title: 'PET', key: 'pet', match: (t) => t.toLowerCase().includes('pet') },
    { title: 'LDPE', key: 'ldpe', match: (t) => t.toLowerCase().includes('ldpe') || t.toLowerCase().includes('pe') },
    { title: 'CPP', key: 'cpp', match: (t) => t.toLowerCase().includes('cpp') }
  ];

  const getRollSectionTitle = (typeName) => {
    const sec = sections.find(s => s.match(typeName));
    return sec ? sec.title : 'أخرى';
  };

  // Group items by section
  const grouped = {};
  sections.forEach(s => grouped[s.title] = []);
  grouped['أخرى'] = [];

  data.forEach(item => {
    const secTitle = getRollSectionTitle(item.type_name || '');
    grouped[secTitle].push(item);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {Object.entries(grouped).map(([sectionTitle, items]) => {
        if (items.length === 0) return null;
        return (
          <div key={sectionTitle} className="storage-view-panel" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary)', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              📁 قسم: {sectionTitle}
            </h3>
            <div className="storage-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>اسم المادة</th>
                    <th>الكمية المستلمة (kg)</th>
                    <th>الكمية المستخدمة (kg)</th>
                    <th>الباقي / المتاح (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.key}>
                      <td><strong>{item.name}</strong></td>
                      <td><span className="mono text-muted">{item.received?.toFixed(2) || '0.00'}</span></td>
                      <td><span className="mono text-muted">{item.used?.toFixed(2) || '0.00'}</span></td>
                      <td><span className="mono bold color-success" style={{ fontSize: '1.05rem', color: 'var(--primary)' }}>{item.available?.toFixed(2) || '0.00'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ===========================================================================
   B. INKS VIEW (أحبار)
   =========================================================================== */
function InksInventoryView({ data = [] }) {
  // Vertically listed sections: احبار عراق, احبار تركيا
  const sections = [
    { title: 'احبار عراق', match: (c) => c.includes('عراق') },
    { title: 'احبار تركيا', match: (c) => c.includes('تركيا') }
  ];

  const getInkSectionTitle = (companyName) => {
    const sec = sections.find(s => s.match(companyName));
    return sec ? sec.title : 'أخرى';
  };

  const grouped = {};
  sections.forEach(s => grouped[s.title] = []);
  grouped['أخرى'] = [];

  data.forEach(item => {
    const secTitle = getInkSectionTitle(item.company_name || '');
    grouped[secTitle].push(item);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {Object.entries(grouped).map(([sectionTitle, items]) => {
        if (items.length === 0) return null;
        return (
          <div key={sectionTitle} className="storage-view-panel" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary)', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              📁 قسم: {sectionTitle}
            </h3>
            <div className="storage-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>الشركة المصنعة</th>
                    <th>اللون</th>
                    <th>الكمية المستلمة (kg)</th>
                    <th>الكمية المستخدمة (kg)</th>
                    <th>الباقي / المتاح (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.key}>
                      <td>{item.company_name}</td>
                      <td><strong>{item.color_name}</strong></td>
                      <td><span className="mono text-muted">{item.received?.toFixed(2) || '0.00'}</span></td>
                      <td><span className="mono text-muted">{item.used?.toFixed(2) || '0.00'}</span></td>
                      <td><span className="mono bold" style={{ fontSize: '1.05rem', color: 'var(--primary)' }}>{item.available?.toFixed(2) || '0.00'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ===========================================================================
   C. LIQUIDS VIEW (سوائل)
   =========================================================================== */
function LiquidsInventoryView({ data = [] }) {
  // Vertically listed sections: كحول - العراق, كحول تركيا
  const sections = [
    { title: 'كحول - العراق', match: (t) => t.includes('عراق') || t.includes('العراق') },
    { title: 'كحول تركيا', match: (t) => t.includes('تركيا') }
  ];

  const getLiquidSectionTitle = (typeName) => {
    const sec = sections.find(s => s.match(typeName));
    return sec ? sec.title : 'أخرى';
  };

  const grouped = {};
  sections.forEach(s => grouped[s.title] = []);
  grouped['أخرى'] = [];

  data.forEach(item => {
    const secTitle = getLiquidSectionTitle(item.name || '');
    grouped[secTitle].push(item);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {Object.entries(grouped).map(([sectionTitle, items]) => {
        if (items.length === 0) return null;
        return (
          <div key={sectionTitle} className="storage-view-panel" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary)', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              📁 قسم: {sectionTitle}
            </h3>
            <div className="storage-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>اسم المادة</th>
                    <th>الكمية المستلمة (L)</th>
                    <th>الكمية المستخدمة (L)</th>
                    <th>الباقي / المتاح (L)</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.key}>
                      <td><strong>{item.name}</strong></td>
                      <td><span className="mono text-muted">{item.received?.toFixed(2) || '0.00'}</span></td>
                      <td><span className="mono text-muted">{item.used?.toFixed(2) || '0.00'}</span></td>
                      <td><span className="mono bold" style={{ fontSize: '1.05rem', color: 'var(--primary)' }}>{item.available?.toFixed(2) || '0.00'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ===========================================================================
   D. GLUES VIEW (صمغ)
   =========================================================================== */
function GluesInventoryView({ data = [] }) {
  // Vertically listed sections: صمغ لامينيشن
  return (
    <div className="storage-view-panel" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary)', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
        📁 قسم: صمغ لامينيشن
      </h3>
      <div className="storage-table-wrap">
        <table>
          <thead>
            <tr>
              <th>اسم المادة</th>
              <th>الكمية المستلمة (kg)</th>
              <th>الكمية المستخدمة (kg)</th>
              <th>الباقي / المتاح (kg)</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.key}>
                <td><strong>{item.name}</strong></td>
                <td><span className="mono text-muted">{item.received?.toFixed(2) || '0.00'}</span></td>
                <td><span className="mono text-muted">{item.used?.toFixed(2) || '0.00'}</span></td>
                <td><span className="mono bold" style={{ fontSize: '1.05rem', color: 'var(--primary)' }}>{item.available?.toFixed(2) || '0.00'}</span></td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan="4" className="empty-state" style={{ textAlign: 'center', padding: '2rem 0' }}>لا يوجد صمغ مسجل حالياً</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ===========================================================================
   E. PIPES VIEW (مواسير)
   =========================================================================== */
function PipesInventoryView({ data = [] }) {
  // Vertically listed sections: ماسورة
  return (
    <div className="storage-view-panel" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary)', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
        📁 قسم: ماسورة
      </h3>
      <div className="storage-table-wrap">
        <table>
          <thead>
            <tr>
              <th>الطول</th>
              <th>العدد المستلم (قطعة)</th>
              <th>العدد المستخدم (قطعة)</th>
              <th>العدد المتبقي (قطعة)</th>
              <th>الوزن الكلي المتبقي (kg)</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.key}>
                <td><strong>{item.length} cm</strong></td>
                <td><span className="mono text-muted">{item.received}</span></td>
                <td><span className="mono text-muted">{item.used}</span></td>
                <td><span className="mono bold" style={{ fontSize: '1.05rem', color: 'var(--primary)' }}>{item.available}</span></td>
                <td><span className="mono bold color-info">{item.available_weight?.toFixed(2) || '0.00'} kg</span></td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan="5" className="empty-state" style={{ textAlign: 'center', padding: '2rem 0' }}>لا توجد مواسير مسجلة حالياً</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
