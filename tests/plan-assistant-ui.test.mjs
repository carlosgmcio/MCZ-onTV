import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
function load(file, modules = {}, globals = {}) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(source, { exports, require: (name) => modules[name] ?? require(name), ...globals });
  return exports;
}
const plans = load("lib/site/plans.ts");
const compatibility = load("lib/site/compatibility.ts");
const engine = load("lib/site/assistant.ts", { "./plans": plans, "./compatibility": compatibility });
function nodes(tree) {
  if (!tree || typeof tree !== "object") return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}

test("every card opens the existing assistant with its plan, without navigating; closing retains history", () => {
  const listeners = new Map();
  const window = { addEventListener: (type, fn) => listeners.set(type, fn), removeEventListener: (type) => listeners.delete(type), dispatchEvent: (event) => listeners.get(event.type)?.(event) };
  class CustomEvent { constructor(type, options) { this.type = type; this.detail = options.detail; } }
  const buttons = load("app/components/plan-assistant-button.tsx", { "./ui-icon": { Icon: () => null } }, { window, CustomEvent });
  const slots = []; let cursor = 0;
  const effects = [];
  const react = {
    useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], (value) => { slots[index] = value; }]; },
    useReducer(reducer, initial) { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], (action) => { slots[index] = reducer(slots[index], action); }]; },
    useRef(initial) { const index = cursor++; if (!(index in slots)) slots[index] = { current: initial }; return slots[index]; },
    useEffect(fn) { effects.push(fn); },
  };
  const ui = load("app/components/mcz-assistant.tsx", { react, "./auth/auth-provider": { useAuth: () => ({ user: null }) }, "./plan-assistant-button": buttons, "@/lib/site/plans": plans, "@/lib/site/assistant": engine }, { window });
  function render() { cursor = 0; return nodes(ui.MczAssistant()); }
  render();
  const cleanups = effects.map((fn) => fn());
  for (const plan of plans.plans) {
    const button = buttons.PlanAssistantButton({ plan });
    assert.equal(button.type, "button");
    assert.equal(button.props.href, undefined);
    button.props.onClick();
    let rendered = render();
    assert.ok(rendered.some((node) => node.props?.role === "dialog"));
    assert.equal(slots[1].selectedPlan.id, plan.id);
    assert.equal(slots[1].reply.link, undefined);
    assert.ok(rendered.some((node) => node.props?.className === "assistant-selected-plan"));
    const count = slots[1].messages.length;
    rendered.find((node) => node.props?.["aria-label"] === "Fechar assistente").props.onClick();
    rendered = render();
    assert.ok(!rendered.some((node) => node.props?.role === "dialog"));
    assert.equal(slots[1].messages.length, count);
  }
  for (const cleanup of cleanups) cleanup?.();
  assert.equal(listeners.size, 0);
  const page = fs.readFileSync("app/inicio/page.tsx", "utf8");
  assert.ok(page.includes("<PlanAssistantButton plan={plan} />"));
  assert.ok(!page.includes("whatsappLink(plan)"));
  assert.ok(page.includes('className="whatsapp-float"'));
});
