export const promotion = {
  price: "15,00",
  months: 6,
  regularPrice: "25,00",
  description: "R$15,00/mês durante os 6 primeiros meses. Após esse período, R$25,00/mês.",
  eligibility: "Oferta válida exclusivamente para novos clientes.",
};

export const plans = [
  { id: "mensal", name: "Mensal", price: "25,00", months: 1, period: "/mês", summary: "Um mês de entretenimento por vez." },
  { id: "trimestral", name: "Trimestral", price: "60,00", months: 3, period: "— 3 meses", summary: "Planeje seus próximos três meses." },
  { id: "semestral", name: "Semestral", price: "120,00", months: 6, period: "— 6 meses", summary: "Seis meses para aproveitar." },
  { id: "anual", name: "Anual", price: "230,00", months: 12, period: "— 12 meses", summary: "Seu entretenimento para o ano todo.", badge: "MELHOR CUSTO-BENEFÍCIO" },
] as const;

export type Plan = (typeof plans)[number];

export const whatsappNumber = "5582994310121";
export const whatsappDisplayNumber = "(82) 99431-0121";

export function whatsappLink(plan?: Plan): string {
  const message = plan
    ? `Olá, MCZ onTV! Quero contratar o plano ${plan.name}: R$${plan.price}${plan.period}. ${plan.id === "mensal" ? `Gostaria de consultar a oferta para novos clientes: ${promotion.description} ` : ""}Pode me informar as condições e orientar a contratação?`
    : "Olá, MCZ onTV! Gostaria de conhecer os planos e as condições de contratação.";
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}
