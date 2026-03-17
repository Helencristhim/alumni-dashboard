'use client';

import { useEffect, useRef, useCallback } from 'react';

interface UseAutoSaveOptions {
  data: unknown;
  onSave: () => Promise<void>;
  interval?: number; // ms, default 10000 (10s)
  enabled?: boolean;
}

export function useAutoSave({ data, onSave, interval = 10000, enabled = true }: UseAutoSaveOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirtyRef = useRef(false);
  const savingRef = useRef(false);
  const lastDataRef = useRef<string>('');

  // Track changes
  useEffect(() => {
    const serialized = JSON.stringify(data);
    if (serialized !== lastDataRef.current) {
      isDirtyRef.current = true;
      lastDataRef.current = serialized;
    }
  }, [data]);

  const save = useCallback(async () => {
    if (!isDirtyRef.current || savingRef.current) return;

    savingRef.current = true;
    try {
      await onSave();
      isDirtyRef.current = false;
    } catch (err) {
      console.error('Autosave failed:', err);
    } finally {
      savingRef.current = false;
    }
  }, [onSave]);

  // Set up interval
  useEffect(() => {
    if (!enabled) return;

    timerRef.current = setInterval(save, interval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [save, interval, enabled]);

  return { save, isDirty: isDirtyRef.current };
}
