"use client";

import { useAuth } from "./auth-provider";

export function GoogleButton() {
  const { loading, busy, configured, error, loginWithGoogle } = useAuth();
  return <div className="google-login">
    <button type="button" className="google-button" aria-busy={busy}
      disabled={loading || busy || !configured} onClick={() => void loginWithGoogle()}>
      <svg className="google-mark" width="20" height="20" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <path fill="#4285F4" d="M43.61 24.46c0-1.36-.12-2.66-.35-3.92H24v7.42h11a9.4 9.4 0 0 1-4.08 6.18v5.14h6.61c3.87-3.56 6.08-8.8 6.08-14.82Z" />
        <path fill="#34A853" d="M24 44c5.51 0 10.13-1.83 13.51-4.97l-6.61-5.14c-1.83 1.23-4.17 1.97-6.9 1.97-5.31 0-9.81-3.58-11.42-8.4H5.75v5.3A20 20 0 0 0 24 44Z" />
        <path fill="#FBBC05" d="M12.58 27.46a12 12 0 0 1 0-6.92v-5.3H5.75a20 20 0 0 0 0 17.52l6.83-5.3Z" />
        <path fill="#EA4335" d="M24 12.14c3 0 5.69 1.03 7.81 3.05l5.85-5.85C34.13 6.05 29.51 4 24 4A20 20 0 0 0 5.75 15.24l6.83 5.3c1.61-4.82 6.11-8.4 11.42-8.4Z" />
      </svg>
      <span aria-live="polite">{busy ? "Conectando com Google…" : "Continuar com Google"}</span>
    </button>
    {!configured && <p className="auth-notice" role="status">A configuração de conexão com o Firebase está incompleta. O login com Google estará disponível quando ela for concluída.</p>}
    {error && <p className="auth-error" role="alert">{error}</p>}
  </div>;
}
