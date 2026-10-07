// Google Apps Script Web App Endpoint Configuration
// User specified endpoint constant:
export const APPS_SCRIPT_URL = 'PASTE_MY_APPS_SCRIPT_WEB_APP_URL_HERE';

/**
 * Returns the active Google Apps Script Web App URL.
 * Checks localStorage and VITE_APPS_SCRIPT_URL first, falling back to APPS_SCRIPT_URL.
 */
export function getAppsScriptUrl(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('GOOGLE_APPS_SCRIPT_URL');
    if (saved && saved.trim() && saved.trim() !== 'PASTE_MY_APPS_SCRIPT_WEB_APP_URL_HERE') {
      return saved.trim();
    }
  }

  const envUrl = (import.meta as any).env?.VITE_APPS_SCRIPT_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim();
  }

  return APPS_SCRIPT_URL;
}

/**
 * Persists updated Google Apps Script Web App URL in local storage and backend server
 */
export function saveAppsScriptUrl(url: string): void {
  if (typeof window !== 'undefined') {
    const cleanUrl = url.trim();
    localStorage.setItem('GOOGLE_APPS_SCRIPT_URL', cleanUrl);
    // Also sync to server-side backend cache
    if (cleanUrl && cleanUrl !== 'PASTE_MY_APPS_SCRIPT_WEB_APP_URL_HERE') {
      fetch('/api/settings/apps-script-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appsScriptUrl: cleanUrl }),
      }).catch(err => {
        console.warn('Could not sync Apps Script URL to backend:', err);
      });
    }
  }
}
