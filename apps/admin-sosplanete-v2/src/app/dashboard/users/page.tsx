import { redirect } from 'next/navigation';

/**
 * Cette page a été fusionnée dans /dashboard/settings?tab=users.
 * Cette redirection assure la compatibilité avec les bookmarks existants.
 */
export default function UsersManagementPage() {
  redirect('/dashboard/settings?tab=users');
}
