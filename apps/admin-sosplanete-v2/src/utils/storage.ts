/**
 * Utility for abstracting authentication storage (localStorage vs sessionStorage).
 * Used to implement 'Remember Me' functionality securely.
 */

export const getAuthData = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key) || sessionStorage.getItem(key);
};

export const setAuthData = (key: string, value: string, remember: boolean = true): void => {
  if (typeof window === 'undefined') return;
  
  if (remember) {
    localStorage.setItem(key, value);
    sessionStorage.removeItem(key);
  } else {
    sessionStorage.setItem(key, value);
    localStorage.removeItem(key);
  }
};

export const removeAuthData = (key: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
};

export const clearAuthData = (): void => {
  if (typeof window === 'undefined') return;
  // Nettoyer uniquement les données liées à l'auth, ou tout vider
  // Dans notre cas, l'app utilisait localStorage.clear() partout, on reproduit le comportement :
  localStorage.clear();
  sessionStorage.clear();
};
