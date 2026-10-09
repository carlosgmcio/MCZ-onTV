import { whatsappLink as contactLink } from "./whatsapp";
export { attendantLink } from "./whatsapp";
import { plans, planValue, planDescription, type Plan } from "./plans";
export { planValue } from "./plans";
import { compatibility } from "./compatibility";
import { resellerPackages, packageDescription, resellerContactMessage, resalePriceNotice, resellerDisclaimer, type ResellerPackage } from "./reseller";

export type AssistantOption = { id: string; label: string };
export type AssistantReply = {
  text: string;
  options: AssistantOption[];
  link?: { label: string; href: string };
};
export const welcomeText = "Olá! 👋 Sou o Assistente MCZ, com respostas guiadas por opções. Posso te ajudar a conhecer nossos planos, entender como funciona e verificar a compatibilidade do seu aparelho. Como posso ajudar?";
export const homeOptions: AssistantOption[] = [
  { id: "planos", label: "📺 Ver planos" },
  { id: "aparelhos", label: "📱 Meu aparelho funciona?" },
  { id: "funciona", label: "❓ Como funciona?" },
  { id: "indicacao", label: "🎁 Indique e Ganhe" },
  { id: "contratar", label: "💬 Quero contratar" },
];
export const deviceOptions = compatibility.map(({ id, label }) => ({ id, label }));

// Pure local flow engine: the UI only consumes replies and options.
// A future provider can use the same reply format without changing this UI.
function finalContact(plan: Plan, consultedDevice?: string) {
  if (plan.id === "mensal") return { label: "💬 Finalizar com atendente", href: contactLink(`Olá! Conversei com o Assistente MCZ e gostaria de contratar o plano mensal de R$ ${plan.price}.`) };
  return { label: "💬 Finalizar com atendente", href: contactLink(`Olá! Vim pelo site MCZ onTV e conversei com o Assistente MCZ.\n\nQuero finalizar minha contratação.\n\nPlano escolhido: ${plan.name}\nValor: ${planValue(plan)}${consultedDevice ? `\nAparelho/sistema consultado: ${consultedDevice}` : ""}\n\nGostaria de continuar o atendimento.`) };
}
const choosePlans = plans.map((plan) => ({ id: `plano:${plan.id}`, label: `${plan.name} — ${planValue(plan)}` }));
const planOptions: AssistantOption[] = [
  { id: "aparelhos", label: "📺 Verificar meu aparelho" },
  { id: "detalhes", label: "💳 Ver detalhes do plano" },
  { id: "funciona", label: "❓ Tirar uma dúvida" },
  { id: "continuar", label: "✅ Continuar contratação" },
  { id: "trocar", label: "🔄 Escolher outro plano" },
];
export function resellerAttendantLink(pkg: ResellerPackage): string {
  return contactLink(resellerContactMessage(pkg));
}
const resellerOptions: AssistantOption[] = [
  { id: "revenda:pacotes", label: "Ver outros pacotes" },
  { id: "revenda:preco", label: "Como definir meu preço?" },
  { id: "revenda:funciona", label: "Como funciona a revenda?" },
  { id: "revenda:continuar", label: "Continuar com o pacote escolhido" },
];
function resellerReply(id: string, pkg?: ResellerPackage): AssistantReply {
  if (id === "revenda:pacotes" || !pkg) return {
    text: `Atendimento: Revenda\n\nPacotes cadastrados:\n${resellerPackages.map(packageDescription).join("\n")}\n\nEscolha o pacote para conversar com o atendimento.`,
    options: resellerPackages.map((item) => ({ id: `revenda:pacote:${item.id}`, label: packageDescription(item) })),
  };
  if (id === "revenda:preco") return { text: `${resalePriceNotice}\n\n${resellerDisclaimer}`, options: resellerOptions };
  if (id === "revenda:funciona") return {
    text: "Escolha seu pacote e confirme as condições com o atendimento humano. Após a confirmação, receba os créditos conforme as condições contratadas e revenda aos seus clientes. O site não compra créditos nem realiza cobranças automaticamente.\n\n" + resellerDisclaimer,
    options: resellerOptions,
  };
  if (id === "revenda:continuar") return {
    text: `Atendimento: Revenda\nPacote escolhido: ${packageDescription(pkg)}\n\nFinalize com o atendente para confirmar as condições. A mensagem será aberta no WhatsApp e você poderá enviá-la.`,
    options: resellerOptions.filter((option) => option.id !== "revenda:continuar"),
    link: { label: "💬 Finalizar com atendente", href: resellerAttendantLink(pkg) },
  };
  return {
    text: `Atendimento: Revenda\n\n${resellerContactMessage(pkg)}\n${packageDescription(pkg)}\n\nVocê pode conhecer os outros pacotes, tirar dúvidas sobre preço ou continuar com o atendimento humano.`,
    options: resellerOptions,
  };
}
export function assistantReply(id: string, context?: Pick<AssistantState, "selectedPlan" | "consultedDevice">): AssistantReply {
  const selected = plans.find((plan) => id === `plano:${plan.id}`) ?? context?.selectedPlan;
  if (id.startsWith("plano:") && selected) return {
    text: `Você selecionou:\n\n${planDescription(selected)}\n\nVocê pode tirar dúvidas e verificar seu aparelho. Quando decidir contratar, escolha Continuar contratação para finalizar com o atendimento humano. Nenhuma contratação ou cobrança é feita pelo assistente.`, options: planOptions,
  };
  if (id === "trocar" || (id === "contratar" && !selected)) return { text: `Qual plano você deseja escolher?\n\n${plans.map(planDescription).join("\n\n")}`, options: choosePlans };
  if ((id === "continuar" || id === "contratar") && selected) {
    const details = `Plano: ${selected.name}\nValor: ${planValue(selected)}`;
    const extra = context?.consultedDevice ? `\nAparelho/sistema consultado: ${context.consultedDevice}` : "";
    return { text: `Confira sua escolha:\n\n${details}${extra}\n\nClique em Finalizar com atendente para abrir o WhatsApp. A contratação e o pagamento serão combinados com o atendimento humano.`, options: [{ id: "trocar", label: "🔄 Escolher outro plano" }, { id: `plano:${selected.id}`, label: "↩ Voltar" }], link: finalContact(selected, context?.consultedDevice) };
  }
  if (id === "detalhes" && selected) return { text: `Plano ${selected.name}\nValor: ${planValue(selected)}\n${selected.summary}`, options: planOptions };

  const flows: Record<string, AssistantReply> = {
    inicio: { text: welcomeText, options: homeOptions },
    planos: {
      text: plans.map(planDescription).join("\n\n"),
      options: choosePlans,
    },
    aparelhos: { text: "Qual tipo de aparelho você usa? A compatibilidade depende do modelo, sistema e aplicativos disponíveis. Vamos conferir com o atendimento antes de contratar.", options: deviceOptions, link: { label: "Consultar meu aparelho com um atendente", href: contactLink("Olá! Conversei com o Assistente MCZ e quero consultar a compatibilidade do meu aparelho. Posso informar o modelo e o sistema ao atendente.") } },
    funciona: { text: "1. Escolha o plano.\n2. Tire suas dúvidas.\n3. Fale com nosso atendente.\n4. Finalize sua contratação e receba as orientações.\n\nSou um assistente virtual com respostas guiadas. Não processo pagamentos; a contratação é feita pelo atendimento.", options: [{ id: "contratar", label: "💬 Quero contratar" }] },
    indicacao: { text: "Indique um novo cliente. Após a contratação e confirmação do primeiro pagamento do indicado, você ganha 1 mês grátis.", options: [], link: { label: "🎁 Falar sobre minha indicação", href: contactLink("Olá! Conversei com o Assistente MCZ e quero participar do Indique e Ganhe.") } },
  };
  if (flows[id]) return flows[id];
  const device = compatibility.find((option) => option.id === id);
  if (device) return {
    text: device.question,
    options: device.systems.map(({ id, label }) => ({ id: `compat:${id}`, label })),
    link: { label: "💬 VERIFICAR COM ATENDENTE", href: contactLink(`Olá! Vim pelo Assistente MCZ do site. Utilizo ${device.label} e gostaria de verificar a compatibilidade do meu aparelho.`) },
  };
  const system = compatibility.flatMap((device) => device.systems).find((system) => id === `compat:${system.id}`);
  if (system) return {
    text: [system.text, ...system.apps.map((app) => `• ${app}`), "", system.note].join("\n"),
    options: [{ id: "planos", label: "💳 Quero conhecer os planos" }, { id: "aparelhos", label: "↩ Voltar aos aparelhos" }, { id: "inicio", label: "🏠 Voltar ao início" }],
    link: { label: system.contactLabel, href: contactLink(`Olá! Vim pelo Assistente MCZ do site. ${system.message}`) },
  };
  return flows.inicio;
}

