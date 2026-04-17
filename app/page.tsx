import { redirect } from 'next/navigation';

// In production, middleware rewrites apex requests to the Vite SPA (/_admin/index.html).
// This page only renders in local dev and redirects to a test tenant route.
export default function ApexPlaceholder() {
  redirect('/_tenant/pestflow-pro');
}
