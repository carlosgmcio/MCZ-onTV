import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);

function loadModule(file, globals = {}) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(source, { exports, ...globals }, { filename: file });
  return exports;
}

const flush = () => new Promise((resolve) => setImmediate(resolve));

function sessionHarness({ configured = true, persistenceFailure } = {}) {
  const events = [];
  const auth = {};
  let onUser;
  let onError;
  let unsubscribed = false;
  const sessionModule = loadModule("lib/auth/session.ts", { require: (name) => {
    if (name === "../firebase/client") return { getFirebaseAuth: () => auth, isFirebaseConfigured: configured };
    if (name === "./errors") return { authErrorMessage: () => "Falha de autenticação" };
    return {
      browserLocalPersistence: "LOCAL",
      setPersistence: async (received, persistence) => {
        assert.equal(received, auth);
        assert.equal(persistence, "LOCAL");
        events.push("persistence");
        if (persistenceFailure) throw persistenceFailure;
      },
      onAuthStateChanged: (received, next, failure) => {
        assert.equal(received, auth);
        events.push("subscribe");
        onUser = next;
        onError = failure;
        return () => { unsubscribed = true; };
      },
    };
  } });
  return { ...sessionModule, events, emit: (user) => onUser(user), fail: () => onError(new Error("failure")), wasUnsubscribed: () => unsubscribed };
}

test("restored session remains loading until Firebase confirms the existing user", async () => {
  const auth = sessionHarness();
  const states = [auth.initialSession];
  const cleanup = auth.observeSession((state) => states.push(state));
  await flush();
  assert.deepEqual(auth.events, ["persistence", "subscribe"]);
  assert.equal(states.length, 1);
  assert.equal(states[0].loading, true);
  const existingUser = { uid: "existing-user", displayName: "Pessoa" };
  auth.emit(existingUser);
  assert.equal(states.at(-1).user, existingUser);
  assert.equal(states.at(-1).loading, false);
  cleanup();
  assert.equal(auth.wasUnsubscribed(), true);
});

test("login and logout follow observer events; no login is inferred before confirmation", async () => {
  const auth = sessionHarness();
  const states = [];
  const cleanup = auth.observeSession((state) => states.push(state));
  await flush();
  auth.emit(null);
  assert.equal(states.at(-1).user, null);
  const user = { uid: "google-user" };
  auth.emit(user);
  assert.equal(states.at(-1).user, user);
  auth.emit(null);
  assert.equal(states.at(-1).user, null);
  assert.equal(states.at(-1).loading, false);
  cleanup();
});

test("unconfigured Firebase shows the visitor screen without calling SDK services", async () => {
  const auth = sessionHarness({ configured: false });
  const states = [];
  auth.observeSession((state) => states.push(state));
  await flush();
  assert.equal(states[0].user, null);
  assert.equal(states[0].loading, false);
  assert.equal(auth.events.length, 0);
});

test("session setup failures stop loading and expose only a safe error", async () => {
  const auth = sessionHarness({ persistenceFailure: new Error("internal-details") });
  const states = [];
  auth.observeSession((state) => states.push(state));
  await flush();
  assert.equal(states[0].loading, false);
  assert.equal(states[0].error, "Falha de autenticação");
  assert.deepEqual(auth.events, ["persistence"]);
});

test("unmount before initialization prevents subscribing or updating state", async () => {
  const auth = sessionHarness();
  const states = [];
  const cleanup = auth.observeSession((state) => states.push(state));
  cleanup();
  await flush();
  assert.equal(auth.events.length, 0);
  assert.equal(states.length, 0);
});

test("late observer events after cleanup cannot reveal stale account content", async () => {
  const auth = sessionHarness();
  const states = [];
  const cleanup = auth.observeSession((state) => states.push(state));
  await flush();
  cleanup();
  auth.emit({ uid: "stale-user" });
  auth.fail();
  assert.equal(states.length, 0);
});

