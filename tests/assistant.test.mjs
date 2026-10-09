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
const whatsapp = load("lib/site/whatsapp.ts");
const plans = load("lib/site/plans.ts", { "./whatsapp": whatsapp });
const compatibility = load("lib/site/compatibility.ts");
const assistant = load("lib/site/assistant.ts", { "./plans": plans, "./compatibility": compatibility, "./whatsapp": whatsapp });

test("welcome offers five guided paths and uses only first name", () => {
  assert.equal(assistant.homeOptions.length, 5);
  assert.equal(assistant.assistantGreeting(null), assistant.welcomeText);
  const greeting = assistant.assistantGreeting("  Ana Maria Silva  ");
  assert.ok(greeting.startsWith("Olá, Ana!"));
  assert.ok(!greeting.includes("Maria"));
  for (const option of assistant.homeOptions) assert.ok(assistant.assistantReply(option.id).text);
});

test("catalog presents only registered plans, prices, periods and descriptions without promotion", () => {
  const reply = assistant.assistantReply("planos");
  assert.equal(reply.options.length, plans.plans.length);
  for (const plan of plans.plans) {
    assert.ok(reply.text.includes(plans.planDescription(plan)));
    assert.ok(assistant.assistantReply(`plano:${plan.id}`).text.includes(plan.summary));
  }
  assert.ok(reply.text.includes("R$25,00 / 1 m\u00eas"));
  assert.ok(!reply.text.includes("15,00"));
  assert.ok(!assistant.homeOptions.some((option) => option.id === "promocao"));
});

test("contracting requires plan choice and creates correctly encoded plan-specific WhatsApp messages", () => {
  const choose = assistant.assistantReply("contratar");
  assert.equal(choose.link, undefined);
  assert.equal(choose.options.length, 4);
  for (const plan of plans.plans) {
    let state = assistant.assistantReducer(assistant.initialAssistantState, { id: `plano:${plan.id}`, label: plan.name });
    assert.equal(state.reply.link, undefined);
    assert.equal(state.selectedPlan.id, plan.id);
    state = assistant.assistantReducer(state, { id: "continuar", label: "Continue" });
    const reply = state.reply;
    const url = new URL(reply.link.href);
    assert.equal(url.origin, "https://wa.me");
    assert.equal(url.pathname, "/5582999635731");
    if (plan.id === "mensal") assert.equal(url.searchParams.get("text"), "Ol\u00e1! Conversei com o Assistente MCZ e gostaria de contratar o plano mensal de R$ 25,00.");
    else assert.ok(url.searchParams.get("text").includes(`Plano escolhido: ${plan.name}`));
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
    assert.equal(url.pathname, "/5582999635731");
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
  assert.equal(state.reply.options.length, 5);
  assert.equal(assistant.initialAssistantState.messages.length, 0);
  assert.equal(assistant.assistantReply("unknown").text, assistant.welcomeText);
});


test("selected plan survives every guided flow and swapping updates summary and contact", () => {
  let state = assistant.assistantReducer(assistant.initialAssistantState, { id: "plano:mensal", label: "Mensal" });
  for (const id of ["detalhes", "funciona", "indicacao", "inicio", "aparelhos", "aparelho:0", "compat:samsung", "planos"]) {
    state = assistant.assistantReducer(state, { id, label: id });
    assert.equal(state.selectedPlan.id, "mensal");
  }
  state = assistant.assistantReducer(state, { id: "trocar", label: "Swap" });
  assert.equal(state.reply.options.length, 4);
  state = assistant.assistantReducer(state, { id: "plano:anual", label: "Anual" });
  assert.equal(state.reply.link, undefined);
  state = assistant.assistantReducer(state, { id: "continuar", label: "Continue" });
  assert.ok(state.reply.text.includes("Plano: Anual"));
  assert.ok(state.reply.text.includes("R$230,00 / 12 meses"));
  const message = new URL(state.reply.link.href).searchParams.get("text");
  assert.ok(message.includes("Samsung"));
  assert.ok(!message.includes("promo"));
  assert.ok(message.includes("Plano escolhido: Anual"));
});

test("final summary contains no device or promotion assumptions", () => {
  let state = assistant.assistantReducer(assistant.initialAssistantState, { id: "plano:trimestral", label: "Trimestral" });
  state = assistant.assistantReducer(state, { id: "continuar", label: "Continue" });
  assert.ok(!state.reply.text.includes("Aparelho/sistema consultado"));
  assert.ok(!state.reply.text.includes("Interesse na"));
});

test("human support uses the official number and the exact MCZ onTV greeting", () => {
  assert.equal(whatsapp.whatsappLink(), "https://wa.me/5582999635731");
  const message = "Ol\u00e1! Vim pelo site MCZ onTV e gostaria de falar com um atendente.";
  assert.equal(assistant.attendantLink, `https://wa.me/5582999635731?text=${encodeURIComponent(message)}`);
  assert.equal(new URL(assistant.attendantLink).searchParams.get("text"), message);
});
