/**
 * useCounter Hook
 *
 * Manages counter state, syncing with Supabase.
 * Exposes: value, loading, error, increment, refresh
 *
 * Error states are surfaced clearly so the UI can show what went wrong.
 */

import { useState, useEffect, useCallback } from 'react';
import { getCounterValue, initCounterRow, updateCounterValue } from '../lib/database.js';
import { debug } from '../lib/debug.js';

const MODULE = 'useCounter';

export function useCounter() {
  const [value, setValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  /** Fetch current value from DB and init the row if needed */
  const refresh = useCallback(async () => {
    debug.log(MODULE, 'Refreshing counter value…');
    setLoading(true);
    setError(null);

    // 1. Ensure the counter row exists
    const initResult = await initCounterRow();
    if (initResult.error) {
      setError(`DB init failed: ${initResult.error}`);
      setLoading(false);
      return;
    }

    // 2. Fetch current value
    const { data, error: fetchError } = await getCounterValue();
    if (fetchError) {
      setError(`Failed to load counter: ${fetchError}`);
      setLoading(false);
      return;
    }

    setValue(data ?? 0);
    setLoading(false);
    debug.log(MODULE, 'Counter refreshed', { value: data });
  }, []);

  /** Increment counter by 1 and persist to DB */
  const increment = useCallback(async () => {
    const newValue = value + 1;

    // Optimistic update – show new value immediately
    setValue(newValue);
    setSaving(true);
    setError(null);

    debug.log(MODULE, 'Incrementing counter', { from: value, to: newValue });

    const { error: updateError } = await updateCounterValue(newValue);

    if (updateError) {
      // Rollback on failure
      setValue(value);
      setError(`Failed to save: ${updateError}`);
      debug.error(MODULE, 'Increment failed, rolled back', { updateError });
    }

    setSaving(false);
  }, [value]);

  // Load initial value on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  return { value, loading, error, saving, increment, refresh };
}