import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function load(file, modules = {}) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(source, { exports, require: (name) => modules[name] });
  return exports;
}
const validation = load("lib/reviews/validation.ts");
function harness({ signedIn = true, exists = false, provider = "google.com" } = {}) {
  const app = {};
  const writes = [], queries = [];
  let callback;
  const sdk = {
    getFirestore: (received) => { assert.equal(received, app); return "database"; },
    doc: (...args) => args,
    getDoc: async () => ({ exists: () => exists }),
    setDoc: async (reference, data) => { writes.push({ reference, data }); },
    serverTimestamp: () => "server-time",
    collection: (...args) => args,
    where: (...args) => args, orderBy: (...args) => args, limit: (n) => n,
    query: (...args) => { queries.push(args); return args; },
    onSnapshot: (_query, next) => { callback = next; return () => {}; },
  };
  const auth = { app, currentUser: signedIn ? { uid: "test-account-uid", getIdTokenResult: async () => ({ signInProvider: provider, claims: { name: "Test First Last", picture: "https://lh3.googleusercontent.com/test-image" } }) } : null };
  const client = load("lib/reviews/client.ts", { "firebase/firestore": sdk, "../firebase/client": { getFirebaseAuth: () => auth }, "./validation": validation });
  return { ...client, writes, queries, emit: (docs) => callback({ docs: docs.map((data, index) => ({ id: String(index), data: () => data })) }) };
}

test("reviews reject invalid stars and enforce trimmed comment limits", () => {
  for (const rating of [0, 6, 2.5, NaN]) assert.throws(() => validation.validateReview(rating, "A valid test comment"));
  for (const comment of ["short", " ".repeat(20), "x".repeat(1001)]) assert.throws(() => validation.validateReview(5, comment));
  assert.equal(validation.validateReview(1, "  Test comment here  "), "Test comment here");
});
test("submission uses authenticated token identity, a UID-specific document and pending server timestamp", async () => {
  const h = harness();
  await h.submitReview(4, "  Test comment only  ", false);
  const { reference, data } = h.writes[0];
  assert.deepEqual(Array.from(reference), ["database", "reviews", "test-account-uid"]);
  assert.equal(data.userId, "test-account-uid");
  assert.equal(data.publicName, "Test");
  assert.equal(data.photoURL, "");
  assert.equal(data.status, "pending");
  assert.equal(data.createdAt, "server-time");
  assert.equal(data.comment, "Test comment only");
  assert.ok(!("email" in data));
});
test("unauthenticated users, other providers and duplicate submissions are rejected", async () => {
  for (const options of [{ signedIn: false }, { provider: "password" }, { exists: true }]) {
    const h = harness(options);
    await assert.rejects(h.submitReview(5, "Test comment only", false));
    assert.equal(h.writes.length, 0);
  }
});
test("only approved reviews are queried and rendered, with bounded newest-first results", () => {
  const h = harness(); let result;
  h.observeApprovedReviews((reviews) => { result = reviews; }, () => {});
  const query = h.queries[0];
  assert.deepEqual(Array.from(query[1]), ["status", "==", "approved"]);
  assert.deepEqual(Array.from(query[2]), ["createdAt", "desc"]);
  assert.equal(query[3], 24);
  const review = { publicName: "Test", rating: 5, comment: "Test comment only", createdAt: { toDate: () => new Date(0) }, photoURL: "https://untrusted.invalid/picture" };
  h.emit([{ ...review, status: "pending" }, { ...review, status: "approved" }]);
  assert.equal(result.length, 1);
  assert.equal(result[0].photoURL, "");
});
