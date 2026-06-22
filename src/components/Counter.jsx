/**
 * Counter Component
 *
 * Displays the current counter value and an "Add 1" button.
 * Shows loading, error, and saving states with clear messaging.
 */

import { useCounter } from '../hooks/useCounter.js';

export default function Counter() {
  const { value, loading, error, saving, increment, refresh } = useCounter();

  // ── Loading state ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="counter-card">
        <div className="spinner" />
        <p className="status-text">جاري الاتصال بقاعدة البيانات...</p>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────
  if (error) {
    return (
      <div className="counter-card error-card">
        <div className="error-icon">⚠️</div>
        <h3>حدث خطأ ما</h3>
        <p className="error-message">{error}</p>
        <div className="button-row">
          <button className="btn btn-retry" onClick={refresh}>
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  // ── Normal state ───────────────────────────────────────────
  return (
    <div className="counter-card">
      <div className="value-display">
        <span className="value-label">العدد</span>
        <span className="value-number">{value}</span>
      </div>

      <div className="button-row">
        <button
          className="btn btn-add"
          onClick={increment}
          disabled={saving}
        >
          {saving ? 'جاري الحفظ...' : '+ 1'}
        </button>
      </div>

      {saving && <p className="status-text">جاري الحفظ في قاعدة البيانات...</p>}
    </div>
  );
}
