/**
 * /src/shared/hooks/useFormState.ts
 *
 * Simple form state management hook
 */

import { useState, useCallback } from 'react';

export function useFormState<T extends Record<string, unknown>>(initialState: T) {
  const [values, setValues] = useState(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setValue = useCallback((key: keyof T, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    // Clear error for this field when user starts typing
    if (errors[key as string]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key as string];
        return next;
      });
    }
  }, [errors]);

  const setError = useCallback((key: keyof T, message: string) => {
    setErrors((prev) => ({ ...prev, [key as string]: message }));
  }, []);

  const reset = useCallback(() => {
    setValues(initialState);
    setErrors({});
  }, [initialState]);

  return { values, errors, setValue, setError, reset, setValues, setErrors };
}
