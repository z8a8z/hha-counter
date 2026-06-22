/**
 * useStorage – Unified hook for factory storage entities
 *
 * Provides fetch, add-lookup, upsert-inventory, and delete helpers
 * for rolls, pipes, liquids, and inks.
 */
import { useState, useCallback } from 'react';

/**
 * Creates a storage hook for one entity type.
 *
 * @param {object} api - Object with all the CRUD functions for this entity
 *   Expected shape: { getItems, getLookups, addLookup, upsertItem, deleteItem, deleteLookup? }
 */
export function useStorageEntity(api) {
  const [items, setItems] = useState([]);
  const [lookups, setLookups] = useState([]);   // dimensions/types/lengths/companies/colors
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    const [itemsRes, lookupsRes] = await Promise.all([
      api.getItems(),
      api.getLookups ? api.getLookups() : Promise.resolve({ data: null, error: null })
    ]);
    setLoading(false);

    if (itemsRes.error) {
      setError(itemsRes.error);
    } else {
      setItems(itemsRes.data || []);
    }
    if (lookupsRes.error) {
      setError((prev) => prev || lookupsRes.error);
    } else {
      setLookups(lookupsRes.data || []);
    }
  }, [api]);

  const clearMessages = () => { setError(''); setSuccessMsg(''); };

  const addLookup = async (...args) => {
    clearMessages();
    const { error: err } = await api.addLookup(...args);
    if (err) { setError(err); return false; }
    await fetchAll();
    return true;
  };

  const upsertItem = async (...args) => {
    clearMessages();
    const { error: err } = await api.upsertItem(...args);
    if (err) { setError(err); return false; }
    setSuccessMsg('تم الحفظ بنجاح!');
    await fetchAll();
    return true;
  };

  const deleteItem = async (id, confirmMsg) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    clearMessages();
    const { error: err } = await api.deleteItem(id);
    if (err) { setError(err); return false; }
    setSuccessMsg('تم الحذف بنجاح!');
    await fetchAll();
    return true;
  };

  const deleteLookup = async (id, confirmMsg) => {
    if (!api.deleteLookup) return;
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    clearMessages();
    const { error: err } = await api.deleteLookup(id);
    if (err) { setError(err); return false; }
    setSuccessMsg('تم الحذف بنجاح!');
    await fetchAll();
    return true;
  };

  return {
    items, lookups, loading, error, successMsg,
    fetchAll, addLookup, upsertItem, deleteItem, deleteLookup,
    clearMessages
  };
}
