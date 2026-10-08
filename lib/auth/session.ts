import { browserLocalPersistence, onAuthStateChanged, setPersistence, type User } from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "../firebase/client";
import { authErrorMessage } from "./errors";

export type SessionState = { user: User | null; loading: boolean; error: string | null };

export const initialSession: SessionState = { user: null, loading: true, error: null };

// The first observer event is authoritative, including restored sessions.
export function observeSession(onSession: (session: SessionState) => void): () => void {
  let disposed = false;
  let unsubscribe: (() => void) | undefined;

  Promise.resolve().then(async () => {
    if (disposed) return;
    if (!isFirebaseConfigured) {
      onSession({ user: null, loading: false, error: null });
      return;
    }
    const auth = getFirebaseAuth();
    await setPersistence(auth, browserLocalPersistence);
    if (disposed) return;
    unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!disposed) onSession({ user, loading: false, error: null });
    }, (failure) => {
      if (!disposed) onSession({ user: null, loading: false, error: authErrorMessage(failure) });
    });
  }).catch((failure: unknown) => {
    if (!disposed) onSession({ user: null, loading: false, error: authErrorMessage(failure) });
  });

  return () => { disposed = true; unsubscribe?.(); };
}
