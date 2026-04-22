import { ReactNode } from 'react';

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}

export default function LegalPageLayout({ title, lastUpdated, children }: LegalPageLayoutProps) {
  return (
    <main id="main-content" className="min-h-screen py-16 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--color-bg-section)' }}>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: 'var(--color-heading, inherit)' }}>{title}</h1>
        <p className="text-sm text-gray-500 mb-8">Last Updated: {lastUpdated}</p>
        <div className="text-base leading-relaxed" style={{ color: 'var(--color-body-text, #374151)' }}>
          {children}
        </div>
      </div>
    </main>
  );
}
