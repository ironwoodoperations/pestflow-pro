export function CleanFriendlyTrustBar() {
  return (
    <div className="bg-white border-b border-gray-100 py-4 px-6">
      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ color: 'var(--color-primary)', flexShrink: 0 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--color-heading)' }}>Licensed & Insured</p>
            <p className="text-xs text-gray-500">Fully certified technicians</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ color: 'var(--color-primary)', flexShrink: 0 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--color-heading)' }}>Eco-Friendly Products</p>
            <p className="text-xs text-gray-500">Safe for family and pets</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ color: 'var(--color-primary)', flexShrink: 0 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--color-heading)' }}>Same-Day Service</p>
            <p className="text-xs text-gray-500">Fast, reliable scheduling</p>
          </div>
        </div>
      </div>
    </div>
  );
}
