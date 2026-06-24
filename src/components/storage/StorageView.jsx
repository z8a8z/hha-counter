import { useState, useEffect, useRef } from 'react';
import {
  getRolls, getRollWidths, getRollTypes,
  getPipes, getPipeLengths,
  getLiquids, getLiquidTypes,
  getInks, getInkCompanies, getInkColors
} from '../../lib/database.js';

const storageTabs = [
  { id: 'rolls', label: 'رولات' },
  { id: 'pipes', label: 'مواسير' },
  { id: 'liquids', label: 'سوائل' },
  { id: 'inks', label: 'أحبار' }
];

export default function StorageView() {
  const [activeTab, setActiveTab] = useState('rolls');

  return (
    <div className="storage-dashboard">
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

      <div className="storage-tab-content">
        {activeTab === 'rolls' && <ViewRolls />}
        {activeTab === 'pipes' && <ViewPipes />}
        {activeTab === 'liquids' && <ViewLiquids />}
        {activeTab === 'inks' && <ViewInks />}
      </div>
    </div>
  );
}

/* ── Stats Bar ───────────────────────────────────────── */

function StatsBar({ totalItems, totalQuantity, label }) {
  return (
    <div className="storage-stats-bar">
      <div className="stat-item">
        <span className="stat-label">الأنواع</span>
        <span className="stat-value">{totalItems}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">الإجمالي</span>
        <span className="stat-value mono">{totalQuantity}</span>
        <span className="stat-unit">{label}</span>
      </div>
    </div>
  );
}

/* ── Rolls View ──────────────────────────────────────── */

