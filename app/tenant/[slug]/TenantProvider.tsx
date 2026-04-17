'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { Tenant } from '../../../shared/lib/tenant/types';

const TenantContext = createContext<Tenant | null>(null);

export function TenantProvider({
  tenant,
  children,
}: {
  tenant: Tenant;
  children: ReactNode;
}) {
  return (
    <TenantContext.Provider value={tenant}>{children}</TenantContext.Provider>
  );
}

export function useTenant(): Tenant {
  const value = useContext(TenantContext);
  if (!value) {
    throw new Error('useTenant must be used inside <TenantProvider>');
  }
  return value;
}
