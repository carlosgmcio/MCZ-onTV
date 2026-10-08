"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";

export function SessionGate({ audience, children }: { audience: "visitor" | "member"; children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const redirectTo = loading ? null : audience === "visitor" && user ? "/inicio" : audience === "member" && !user ? "/" : null;

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo);
  }, [redirectTo, router]);

  if (loading || redirectTo) {
    return <main className="session-screen" role="status" aria-live="polite">
      <span className="session-loader" aria-hidden="true" />
      <p>{loading ? "Verificando sua sessão…" : "Preparando seu entretenimento…"}</p>
    </main>;
  }
  return children;
}
