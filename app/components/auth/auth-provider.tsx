"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { GoogleAuthProvider, signInWithPopup, signOut, type User } from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase/client";
import { initialSession, observeSession } from "@/lib/auth/session";
import { authErrorMessage } from "@/lib/auth/errors";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  busy: boolean;
  error: string | null;
  configured: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(initialSession);
  const [busy, setBusy] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);
  const busyRef = useRef(false);

  useEffect(() => observeSession(setSession), []);

  async function loginWithGoogle() {
    if (session.loading || busyRef.current) return;
    if (!isFirebaseConfigured) {
      setOperationError("A configuração de conexão com o Firebase está incompleta.");
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setOperationError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(getFirebaseAuth(), provider);
      // Session updates and page routing happen only after the Firebase observer.
    } catch (failure) {
      setOperationError(authErrorMessage(failure));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function logout() {
    if (session.loading || busyRef.current || !session.user) return;
    busyRef.current = true;
    setBusy(true);
    setOperationError(null);
    try {
      await signOut(getFirebaseAuth());
    } catch (failure) {
      setOperationError(authErrorMessage(failure));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  return <AuthContext.Provider value={{
    user: session.user, loading: session.loading, busy,
    error: operationError ?? session.error, configured: isFirebaseConfigured,
    loginWithGoogle, logout,
  }}>{children}</AuthContext.Provider>;
}
