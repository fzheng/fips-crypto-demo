import { useState, useRef, useEffect, type ReactNode } from 'react';

interface TooltipProps {
  term: string;
  explanation: string;
  children?: ReactNode;
}

export default function Tooltip({ term, explanation, children }: TooltipProps) {
  const [show, setShow] = useState(false);
  const tipRef = useRef<HTMLSpanElement>(null);
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('left');

  useEffect(() => {
    if (show && tipRef.current) {
      const rect = tipRef.current.getBoundingClientRect();
      if (rect.left < 8) setAlign('left');
      else if (rect.right > window.innerWidth - 8) setAlign('right');
      else setAlign('center');
    }
  }, [show]);

  const alignClass =
    align === 'left' ? 'left-0'
    : align === 'right' ? 'right-0'
    : 'left-1/2 -translate-x-1/2';

  return (
    <span className="relative inline-block">
      <span
        className="border-b border-dotted border-blue-500 dark:border-blue-400 cursor-help text-blue-600 dark:text-blue-400"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
      >
        {children ?? term}
      </span>
      {show && (
        <span
          ref={tipRef}
          className={`absolute z-50 top-full ${alignClass} mt-2 w-72 p-3 rounded-xl glass-card border border-slate-200 dark:border-white/10 text-sm text-slate-700 dark:text-slate-200 shadow-xl`}
        >
          <span className="font-semibold text-blue-600 dark:text-blue-400">{term}</span>
          <br />
          {explanation}
        </span>
      )}
    </span>
  );
}
