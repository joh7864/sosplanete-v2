/**
 * Utility to resolve asset URLs from the backend API.
 * This ensures that assets are served from the persistent 'uploads' directory in production.
 */
export const getAssetUrl = (path: string | undefined | null, fallback?: string) => {
  // If no path is provided, use the fallback or a default logo
  if (!path) return fallback || '/assets/logo.png';

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

/**
 * Calcule l'avatar 3D par défaut (dans uploads/avatars_3D) pour un joueur
 * en fonction de son pseudo et de son genre.
 */
export const getDefaultAvatar3D = (pseudo: string, gender?: string | null): string => {
  const cleanPseudo = pseudo || '';
  const hash = cleanPseudo.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  let file = '';
  const g = (gender || '').toUpperCase();
  if (g === 'EF') {
    file = `EF_avatar_0${(hash % 3) + 1}.png`;
  } else if (g === 'EH') {
    file = `EH_avatar_0${(hash % 3) + 1}.png`;
  } else if (g === 'F') {
    file = `F_avatar_${((hash % 12) + 1).toString().padStart(2, '0')}.png`;
  } else if (g === 'M' || g === 'H') {
    file = `H_avatar_0${(hash % 21) + 1}.png`;
  } else {
    const list = ['EF', 'EH', 'F', 'H'];
    const sel = list[hash % 4];
    if (sel === 'EF') file = `EF_avatar_0${(hash % 3) + 1}.png`;
    else if (sel === 'EH') file = `EH_avatar_0${(hash % 3) + 1}.png`;
    else if (sel === 'F') file = `F_avatar_${((hash % 12) + 1).toString().padStart(2, '0')}.png`;
    else file = `H_avatar_0${(hash % 21) + 1}.png`;
  }
  return `avatars_3D/${file}`;
};

/**
 * Résout l'avatar d'un joueur :
 * - Si un avatar personnalisé existe dans uploads/avatars, il est retourné.
 * - Sinon, l'avatar 3D par défaut correspondant au joueur est retourné depuis uploads/avatars_3D.
 */
export const resolvePlayerAvatar = (
  avatar: string | null | undefined,
  pseudo: string,
  gender?: string | null,
): string => {
  if (avatar && avatar !== 'avatars/default.png') {
    return getAssetUrl(avatar);
  }
  return getAssetUrl(getDefaultAvatar3D(pseudo, gender));
};