test("entry and member gates hide wrong content and route correctly after restoration/login/logout", () => {
  let session = { user: null, loading: true };
  const redirects = [];
  const gate = loadModule("app/components/auth/session-gate.tsx", { require: (name) => {
    if (name === "react") return { useEffect: (effect) => effect() };
    if (name === "next/navigation") return { useRouter: () => ({ replace: (path) => redirects.push(path) }) };
    if (name === "./auth-provider") return { useAuth: () => session };
    return require(name);
  } }).SessionGate;
  const render = (audience) => renderToStaticMarkup(gate({ audience, children: "ACCOUNT CONTENT" }));
  assert.ok(!render("visitor").includes("ACCOUNT CONTENT"));
  assert.ok(!render("member").includes("ACCOUNT CONTENT"));
  assert.equal(redirects.length, 0);
  session = { user: null, loading: false };
  assert.equal(render("visitor"), "ACCOUNT CONTENT");
  assert.ok(!render("member").includes("ACCOUNT CONTENT"));
  assert.equal(redirects.at(-1), "/");
  session = { user: { uid: "restored-or-new-user" }, loading: false };
  assert.ok(!render("visitor").includes("ACCOUNT CONTENT"));
  assert.equal(redirects.at(-1), "/inicio");
  assert.equal(render("member"), "ACCOUNT CONTENT");
  session = { user: null, loading: false };
  assert.ok(!render("member").includes("ACCOUNT CONTENT"));
  assert.equal(redirects.at(-1), "/");
});

test("all four WhatsApp links include the correct plan, price and destination", () => {
  const { plans, whatsappLink } = loadModule("lib/site/plans.ts", { require: () => loadModule("lib/site/whatsapp.ts") });
  assert.deepEqual(Array.from(plans, (plan) => [plan.name, plan.price, plan.months]), [
    ["Mensal", "25,00", 1], ["Trimestral", "60,00", 3], ["Semestral", "120,00", 6], ["Anual", "230,00", 12],
  ]);
  for (const plan of plans) {
    const url = new URL(whatsappLink(plan));
    assert.equal(url.origin, "https://wa.me");
    assert.equal(url.pathname, "/5582999635731");
    assert.ok(url.searchParams.get("text").includes(`plano ${plan.name}: R$${plan.price} / ${plan.months} ${plan.months === 1 ? "m\u00eas" : "meses"}`));
  }
  const monthlyMessage = new URL(whatsappLink(plans[0])).searchParams.get("text");
  assert.ok(monthlyMessage.includes("R$25,00 / 1 m\u00eas"));
  assert.ok(!monthlyMessage.includes("15,00"));
  assert.ok(!monthlyMessage.includes("novos clientes"));
  assert.equal(plans[3].badge, "MELHOR CUSTO-BENEFÍCIO");
});

test("Firebase initialization stays lazy and reuses the existing app and auth instance", () => {
  const app = { name: "[DEFAULT]" };
  let appCalls = 0;
  let authCalls = 0;
  const auth = {};
  const client = loadModule("lib/firebase/client.ts", {
    window: {}, process: { env: {
      NEXT_PUBLIC_FIREBASE_API_KEY: "test-only-key", NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "test.invalid",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: "test-only-project", NEXT_PUBLIC_FIREBASE_APP_ID: "test-only-app",
    } },
    require: (name) => name === "firebase/app"
      ? { getApps: () => [app], initializeApp: () => { appCalls++; return app; } }
      : { getAuth: (received) => { assert.equal(received, app); authCalls++; return auth; } },
  });
  assert.equal(authCalls, 0);
  assert.equal(client.getFirebaseAuth(), auth);
  assert.equal(client.getFirebaseAuth(), auth);
  assert.equal(appCalls, 0);
  assert.equal(authCalls, 1);
});

test("Firebase configuration requires actual nonblank Web values", () => {
  const validEnv = {
    NEXT_PUBLIC_FIREBASE_API_KEY: "test-only-key",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "test.invalid",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: "test-only-project",
    NEXT_PUBLIC_FIREBASE_APP_ID: "test-only-app",
  };
  const configured = (env) => loadModule("lib/firebase/client.ts", {
    process: { env }, require: () => ({}),
  }).isFirebaseConfigured;
  assert.equal(configured(validEnv), true);
  for (const key of Object.keys(validEnv)) {
    assert.equal(configured({ ...validEnv, [key]: "" }), false);
    assert.equal(configured({ ...validEnv, [key]: "   " }), false);
    assert.equal(configured({ ...validEnv, [key]: undefined }), false);
  }
});

