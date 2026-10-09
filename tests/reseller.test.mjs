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
const reseller = load("lib/site/reseller.ts");
const whatsapp = load("lib/site/whatsapp.ts");
const plans = load("lib/site/plans.ts", { "./whatsapp": whatsapp });
const compatibility = load("lib/site/compatibility.ts");
const engine = load("lib/site/assistant.ts", { "./plans": plans, "./whatsapp": whatsapp, "./compatibility": compatibility, "./reseller": reseller });
function nodes(tree) {
  if (!tree || typeof tree !== "object") return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}
function stateHarness() {
  const slots = []; let cursor = 0;
  const effects = [];
  const react = {
    useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], (value) => { slots[index] = value; }]; },
    useReducer(reducer, initial) { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], (action) => { slots[index] = reducer(slots[index], action); }]; },
    useRef(initial) { const index = cursor++; if (!(index in slots)) slots[index] = { current: initial }; return slots[index]; },
    useEffect(fn) { effects.push(fn); },
  };
  return { slots, effects, react, render(component) { cursor = 0; return nodes(component()); } };
}

test("official packages and every price example use correct revenue and gross profit", () => {
  assert.deepEqual(Array.from(reseller.resellerPackages, (pkg) => [pkg.credits, pkg.price]), [[5, 30], [10, 50], [20, 90], [50, 200], [100, 375], [500, 1750]]);
  for (const [price, revenue, profit] of [[25, 250, 200], [30, 300, 250], [35, 350, 300], [40, 400, 350], [50, 500, 450], [80, 800, 750], [25.99, 259.9, 209.9]]) {
    const result = reseller.calculateResale(reseller.starterPackage, price, 10);
    assert.equal(result.revenue, revenue);
    assert.equal(result.grossProfit, profit);
    assert.equal(result.investment, 50);
    assert.equal(result.remainingCredits, 0);
    assert.match(reseller.formatBRL(result.grossProfit), /^R\$\s/);
  }
  assert.equal(reseller.formatBRL(1750), "R$\u00a01.750,00");
});

test("partial sales deduct the whole package and invalid inputs cannot produce misleading results", () => {
  const partial = reseller.calculateResale(reseller.starterPackage, 25, 1);
  assert.equal(partial.revenue, 25);
  assert.equal(partial.grossProfit, -25);
  assert.equal(partial.remainingCredits, 9);
  assert.equal(reseller.calculateResale(reseller.starterPackage, 25, 0).grossProfit, -50);
  for (const [price, sold] of [[24.99, 10], [NaN, 10], [Infinity, 10], [25, -1], [25, 11], [25, 0.5]]) {
    assert.equal(reseller.calculateResale(reseller.starterPackage, price, sold), null);
  }
});

test("reinvestment uses received revenue once and identifies unaffordable packages", () => {
  for (const [salePrice, cash] of [[25, 200], [80, 750]]) {
    const sale = reseller.calculateResale(reseller.starterPackage, salePrice, 10);
    const result = reseller.calculateReinvestment(sale.revenue, reseller.starterPackage);
    assert.equal(result.cash, cash);
    assert.equal(result.newCredits, 10);
    assert.equal(result.shortfall, 0);
  }
  const larger = reseller.calculateReinvestment(250, reseller.resellerPackages[3]);
  assert.equal(larger.cash, 50);
  assert.equal(larger.newCredits, 50);
  const insufficient = reseller.calculateReinvestment(250, reseller.resellerPackages[4]);
  assert.equal(insufficient.cash, 0);
  assert.equal(insufficient.shortfall, 125);
  assert.equal(insufficient.newCredits, 0);
});