function ViewRolls() {
  const [items, setItems] = useState([]);
  const [widths, setWidths] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const hasFetched = useRef(false);

  const fetchAll = async () => {
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
  };

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchAll();
    }
  }, []);

  if (loading && items.length === 0) {
    return <div className="storage-loading"><div className="spinner"></div><p>جاري تحميل الرولات...</p></div>;
  }

  const totalWeight = items.reduce((sum, i) => sum + (parseFloat(i.weight) || 0), 0);

  return (
    <div className="storage-view-entity">
      {error && <div className="error-banner">{error}</div>}

      <StatsBar totalItems={items.length} totalQuantity={totalWeight.toFixed(2)} label="kg" />

      <div className="storage-view-panel">
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
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td><span className="mono">#{item.id}</span></td>
                    <td><span className="mono">{item.width_label}</span></td>
                    <td>{item.type_name}</td>
                    <td><strong className="mono">{item.weight}</strong></td>
                    <td className="notes-cell">{item.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="storage-lookups-info">
        <div className="lookup-info-card">
          <h4>العروض المتاحة</h4>
          <div className="lookup-tags">
            {widths.map((w) => (
              <span key={w.id} className="lookup-tag">{w.width} cm</span>
            ))}
          </div>
        </div>
        <div className="lookup-info-card">
          <h4>الأنواع المتاحة</h4>
          <div className="lookup-tags">
            {types.map((t) => (
              <span key={t.id} className="lookup-tag">{t.name}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Pipes View ──────────────────────────────────────── */

function ViewPipes() {
  const [items, setItems] = useState([]);
  const [lengths, setLengths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const hasFetched = useRef(false);

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    const [itemsRes, lengthsRes] = await Promise.all([getPipes(), getPipeLengths()]);
    setLoading(false);
    if (itemsRes.error) setError(itemsRes.error);
    else setItems(itemsRes.data || []);
    if (lengthsRes.error) setError((prev) => prev || lengthsRes.error);
    else setLengths(lengthsRes.data || []);
  };

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchAll();
    }
  }, []);

  if (loading && items.length === 0) {
    return <div className="storage-loading"><div className="spinner"></div><p>جاري تحميل المواسير...</p></div>;
  }

  const activeItems = items.filter(i => (parseFloat(i.quantity) || 0) > 0);
  const totalQuantity = activeItems.reduce((sum, i) => sum + (parseFloat(i.quantity) || 0), 0);

  return (
    <div className="storage-view-entity">
      {error && <div className="error-banner">{error}</div>}

      <StatsBar totalItems={activeItems.length} totalQuantity={totalQuantity} label="pcs" />

      <div className="storage-view-panel">
        <h3>مواسير المخزن ({activeItems.length})</h3>
        {activeItems.length === 0 ? (
          <div className="empty-state">لا توجد مواسير مسجلة بعد</div>
        ) : (
          <div className="storage-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>الطول</th>
                  <th>الكمية</th>
                  <th>ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {activeItems.map((item) => (
                  <tr key={item.id}>
                    <td><span className="mono">{item.length_label}</span></td>
                    <td><strong>{item.quantity}</strong></td>
                    <td className="notes-cell">{item.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="storage-lookups-info">
        <div className="lookup-info-card">
          <h4>الأطوال المتاحة</h4>
          <div className="lookup-tags">
            {lengths.map((l) => (
              <span key={l.id} className="lookup-tag">{l.length} cm</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Liquids View ────────────────────────────────────── */

function ViewLiquids() {
  const [items, setItems] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const hasFetched = useRef(false);

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    const [itemsRes, typesRes] = await Promise.all([getLiquids(), getLiquidTypes()]);
    setLoading(false);
    if (itemsRes.error) setError(itemsRes.error);
    else setItems(itemsRes.data || []);
    if (typesRes.error) setError((prev) => prev || typesRes.error);
    else setTypes(typesRes.data || []);
  };

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchAll();
    }
  }, []);

  if (loading && items.length === 0) {
    return <div className="storage-loading"><div className="spinner"></div><p>جاري تحميل السوائل...</p></div>;
  }

  const activeItems = items.filter(i => (parseFloat(i.quantity) || 0) > 0);
  const totalQuantity = activeItems.reduce((sum, i) => sum + (parseFloat(i.quantity) || 0), 0);

  return (
    <div className="storage-view-entity">
      {error && <div className="error-banner">{error}</div>}

      <StatsBar totalItems={activeItems.length} totalQuantity={totalQuantity.toFixed(2)} label="liter" />

      <div className="storage-view-panel">
        <h3>سوائل المخزن ({activeItems.length})</h3>
        {activeItems.length === 0 ? (
          <div className="empty-state">لا توجد سوائل مسجلة بعد</div>
        ) : (
          <div className="storage-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>النوع</th>
                  <th>الكمية</th>
                  <th>الوحدة</th>
                  <th>ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {activeItems.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.type_name}</strong></td>
                    <td><span className="mono">{item.quantity}</span></td>
                    <td>{item.unit}</td>
                    <td className="notes-cell">{item.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="storage-lookups-info">
        <div className="lookup-info-card">
          <h4>الأنواع المتاحة</h4>
          <div className="lookup-tags">
            {types.map((t) => (
              <span key={t.id} className="lookup-tag">{t.name}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Inks View ───────────────────────────────────────── */

function ViewInks() {
  const [items, setItems] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const hasFetched = useRef(false);

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    const [itemsRes, companiesRes, colorsRes] = await Promise.all([
      getInks(), getInkCompanies(), getInkColors()
    ]);
    setLoading(false);
    if (itemsRes.error) setError(itemsRes.error);
    else setItems(itemsRes.data || []);
    if (companiesRes.error) setError((prev) => prev || companiesRes.error);
    else setCompanies(companiesRes.data || []);
    if (colorsRes.error) setError((prev) => prev || colorsRes.error);
    else setColors(colorsRes.data || []);
  };

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchAll();
    }
  }, []);

  if (loading && items.length === 0) {
    return <div className="storage-loading"><div className="spinner"></div><p>جاري تحميل الأحبار...</p></div>;
  }

  const activeItems = items.filter(i => (parseFloat(i.quantity) || 0) > 0);
  const totalQuantity = activeItems.reduce((sum, i) => sum + (parseFloat(i.quantity) || 0), 0);

  return (
    <div className="storage-view-entity">
      {error && <div className="error-banner">{error}</div>}

      <StatsBar totalItems={activeItems.length} totalQuantity={totalQuantity.toFixed(2)} label="kg" />

      <div className="storage-view-panel">
        <h3>أحبار المخزن ({activeItems.length})</h3>
        {activeItems.length === 0 ? (
          <div className="empty-state">لا توجد أحبار مسجلة بعد</div>
        ) : (
          <div className="storage-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>الشركة</th>
                  <th>اللون</th>
                  <th>الكمية (كجم)</th>
                  <th>ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {activeItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.company_name}</td>
                    <td>{item.color_name}</td>
                    <td><strong className="mono">{item.quantity}</strong></td>
                    <td className="notes-cell">{item.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="storage-lookups-info">
        <div className="lookup-info-card">
          <h4>الشركات</h4>
          <div className="lookup-tags">
            {companies.map((c) => (
              <span key={c.id} className="lookup-tag">{c.name}</span>
            ))}
          </div>
        </div>
        <div className="lookup-info-card">
          <h4>الألوان</h4>
          <div className="lookup-tags">
            {colors.map((c) => (
              <span key={c.id} className="lookup-tag">{c.name}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
