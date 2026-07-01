import { useState, useEffect, useRef } from 'react';
import {
  getRollWidths, addRollWidth, deleteRollWidth,
  getRollTypes, addRollType, deleteRollType,
  getRollThicknesses, addRollThickness, deleteRollThickness,
  getPipeLengths, addPipeLength, deletePipeLength,
  getLiquidTypes, addLiquidType, deleteLiquidType,
  getLiquidVolumes, addLiquidVolume, deleteLiquidVolume,
  getInkCompanies, addInkCompany, deleteInkCompany,
  getInkColors, addInkColor, deleteInkColor,
  getInkWeights, addInkWeight, deleteInkWeight,
  getGlueTypes, addGlueType, deleteGlueType,
  getGlueWeights, addGlueWeight, deleteGlueWeight,
  getPurchaseOffices, addPurchaseOffice, deletePurchaseOffice
} from '../../lib/database.js';

/**
 * VariationManager – manages lookup/category values for the storage system.
 *
 * @param {string} entity - One of:
 *   'roll_widths', 'roll_types', 'pipe_lengths',
 *   'liquid_types', 'ink_companies', 'ink_colors', 'ink_weights',
 *   'purchase_offices'
 */
export default function VariationManager({ entity }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [newValue, setNewValue] = useState('');

  const hasFetched = useRef(false);

  const config = getEntityConfig(entity);

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    const { data, error: err } = await config.getItems();
    setLoading(false);
    if (err) setError(err);
    else setItems(data || []);
  };

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchItems();
    }
  }, [entity]);

  const handleAdd = async () => {
    setError('');
    setSuccessMsg('');
    const { error: err } = await config.addItem(newValue);
    if (err) { setError(err); return; }
    setSuccessMsg('تمت الإضافة بنجاح!');
    setNewValue('');
    fetchItems();
  };

  const handleDelete = async (id) => {
    if (!config.deleteItem) return;
    setError('');
    setSuccessMsg('');
    const { error: err } = await config.deleteItem(id);
    if (err) { setError(err); return; }
    setSuccessMsg('تم الحذف بنجاح!');
    fetchItems();
  };

  if (loading) {
    return <div className="storage-loading"><div className="spinner"></div><p>جاري التحميل...</p></div>;
  }

  return (
    <div className="variation-manager">
      {error && <div className="error-banner">{error}</div>}
      {successMsg && <div className="success-banner">{successMsg}</div>}

      <div className="variation-add-row">
        <div className="lookup-form-row">
          <input
            type="text"
            inputMode={config.isNumeric ? 'decimal' : undefined}
            placeholder={config.placeholder}
            value={newValue}
            onChange={(e) => {
              const val = e.target.value;
              setNewValue(config.isNumeric ? val.replace(/[^0-9.]/g, '') : val);
            }}
          />
          <button className="btn btn-primary btn-small" onClick={handleAdd}>+</button>
        </div>
      </div>

      <div className="variation-list">
        {items.length === 0 ? (
          <div className="empty-state">لا توجد عناصر بعد</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{config.columnLabel}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{config.renderItem(item)}</td>
                  <td>
                    {config.deleteItem && (
                      <button
                        className="btn btn-small btn-outline"
                        onClick={() => handleDelete(item.id)}
                      >
                        حذف
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ── Entity Configuration ────────────────────────────── */

function getEntityConfig(entity) {
  switch (entity) {
    case 'roll_widths':
      return {
        getItems: getRollWidths,
        addItem: async (width) => {
          if (!width) return { error: 'الرجاء إدخال العرض' };
          return addRollWidth(width);
        },
        deleteItem: deleteRollWidth,
        isNumeric: true,
        columnLabel: 'العرض (cm)',
        placeholder: 'عرض جديد (cm)',
        renderItem: (item) => <span className="mono">{item.width} cm</span>
      };

    case 'roll_types':
      return {
        getItems: getRollTypes,
        addItem: async (name) => {
          if (!name.trim()) return { error: 'الرجاء إدخال اسم النوع' };
          return addRollType(name);
        },
        deleteItem: deleteRollType,
        columnLabel: 'النوع',
        placeholder: 'اسم نوع جديد',
        renderItem: (item) => item.name
      };

    case 'roll_thicknesses':
      return {
        getItems: getRollThicknesses,
        addItem: async (thickness) => {
          if (!thickness) return { error: 'الرجاء إدخال السماكة' };
          return addRollThickness(thickness);
        },
        deleteItem: deleteRollThickness,
        isNumeric: true,
        columnLabel: 'السماكة / الميكرون',
        placeholder: 'سماكة جديدة',
        renderItem: (item) => <span className="mono">{item.thickness}</span>
      };

    case 'pipe_lengths':
      return {
        getItems: getPipeLengths,
        addItem: async (length) => {
          if (!length) return { error: 'الرجاء إدخال الطول' };
          return addPipeLength(length);
        },
        deleteItem: deletePipeLength,
        isNumeric: true,
        columnLabel: 'الطول (cm)',
        placeholder: 'طول جديد (cm)',
        renderItem: (item) => <span className="mono">{item.length} cm</span>
      };

    case 'liquid_types':
      return {
        getItems: getLiquidTypes,
        addItem: async (name) => {
          if (!name.trim()) return { error: 'الرجاء إدخال اسم السائل' };
          return addLiquidType(name);
        },
        deleteItem: deleteLiquidType,
        columnLabel: 'النوع',
        placeholder: 'نوع سائل جديد',
        renderItem: (item) => item.name
      };

    case 'liquid_volumes':
      return {
        getItems: getLiquidVolumes,
        addItem: async (volume) => {
          if (!volume) return { error: 'الرجاء إدخال الحجم' };
          return addLiquidVolume(volume);
        },
        deleteItem: deleteLiquidVolume,
        isNumeric: true,
        columnLabel: 'الحجم (L)',
        placeholder: 'حجم برميل جديد (L)',
        renderItem: (item) => <span className="mono">{item.volume} L</span>
      };

    case 'ink_companies':
      return {
        getItems: getInkCompanies,
        addItem: async (name) => {
          if (!name.trim()) return { error: 'الرجاء إدخال اسم الشركة' };
          return addInkCompany(name);
        },
        deleteItem: deleteInkCompany,
        columnLabel: 'الشركة',
        placeholder: 'اسم شركة جديد',
        renderItem: (item) => item.name
      };

    case 'ink_colors':
      return {
        getItems: getInkColors,
        addItem: async (name) => {
          if (!name.trim()) return { error: 'الرجاء إدخال اسم اللون' };
          return addInkColor(name);
        },
        deleteItem: deleteInkColor,
        columnLabel: 'اللون',
        placeholder: 'اسم لون جديد',
        renderItem: (item) => item.name
      };

    case 'ink_weights':
      return {
        getItems: getInkWeights,
        addItem: async (weight) => {
          if (!weight) return { error: 'الرجاء إدخال الوزن' };
          return addInkWeight(weight);
        },
        deleteItem: deleteInkWeight,
        isNumeric: true,
        columnLabel: 'الوزن (kg)',
        placeholder: 'وزن برميل جديد (kg)',
        renderItem: (item) => <span className="mono">{item.weight} kg</span>
      };

    case 'glue_types':
      return {
        getItems: getGlueTypes,
        addItem: async (name) => {
          if (!name.trim()) return { error: 'الرجاء إدخال اسم الصمغ' };
          return addGlueType(name);
        },
        deleteItem: deleteGlueType,
        columnLabel: 'نوع الصمغ',
        placeholder: 'نوع صمغ جديد',
        renderItem: (item) => item.name
      };

    case 'glue_weights':
      return {
        getItems: getGlueWeights,
        addItem: async (weight) => {
          if (!weight) return { error: 'الرجاء إدخال الوزن' };
          return addGlueWeight(weight);
        },
        deleteItem: deleteGlueWeight,
        isNumeric: true,
        columnLabel: 'الوزن (kg)',
        placeholder: 'وزن برميل صمغ جديد (kg)',
        renderItem: (item) => <span className="mono">{item.weight} kg</span>
      };

    case 'purchase_offices':
      return {
        getItems: getPurchaseOffices,
        addItem: async (name) => {
          if (!name.trim()) return { error: 'الرجاء إدخال اسم المكتب' };
          return addPurchaseOffice(name);
        },
        deleteItem: deletePurchaseOffice,
        columnLabel: 'المكتب',
        placeholder: 'اسم مكتب جديد',
        renderItem: (item) => item.name
      };

    default:
      return {
        getItems: async () => ({ data: [], error: null }),
        addItem: async () => ({ error: 'Unknown entity' }),
        deleteItem: null,
        columnLabel: '',
        placeholder: '',
        renderItem: () => ''
      };
  }
}