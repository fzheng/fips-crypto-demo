import type { ReactNode } from 'react';

interface Props {
  sidebar: ReactNode;
  children: ReactNode;
}

export default function Layout({ sidebar, children }: Props) {
  return (
    <div className="flex h-[calc(100vh-36px)]">
      {sidebar}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-100 dark:bg-[#0A0F1E]">
        {children}
      </div>
    </div>
  );
}
