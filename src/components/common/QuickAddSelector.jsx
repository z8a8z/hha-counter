import { useState } from 'react';

/**
 * QuickAddSelector – wraps a dropdown select with a '+' button for in-line addition.
 * 
 * Props:
 * @param {string|number} value - The selected value
 * @param {function} onChange - Selection change handler
 * @param {Array} options - Options list, e.g., [{ id: 1, label: '50' }]
 * @param {function} onAdd - Async function to add new lookup value: (val) => Promise<id>
 * @param {string} label - Friendly name for input dialog (e.g., 'عرض رول')
 * @param {string} placeholder - Placeholder option (e.g. '-- اختر العرض --')
 * @param {boolean} isNumeric - Restricts input field to numbers
 */
export default function QuickAddSelector({
  value,
  onChange,
  options = [],
  onAdd,
  label = 'عنصر',
  placeholder = '-- اختر --',
  isNumeric = false,
  required = false
}) {
  const [showModal, setShowModal] = useState(false);
  const [newValue, setNewValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleOpen = () => {
    setNewValue('');
    setError('');
    setShowModal(true);
  };

  const handleClose = () => {
    if (!saving) {
      setShowModal(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const trimmed = newValue.trim();
    if (!trimmed) return;

    setSaving(true);
    setError('');

    try {
      const newId = await onAdd(trimmed);
      setSaving(false);
      setShowModal(false);
      if (newId) {
        // Automatically select the newly added item
        onChange(newId);
      }
    } catch (err) {
      setSaving(false);
      setError(err.message || 'فشلت عملية الإضافة');
    }
  };

  return (
    <div className="quick-add-selector-wrapper" style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        style={{ flex: 1 }}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="btn btn-outline"
        onClick={handleOpen}
        style={{
          padding: '0 0.75rem',
          fontSize: '1.2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '40px',
          height: '42px',
          lineHeight: '42px'
        }}
        title={`إضافة ${label} جديد`}
      >
        +
      </button>

      {showModal && (
        <div className="form-overlay" onClick={handleClose} style={{ zIndex: 1100 }}>
          <div className="form-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <h3>إضافة {label} جديد</h3>
            {error && <div className="error-banner" style={{ margin: '0.5rem 0' }}>{error}</div>}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
              <div className="form-group">
                <label>اسم أو قيمة الـ {label}</label>
                <input
                  type="text"
                  inputMode={isNumeric ? 'decimal' : undefined}
                  autoFocus
                  required
                  value={newValue}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewValue(isNumeric ? val.replace(/[^0-9.]/g, '') : val);
                  }}
                  placeholder={`أدخل ${label} الجديد`}
                />
              </div>

              <div className="modal-actions" style={{ gap: '0.5rem', display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'جاري الحفظ...' : 'حفظ'}
                </button>
                <button type="button" className="btn btn-outline" onClick={handleClose} disabled={saving}>
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
