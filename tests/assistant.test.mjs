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
const plans = load("lib/site/plans.ts");
const compatibility = load("lib/site/compatibility.ts");
const assistant = load("lib/site/assistant.ts", { "./plans": plans, "./compatibility": compatibility });

test("welcome offers six guided paths and uses only first name", () => {
  assert.equal(assistant.homeOptions.length, 6);
  assert.equal(assistant.assistantGreeting(null), assistant.welcomeText);
  const greeting = assistant.assistantGreeting("  Ana Maria Silva  ");
  assert.ok(greeting.startsWith("Olá, Ana!"));
  assert.ok(!greeting.includes("Maria"));
  for (const option of assistant.homeOptions) assert.ok(assistant.assistantReply(option.id).text);
});

test("plan and promotion responses preserve all prices and explain monthly introductory billing", () => {
  const text = assistant.assistantReply("planos").text;
  for (const plan of plans.plans) assert.ok(text.includes(`R$${plan.price}`));
  assert.ok(text.includes("R$15,00/mês durante os 6 primeiros meses"));
  const promotion = assistant.assistantReply("promocao").text;
  assert.ok(promotion.includes("R$15,00 por mês durante os 6 primeiros meses"));
  assert.ok(promotion.includes("R$25,00"));
  assert.ok(promotion.includes("Para novos clientes"));
});

test("contracting requires plan choice and creates correctly encoded plan-specific WhatsApp messages", () => {
  const choose = assistant.assistantReply("contratar");
  assert.equal(choose.link, undefined);
  assert.equal(choose.options.length, 4);
  for (const plan of plans.plans) {
    const reply = assistant.assistantReply(`plano:${plan.id}`);
    const url = new URL(reply.link.href);
    assert.equal(url.origin, "https://wa.me");
    assert.equal(url.pathname, "/5582994310121");
    assert.ok(url.searchParams.get("text").includes(`Plano de interesse: ${plan.name}.`));
    assert.ok(url.searchParams.get("text").includes("Assistente MCZ"));
  }
});

test("compatibility asks the system first and uses only the supplied application matrix", () => {
  assert.equal(assistant.assistantReply("aparelhos").options.length, 5);
  for (const device of assistant.deviceOptions) {
    const reply = assistant.assistantReply(device.id);
    assert.ok(reply.options.length > 0);
    assert.ok(new URL(reply.link.href).searchParams.get("text").includes(device.label));
  }
  const expected = { samsung: ["IBO Pro", "BOB Player", "VU Player Pro"], lg: ["IBO Pro", "BOB Player", "VU Player Pro"], roku: ["IBO Pro", "Easy Player"], "android-tv": ["BOB Player"], philips: ["VU Player Pro"], vidaa: ["VU Player Pro"], "outra-tv": [], "box-android": ["BOB Player"], "box-nao-sei": [], "box-outro": [], "celular-android": [], iphone: ["IBO Pro", "VU Player Pro"], "tablet-android": [], ipad: ["IBO Pro", "VU Player Pro"], windows: ["IBO Pro"] };
  for (const system of compatibility.compatibility.flatMap((device) => device.systems)) {
    assert.deepEqual(Array.from(system.apps), expected[system.id]);
    const reply = assistant.assistantReply(`compat:${system.id}`);
    for (const app of system.apps) assert.ok(reply.text.includes(`• ${app}`));
    assert.ok(reply.text.includes(system.note));
    const url = new URL(reply.link.href);
    assert.equal(url.pathname, "/5582994310121");
    assert.ok(url.searchParams.get("text").includes(system.message));
    assert.deepEqual(Array.from(reply.options, (option) => option.id), ["planos", "aparelhos", "inicio"]);
  }
});

test("attendant context follows compatibility choices and survives viewing plans without mixing devices", () => {
  let state = assistant.assistantReducer(assistant.initialAssistantState, { id: "compat:samsung", label: "Samsung" });
  const samsung = state.compatibilityContact;
  assert.ok(new URL(samsung).searchParams.get("text").includes("Samsung"));
  state = assistant.assistantReducer(state, { id: "planos", label: "Ver planos" });
  assert.equal(state.compatibilityContact, samsung);
  state = assistant.assistantReducer(state, { id: "compat:philips", label: "Philips" });
  assert.ok(new URL(state.compatibilityContact).searchParams.get("text").includes("Philips"));
  assert.ok(!new URL(state.compatibilityContact).searchParams.get("text").includes("Samsung"));
  state = assistant.assistantReducer(state, { id: "inicio", label: "Voltar ao início" });
  assert.equal(state.compatibilityContact, undefined);
});

test("referral requires first payment and guided history survives returning home", () => {
  assert.ok(assistant.assistantReply("indicacao").text.includes("confirmação do primeiro pagamento"));
  assert.ok(assistant.assistantReply("funciona").text.includes("Não processo pagamentos"));
  let state = assistant.assistantReducer(assistant.initialAssistantState, assistant.homeOptions[0]);
  state = assistant.assistantReducer(state, { id: "inicio", label: "Voltar ao início" });
  assert.equal(state.messages.length, 4);
  assert.equal(state.reply.options.length, 6);
  assert.equal(assistant.initialAssistantState.messages.length, 0);
  assert.equal(assistant.assistantReply("unknown").text, assistant.welcomeText);
});
