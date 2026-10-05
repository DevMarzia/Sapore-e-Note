import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext';
import './index.css';

// Check if current window is the OAuth popup callback
const isOAuthPopup = typeof window !== 'undefined' && (
  window.name === 'supabase_google_auth' ||
  (window.opener && window.opener !== window && (window.location.hash.includes('access_token') || window.location.search.includes('code=')))
);

if (isOAuthPopup) {
  // Extract tokens from URL hash
  const hash = window.location.hash.startsWith('#') ? window.location.hash.substring(1) : window.location.hash;
  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  const syncPayload = {
    type: 'SUPABASE_AUTH_TOKENS',
    access_token: accessToken,
    refresh_token: refreshToken,
    timestamp: Date.now(),
  };

  // 1. Post to opener if available
  try {
    if (window.opener && window.opener !== window) {
      window.opener.postMessage(syncPayload, '*');
    }
  } catch (e) {
    console.warn('Opener postMessage error:', e);
  }

  // 2. Broadcast via BroadcastChannel (works across all tabs/iframes of same origin)
  try {
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel('sapore_auth_sync');
      channel.postMessage(syncPayload);
      channel.close();
    }
  } catch (e) {
    console.warn('BroadcastChannel error:', e);
  }

  // 3. Sync via localStorage storage event
  try {
    localStorage.setItem('sapore_auth_sync_event', JSON.stringify(syncPayload));
  } catch (e) {
    console.warn('LocalStorage sync error:', e);
  }

  // Render a clean success callback view (instead of loading the full website inside the popup)
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center; padding: 24px; background: #faf7f7; box-sizing: border-box;">
        <div style="width: 56px; height: 56px; border-radius: 50%; background: #e8f5e9; color: #2e7d32; display: flex; align-items: center; justify-content: center; font-size: 26px; font-weight: bold; margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">✓</div>
        <h2 style="margin: 0 0 8px; color: #1c1917; font-size: 20px; font-weight: 700;">Accesso Google Riuscito!</h2>
        <p style="margin: 0 0 24px; color: #78716c; font-size: 13px; max-width: 320px; line-height: 1.5;">La sessione è stata trasferita alla tua web app. Questa finestra si chiuderà automaticamente.</p>
        <button id="close-popup-btn" style="padding: 10px 24px; border-radius: 12px; border: none; background: #990f4b; color: white; font-weight: 600; cursor: pointer; font-size: 13px; box-shadow: 0 2px 6px rgba(153, 15, 75, 0.25);">Chiudi Finestra</button>
      </div>
    `;

    document.getElementById('close-popup-btn')?.addEventListener('click', () => {
      window.close();
    });
  }

  // Close popup window automatically
  setTimeout(() => {
    try {
      window.close();
    } catch {
      // ignore
    }
  }, 900);

} else {
  // Main Application entry point
  createRoot(document.getElementById('root')!).render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
