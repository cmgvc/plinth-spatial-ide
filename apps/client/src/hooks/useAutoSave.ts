import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { updateNodeCode } from '../stores/fileSlice';

export function useAutoSave(id: string, code: string, delay = 800) {
  const dispatch = useDispatch();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      dispatch(updateNodeCode({ id, code }));
      console.log(`Saved ${id} to Redux`);
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [code, id, dispatch, delay]);
}