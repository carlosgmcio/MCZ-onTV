import { plans, promotion, whatsappNumber } from "./plans";
import { compatibility } from "./compatibility";

export type AssistantOption = { id: string; label: string };
export type AssistantReply = {
  text: string;
  options: AssistantOption[];
  link?: { label: string; href: string };
};
export const welcomeText = "Olá! 👋 Sou o Assistente MCZ. Posso te ajudar a conhecer nossos planos, entender como funciona, verificar a compatibilidade do seu aparelho ou falar sobre nossa promoção. Como posso ajudar?";
export const homeOptions: AssistantOption[] = [
  { id: "planos", label: "📺 Ver planos" },
  { id: "promocao", label: "🔥 Promoção R$15" },
  { id: "aparelhos", label: "📱 Meu aparelho funciona?" },
  { id: "funciona", label: "❓ Como funciona?" },
  { id: "indicacao", label: "🎁 Indique e Ganhe" },
  { id: "contratar", label: "💬 Quero contratar" },
];
export const deviceOptions = compatibility.map(({ id, label }) => ({ id, label }));

function contactLink(message: string) {
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}
export const attendantLink = contactLink("Olá! Conversei com o Assistente MCZ pelo site e gostaria de falar com um atendente.");

// Pure local flow engine: the UI only consumes replies and options.
// A future provider can use the same reply format without changing this UI.
export function assistantReply(id: string): AssistantReply {
  const flows: Record<string, AssistantReply> = {
    inicio: { text: welcomeText, options: homeOptions },
    planos: {
      text: plans.map((plan) => `${plan.name} — R$${plan.price}${plan.id === "mensal" ? "/mês" : ` / ${plan.months} meses`}`).join("\n") + `\n\nPara novos clientes: R$${promotion.price}/mês durante os ${promotion.months} primeiros meses. Após esse período: R$${promotion.regularPrice}/mês.`,
      options: [{ id: "contratar", label: "💬 Quero contratar" }],
    },
    promocao: { text: `Para novos clientes, a MCZ onTV está com R$${promotion.price} por mês durante os ${promotion.months} primeiros meses. Depois desse período, o valor mensal é R$${promotion.regularPrice}.`, options: [{ id: "contratar", label: "💬 Quero contratar" }] },
    aparelhos: { text: "Qual tipo de aparelho você usa? A compatibilidade depende do modelo, sistema e aplicativos disponíveis. Vamos conferir com o atendimento antes de contratar.", options: deviceOptions, link: { label: "Consultar meu aparelho com um atendente", href: contactLink("Olá! Conversei com o Assistente MCZ e quero consultar a compatibilidade do meu aparelho. Posso informar o modelo e o sistema ao atendente.") } },
    funciona: { text: "1. Escolha o plano.\n2. Tire suas dúvidas.\n3. Fale com nosso atendente.\n4. Finalize sua contratação e receba as orientações.\n\nSou um assistente virtual com respostas guiadas. Não processo pagamentos; a contratação é feita pelo atendimento.", options: [{ id: "contratar", label: "💬 Quero contratar" }] },
    indicacao: { text: "Indique um novo cliente. Após a contratação e confirmação do primeiro pagamento do indicado, você ganha 1 mês grátis.", options: [], link: { label: "🎁 Falar sobre minha indicação", href: contactLink("Olá! Conversei com o Assistente MCZ e quero participar do Indique e Ganhe.") } },
    contratar: { text: "Ótimo! 😊 Vou te encaminhar para um atendente da MCZ onTV para finalizar sua contratação.\n\nQual é o plano de interesse?", options: plans.map((plan) => ({ id: `plano:${plan.id}`, label: plan.name })) },
  };
  if (flows[id]) return flows[id];
  const plan = plans.find((plan) => id === `plano:${plan.id}`);
  if (plan) return {
    text: `Plano de interesse: ${plan.name}. Clique abaixo para abrir o WhatsApp e enviar sua mensagem. Nenhum pagamento é processado pelo assistente.`,
    options: [{ id: "contratar", label: "Escolher outro plano" }],
    link: { label: "💬 FINALIZAR COM ATENDENTE", href: contactLink(`Olá! Conversei com o Assistente MCZ pelo site e quero finalizar minha contratação. Plano de interesse: ${plan.name}.`) },
  };
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

export type AssistantState = { messages: { role: "user" | "assistant"; text: string }[]; reply: AssistantReply; compatibilityContact?: string };
export const initialAssistantState: AssistantState = { messages: [], reply: assistantReply("inicio") };
export function assistantReducer(state: AssistantState, option: AssistantOption): AssistantState {
  const reply = assistantReply(option.id);
  const compatibilityContact = option.id === "inicio" || option.id === "aparelhos" ? undefined
    : option.id.startsWith("aparelho:") || option.id.startsWith("compat:") ? reply.link?.href : state.compatibilityContact;
  return { reply, compatibilityContact, messages: [...state.messages, { role: "user", text: option.label }, { role: "assistant", text: reply.text }] };
}

export function assistantGreeting(displayName?: string | null): string {
  const firstName = displayName?.trim().split(/\s+/)[0];
  return firstName ? welcomeText.replace("Olá!", `Olá, ${firstName}!`) : welcomeText;
}