export type AssistantState = { messages: { role: "user" | "assistant"; text: string }[]; reply: AssistantReply; compatibilityContact?: string; selectedPlan?: Plan; consultedDevice?: string; selectedPackage?: ResellerPackage };
export const initialAssistantState: AssistantState = { messages: [], reply: assistantReply("inicio") };
export function assistantReducer(state: AssistantState, option: AssistantOption): AssistantState {
  if (option.id.startsWith("revenda:")) {
    const selectedPackage = resellerPackages.find((pkg) => option.id === `revenda:pacote:${pkg.id}`) ?? state.selectedPackage;
    const reply = resellerReply(option.id, selectedPackage);
    return { reply, selectedPackage, messages: [...state.messages, { role: "user", text: option.label }, { role: "assistant", text: reply.text }] };
  }
  const selectedPlan = plans.find((plan) => option.id === `plano:${plan.id}`) ?? state.selectedPlan;
  const device = compatibility.find((device) => device.id === option.id);
  const system = compatibility.flatMap((device) => device.systems).find((system) => option.id === `compat:${system.id}`);
  const systemDevice = compatibility.find((device) => device.systems.some((entry) => entry.id === system?.id));
  const consultedDevice = option.id === "aparelhos" ? undefined : system ? `${systemDevice?.label}: ${system.label}` : device?.label ?? state.consultedDevice;
  const reply = assistantReply(option.id, { selectedPlan, consultedDevice });
  if (selectedPlan && !["continuar", "contratar", "trocar"].includes(option.id) && !option.id.startsWith("plano:")) {
    reply.options = [...reply.options.filter((item) => !["contratar", "continuar", "trocar"].includes(item.id)), { id: "continuar", label: "✅ Continuar contratação" }, { id: "trocar", label: "🔄 Escolher outro plano" }];
  }
  const compatibilityContact = option.id === "inicio" || option.id === "aparelhos" ? undefined
    : option.id.startsWith("aparelho:") || option.id.startsWith("compat:") ? reply.link?.href : state.compatibilityContact;
  return { reply, compatibilityContact, selectedPlan, consultedDevice, messages: [...state.messages, { role: "user", text: option.label }, { role: "assistant", text: reply.text }] };
}

export function assistantGreeting(displayName?: string | null): string {
  const firstName = displayName?.trim().split(/\s+/)[0];
  return firstName ? welcomeText.replace("Olá!", `Olá, ${firstName}!`) : welcomeText;
}
