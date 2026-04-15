/**
 * Utility to resolve asset URLs from the backend API.
 * This ensures that assets are served from the persistent 'uploads' directory in production.
 */
export const getAssetUrl = (path: string | undefined | null, fallback?: string) => {
  // If no path is provided, use the fallback or a default logo
  if (!path) return fallback || '/assets/logo-sosplanete.png';

  // If path is already an absolute URL, return it as is
  if (path.startsWith('http')) return path;

  // Otherwise, construct the URL using the API base URL and the /uploads prefix
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  
  // Normalize leading slash
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Special case: if the path already starts with 'uploads/', don't duplicate it
  if (cleanPath.startsWith('uploads/')) {
    return `${baseUrl}/${cleanPath}`;
  }
  
  return `${baseUrl}/uploads/${cleanPath}`;
};
