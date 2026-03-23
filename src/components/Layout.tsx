import type { ReactNode } from 'react';

interface Props {
  sidebar: ReactNode;
  children: ReactNode;
}

export default function Layout({ sidebar, children }: Props) {
  return (
    <div className="flex h-[calc(100vh-28px)]">
      {sidebar}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-100 dark:bg-gray-950">
        {children}
      </div>
    </div>
  );
}
