import { whatsappLink as createWhatsappLink } from "./whatsapp";

export const plans = [
  { id: "mensal", name: "Mensal", price: "25,00", months: 1, period: "/mês", summary: "Um mês de entretenimento por vez." },
  { id: "trimestral", name: "Trimestral", price: "60,00", months: 3, period: "— 3 meses", summary: "Planeje seus próximos três meses." },
  { id: "semestral", name: "Semestral", price: "120,00", months: 6, period: "— 6 meses", summary: "Seis meses para aproveitar." },
  { id: "anual", name: "Anual", price: "230,00", months: 12, period: "— 12 meses", summary: "Seu entretenimento para o ano todo.", badge: "MELHOR CUSTO-BENEFÍCIO" },
] as const;

export type Plan = (typeof plans)[number];

export function planDuration(plan: Plan): string {
  return `${plan.months} ${plan.months === 1 ? "mês" : "meses"}`;
}

export function planValue(plan: Plan): string {
  return `R$${plan.price} / ${planDuration(plan)}`;
}

export function planDescription(plan: Plan): string {
  return `${plan.name} — ${planValue(plan)}\n${plan.summary}`;
}

export function whatsappLink(plan?: Plan): string {
  const message = plan
    ? `Olá, MCZ onTV! Quero contratar o plano ${plan.name}: ${planValue(plan)}. Pode me informar as condições e orientar a contratação?`
    : "Olá, MCZ onTV! Gostaria de conhecer os planos e as condições de contratação.";
  return createWhatsappLink(message);
}
