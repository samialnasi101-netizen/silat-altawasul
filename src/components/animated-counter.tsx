'use client';

import { useEffect, useRef, useState } from 'react';

export function AnimatedCounter({
  value,
  duration = 1200,
  locale = 'ar-SA',
  suffix = '',
  className = '',
}: {
  value: number;
  duration?: number;
  locale?: string;
  suffix?: string;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const start = performance.now();
    const from = 0;
    const to = value;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {display.toLocaleString(locale)}{suffix}
    </span>
  );
}
