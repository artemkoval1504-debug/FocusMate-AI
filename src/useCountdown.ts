import { useCallback, useEffect, useRef, useState } from 'react';

export function useCountdown(minutes: number) {
  const totalSeconds = minutes * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const tick = useCallback(() => {
    setSecondsLeft((s) => {
      if (s <= 1) {
        setRunning(false);
        return 0;
      }
      return s - 1;
    });
  }, []);

  useEffect(() => {
    if (running) {
      intervalRef.current = window.setInterval(tick, 1000);
    } else if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [running, tick]);

  const start = useCallback(() => setRunning(true), []);
  const pause = useCallback(() => setRunning(false), []);
  const toggle = useCallback(() => setRunning((r) => !r), []);
  const reset = useCallback(() => {
    setRunning(false);
    setSecondsLeft(totalSeconds);
  }, [totalSeconds]);

  const mm = Math.floor(secondsLeft / 60);
  const ss = secondsLeft % 60;
  const display = `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  const progress = totalSeconds === 0 ? 0 : 1 - secondsLeft / totalSeconds;
  const finished = secondsLeft === 0;

  return { secondsLeft, display, progress, finished, running, start, pause, toggle, reset };
}
