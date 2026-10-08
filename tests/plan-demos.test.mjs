import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
function load(file, overrides = {}) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(source, { exports, require, URL, ...overrides });
  return exports;
}
const config = load("lib/site/plan-demos.ts");

test("all four plans use their assigned official YouTube embed URLs", () => {
  assert.deepEqual(Object.keys(config.planDemos), ["mensal", "trimestral", "semestral", "anual"]);
  const ids = ["GLp1eBhgKuw", "pILMPnUKlQI", "2UFvjFrDlx0", "UuJ-wZTXEbk"];
  Object.values(config.planDemos).forEach((demo, index) => {
    assert.equal(demo.type, "embed");
    assert.equal(demo.url, `https://www.youtube.com/embed/${ids[index]}`);
    const source = new URL(config.demoSource(demo));
    assert.equal(source.searchParams.get("autoplay"), "1");
    assert.equal(source.searchParams.get("playsinline"), "1");
  });
});

test("sources reject empty and unsafe URLs, accept local MP4 and disable embed autoplay", () => {
  for (const demo of [null, { type: "embed", url: "" }, { type: "embed", url: "javascript:alert(1)" },
    { type: "embed", url: "http://example.invalid/embed" }, { type: "mp4", url: "/videos/../secret.mp4" },
    { type: "mp4", url: "https://example.invalid/video.mp4" }]) assert.equal(config.demoSource(demo), null);
  assert.equal(config.demoSource({ type: "mp4", url: "/videos/demo.mp4" }), "/videos/demo.mp4");
  const url = new URL(config.demoSource({ type: "embed", url: "https://example.invalid/embed?autoplay=1" }));
  assert.equal(url.searchParams.get("autoplay"), "0");
});

function harness(demo) {
  let cursor = 0;
  const slots = [];
  let shown = 0, closed = 0, focused = 0, paused = 0;
  const dialog = { showModal: () => shown++, close: () => closed++, closest: () => null };
  const refs = [dialog, { focus: () => focused++ }, { pause: () => paused++ }];
  let refCursor = 0;
  const component = load("app/components/plan-demo.tsx", { require: (name) => {
    if (name === "react") return {
      useId: () => "demo-title", useEffect: () => {},
      useRef: () => ({ current: refs[refCursor++] }),
      useState: (initial) => { const index = cursor++; slots[index] ??= initial; return [slots[index], (value) => { slots[index] = value; }]; },
    };
    if (name === "@/lib/site/plan-demos") return { ...config, planDemos: { mensal: demo } };
    if (name === "./ui-icon") return { Icon: () => null };
    if (name === "@/lib/site/preview-visibility") return { watchPreview: () => () => {} };
    return require(name);
  } }).PlanDemo;
  const render = () => { cursor = 0; refCursor = 0; return component({ planId: "mensal", planName: "Mensal" }); };
  return { render, dialog, activatePreview: () => { slots[2] = true; }, counts: () => ({ shown, closed, focused, paused }) };
}
function elements(tree, type) {
  if (!tree || typeof tree !== "object") return [];
  const children = tree.props?.children;
  return [...(tree.type === type ? [tree] : []), ...[children].flat(Infinity).flatMap((child) => elements(child, type))];
}

test("embed loads only after click and unmounts on close with focus restored", () => {
  const h = harness({ type: "embed", url: "https://example.invalid/embed" });
  assert.equal(elements(h.render(), "iframe").length, 0);
  elements(h.render(), "button")[0].props.onClick();
  assert.equal(h.counts().shown, 1);
  assert.equal(elements(h.render(), "iframe").length, 1);
  elements(h.render(), "button")[1].props.onClick();
  assert.equal(elements(h.render(), "iframe").length, 0);
  assert.equal(h.counts().focused, 1);
});

test("Esc and outside clicks close, while inside clicks keep the modal open", () => {
  const h = harness({ type: "mp4", url: "/videos/demo.mp4" });
  elements(h.render(), "button")[0].props.onClick();
  const dialog = elements(h.render(), "dialog")[0];
  dialog.props.onClick({ target: { closest: () => ({}) }, currentTarget: h.dialog });
  assert.equal(h.counts().closed, 0);
  dialog.props.onClick({ target: h.dialog, currentTarget: h.dialog, clientX: 0, clientY: 0 });
  assert.equal(elements(h.render(), "video").length, 0);
  elements(h.render(), "button")[0].props.onClick();
  let prevented = false;
  dialog.props.onCancel({ preventDefault: () => { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(h.counts().closed, 2);
  assert.equal(h.counts().paused, 2);
});

test("unconfigured or missing MP4 shows placeholder without broken player", () => {
  const empty = harness(null);
  elements(empty.render(), "button")[0].props.onClick();
  assert.equal(elements(empty.render(), "video").length, 0);
  assert.equal(elements(empty.render(), "iframe").length, 0);
  const h = harness({ type: "mp4", url: "/videos/missing.mp4" });
  elements(h.render(), "button")[0].props.onClick();
  const video = elements(h.render(), "video")[0];
  assert.equal(video.props.autoPlay, undefined);
  video.props.onError();
  assert.equal(elements(h.render(), "video").length, 0);
});

test("YouTube previews are muted, inline, control-free loops with unchanged video IDs", () => {
  for (const demo of Object.values(config.planDemos)) {
    const url = new URL(config.previewSource(demo));
    assert.equal(url.pathname, new URL(demo.url).pathname);
    for (const key of ["autoplay", "mute", "playsinline", "loop"]) assert.equal(url.searchParams.get(key), "1");
    assert.equal(url.searchParams.get("controls"), "0");
    assert.equal(url.searchParams.get("disablekb"), "1");
    assert.equal(url.searchParams.get("playlist"), url.pathname.split("/").at(-1));
  }
  assert.equal(config.previewSource(null), null);
});

test("opening modal removes the miniature player and closing permits muted preview again", () => {
  const h = harness(config.planDemos.mensal);
  assert.equal(elements(h.render(), "iframe").length, 0);
  h.activatePreview();
  assert.equal(new URL(elements(h.render(), "iframe")[0].props.src).searchParams.get("mute"), "1");
  elements(h.render(), "button")[0].props.onClick();
  const players = elements(h.render(), "iframe");
  assert.equal(players.length, 1);
  assert.equal(new URL(players[0].props.src).searchParams.get("controls"), "1");
  assert.equal(new URL(players[0].props.src).searchParams.get("mute"), null);
  elements(h.render(), "button")[1].props.onClick();
  assert.equal(new URL(elements(h.render(), "iframe")[0].props.src).searchParams.get("mute"), "1");
});

test("preview scheduler loads nearby desktop cards, only one visible mobile card and no reduced-motion players", () => {
  const { activePreviewIndexes } = load("lib/site/preview-visibility.ts");
  const items = [{ near: true, ratio: .4, blocked: false }, { near: true, ratio: .9, blocked: false }, { near: false, ratio: 0, blocked: false }];
  const select = (mobile, reduced = false, hidden = false) => Array.from(activePreviewIndexes(items, mobile, reduced, hidden));
  assert.deepEqual(select(false), [0, 1]);
  assert.deepEqual(select(true), [1]);
  assert.deepEqual(select(false, true), []);
  assert.deepEqual(select(false, false, true), []);
  items[1].blocked = true;
  assert.deepEqual(select(false), []);
  items[1].blocked = false;
  items.forEach((item) => { item.near = false; item.ratio = 0; });
  assert.deepEqual(select(false), []);
  assert.deepEqual(select(true), []);
});