test("Google button enables only after configuration and session restoration, and blocks duplicate clicks", () => {
  let context = { configured: true, loading: false, busy: false, error: null, loginWithGoogle: async () => {} };
  const { GoogleButton } = loadModule("app/components/auth/google-button.tsx", {
    require: (name) => name === "./auth-provider" ? { useAuth: () => context } : require(name),
  });
  const render = () => renderToStaticMarkup(GoogleButton());
  assert.ok(!render().includes("disabled"));
  for (const overrides of [{ loading: true }, { busy: true }, { configured: false }]) {
    const saved = context;
    context = { ...saved, ...overrides };
    assert.ok(render().includes("disabled"));
    context = saved;
  }
  context = { ...context, configured: false };
  assert.match(render(), /Firebase/);
});

test("missing Firebase values or SSR do not initialize Firebase", () => {
  for (const globals of [{ window: {} }, {}]) {
    let calls = 0;
    const client = loadModule("lib/firebase/client.ts", {
      ...globals, process: { env: {} },
      require: () => ({ getApps: () => [], initializeApp: () => { calls++; }, getAuth: () => { calls++; } }),
    });
    assert.equal(client.isFirebaseConfigured, false);
    assert.throws(() => client.getFirebaseAuth());
    assert.equal(calls, 0);
  }
});

test("popup/network/configuration errors do not expose internal details", () => {
  const { authErrorMessage } = loadModule("lib/auth/errors.ts");
  assert.match(authErrorMessage({ code: "auth/popup-closed-by-user" }), /login foi cancelado/);
  assert.match(authErrorMessage({ code: "auth/popup-blocked" }), /Permita pop-ups/);
  assert.match(authErrorMessage({ code: "auth/network-request-failed" }), /conexão/);
  assert.ok(!authErrorMessage({ code: "auth/invalid-api-key", message: "internal-key" }).includes("internal-key"));
});

test("Google login blocks duplicate popups and logout follows the confirmed session", async () => {
  const slots = [];
  let cursor = 0;
  let effect;
  let publishSession;
  let finishPopup;
  let popupCalls = 0;
  let logoutCalls = 0;
  const auth = {};
  const errorMessages = loadModule("lib/auth/errors.ts");
  const providerModule = loadModule("app/components/auth/auth-provider.tsx", { require: (name) => {
    if (name === "react") return {
      createContext: () => ({ Provider: "auth-context" }),
      useState: (initial) => {
        const index = cursor++;
        if (!(index in slots)) slots[index] = initial;
        return [slots[index], (value) => { slots[index] = value; }];
      },
      useRef: (initial) => {
        const index = cursor++;
        if (!(index in slots)) slots[index] = { current: initial };
        return slots[index];
      },
      useEffect: (callback) => { effect ??= callback; },
    };
    if (name === "firebase/auth") return {
      GoogleAuthProvider: class {
        setCustomParameters(params) { assert.equal(params.prompt, "select_account"); }
      },
      signInWithPopup: (received, provider) => {
        assert.equal(received, auth);
        assert.ok(provider);
        popupCalls++;
        return new Promise((resolve) => { finishPopup = resolve; });
      },
      signOut: async (received) => {
        assert.equal(received, auth);
        logoutCalls++;
        publishSession({ user: null, loading: false, error: null });
      },
    };
    if (name === "@/lib/firebase/client") return { getFirebaseAuth: () => auth, isFirebaseConfigured: true };
    if (name === "@/lib/auth/session") return {
      initialSession: { user: null, loading: true, error: null },
      observeSession: (callback) => { publishSession = callback; return () => {}; },
    };
    if (name === "@/lib/auth/errors") return errorMessages;
    return require(name);
  } });
  const render = () => { cursor = 0; return providerModule.AuthProvider({ children: null }).props.value; };
  let context = render();
  effect();
  await context.loginWithGoogle();
  assert.equal(popupCalls, 0, "login cannot start before session restoration");
  publishSession({ user: null, loading: false, error: null });
  context = render();
  const firstClick = context.loginWithGoogle();
  await context.loginWithGoogle();
  assert.equal(popupCalls, 1);
  assert.equal(render().busy, true);
  finishPopup({ user: { uid: "popup-user" } });
  await firstClick;
  assert.equal(render().user, null, "popup result must not bypass the session observer");
  const user = { uid: "confirmed-user" };
  publishSession({ user, loading: false, error: null });
  context = render();
  assert.equal(context.user, user);
  assert.equal(context.busy, false);
  await context.logout();
  assert.equal(logoutCalls, 1);
  assert.equal(render().user, null);
});