test("calculator updates freely above R$50, blocks values below minimum, and preserves live reinvestment", () => {
  const harness = stateHarness();
  const ui = load("app/components/reseller-calculator.tsx", { react: harness.react, "@/lib/site/reseller": reseller });
  const render = () => harness.render(ui.ResellerCalculator);
  let tree = render();
  const input = (id) => tree.find((node) => node.props?.id === id);
  const displayed = () => tree.filter((node) => node.type === "dd").map((node) => node.props.children);
  assert.equal(input("reseller-price").props.min, 25);
  assert.equal(input("reseller-price").props.max, undefined);
  assert.deepEqual(displayed(), [reseller.formatBRL(50), reseller.formatBRL(250), reseller.formatBRL(200), 0]);
  input("reseller-price").props.onChange({ target: { value: "80" } }); tree = render();
  assert.deepEqual(displayed(), [reseller.formatBRL(50), reseller.formatBRL(800), reseller.formatBRL(750), 0]);
  tree.find((node) => node.type === "button").props.onClick(); tree = render();
  assert.equal(displayed()[6], reseller.formatBRL(750));
  input("reinvestment-package").props.onChange({ target: { value: "50" } }); tree = render();
  assert.equal(displayed()[6], reseller.formatBRL(600));
  assert.equal(displayed()[7], 50);
  input("reseller-price").props.onChange({ target: { value: "25.50" } }); tree = render();
  assert.equal(displayed()[1], reseller.formatBRL(255));
  assert.equal(displayed()[6], reseller.formatBRL(55));
  for (const value of ["24", ""]) {
    input("reseller-price").props.onChange({ target: { value } }); tree = render();
    assert.equal(input("reseller-price").props["aria-invalid"], true);
    assert.equal(displayed().length, 0);
  }
  input("reseller-price").props.onChange({ target: { value: "25" } }); tree = render();
  input("reseller-package").props.onChange({ target: { value: "5" } }); tree = render();
  assert.equal(input("reseller-sold").props.value, "5");
  assert.equal(displayed()[0], reseller.formatBRL(30));
});

test("every package opens the existing assistant with reseller context and only finalization offers WhatsApp", () => {
  const listeners = new Map();
  const window = { addEventListener: (type, fn) => listeners.set(type, fn), removeEventListener: (type) => listeners.delete(type), dispatchEvent: (event) => listeners.get(event.type)?.(event) };
  class CustomEvent { constructor(type, options) { this.type = type; this.detail = options.detail; } }
  const harness = stateHarness();
  const buttonUI = load("app/components/reseller-package-button.tsx", { "@/lib/site/reseller": reseller, "./ui-icon": { Icon: () => null } }, { window, CustomEvent });
  const planButtons = load("app/components/plan-assistant-button.tsx", { "./ui-icon": { Icon: () => null } }, { window, CustomEvent });
  const ui = load("app/components/mcz-assistant.tsx", { react: harness.react, "./auth/auth-provider": { useAuth: () => ({ user: null }) }, "./plan-assistant-button": planButtons, "@/lib/site/plans": plans, "@/lib/site/reseller": reseller, "@/lib/site/assistant": engine }, { window });
  const render = () => harness.render(ui.MczAssistant);
  render(); const cleanups = harness.effects.map((fn) => fn());
  for (const pkg of reseller.resellerPackages) {
    const button = buttonUI.ResellerPackageButton({ pkg });
    assert.equal(button.type, "button"); assert.equal(button.props.href, undefined);
    button.props.onClick(); let tree = render();
    assert.ok(tree.some((node) => node.props?.role === "dialog"));
    assert.equal(harness.slots[1].selectedPackage.id, pkg.id);
    assert.equal(harness.slots[1].selectedPlan, undefined);
    assert.equal(harness.slots[1].reply.link, undefined);
    assert.ok(harness.slots[1].reply.text.includes(reseller.packageDescription(pkg)));
    tree.find((node) => node.type === "button" && node.props.children === "Como definir meu preço?").props.onClick(); tree = render();
    assert.equal(harness.slots[1].selectedPackage.id, pkg.id);
    tree.find((node) => node.type === "button" && node.props.children === "Continuar com o pacote escolhido").props.onClick(); tree = render();
    const link = tree.find((node) => node.props?.className === "assistant-contact");
    assert.equal(link.props.target, "_blank"); assert.equal(link.props.rel, "noopener noreferrer");
    const url = new URL(link.props.href);
    assert.equal(url.pathname, "/5582999635731");
    assert.equal(url.searchParams.get("text"), reseller.resellerContactMessage(pkg));
  }
  planButtons.PlanAssistantButton({ plan: plans.plans[0] }).props.onClick(); render();
  assert.equal(harness.slots[1].selectedPackage, undefined);
  assert.equal(harness.slots[1].selectedPlan.id, "mensal");
  for (const cleanup of cleanups) cleanup?.();
  assert.equal(listeners.size, 0);
});
