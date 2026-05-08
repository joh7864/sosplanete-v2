import { redirect } from 'next/navigation';

/**
 * Cette page a été fusionnée dans /dashboard/settings?tab=catalog.
 * Cette redirection assure la compatibilité avec les bookmarks existants.
 */
export default function ReferencePage() {
  redirect('/dashboard/settings?tab=catalog');
}
