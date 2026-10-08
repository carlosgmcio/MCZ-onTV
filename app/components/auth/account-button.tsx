"use client";

import { useState } from "react";
import { useAuth } from "./auth-provider";

export function AccountButton() {
  const { user, busy, error, logout } = useAuth();
  const [failedPhoto, setFailedPhoto] = useState<string | null>(null);
  if (!user) return null;
  const firstName = user.displayName?.trim().split(/\s+/)[0] || "Minha conta";
  return <details className="account-menu">
    <summary aria-label={`Conta de ${firstName}`}>
      {user.photoURL && user.photoURL !== failedPhoto
        // Firebase profile images can use different Google image hosts.
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={user.photoURL} width="32" height="32" alt="" referrerPolicy="no-referrer" onError={() => setFailedPhoto(user.photoURL)} />
        : <span className="account-avatar" aria-hidden="true">{firstName.charAt(0).toUpperCase()}</span>}
      <span className="account-name">{firstName}</span><span aria-hidden="true">⌄</span>
    </summary>
    <div className="account-options">
      <button type="button" disabled={busy} onClick={() => void logout()}>{busy ? "Saindo…" : "Sair da conta"}</button>
      {error && <p role="alert" className="auth-error">{error}</p>}
    </div>
  </details>;
}
