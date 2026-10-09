export const resellerPackages = [
  { id: "5", credits: 5, price: 30 },
  { id: "10", credits: 10, price: 50 },
  { id: "20", credits: 20, price: 90 },
  { id: "50", credits: 50, price: 200 },
  { id: "100", credits: 100, price: 375 },
  { id: "500", credits: 500, price: 1750 },
] as const;

export type ResellerPackage = (typeof resellerPackages)[number];
export const minimumResalePrice = 25;
export const resaleExamples = [25, 30, 35, 40, 50] as const;
export const starterPackage = resellerPackages[1];
export const resellerAssistantOpenEvent = "mcz-assistant-reseller-open";
export const resalePriceNotice = "Você escolhe seu preço de revenda, respeitando o mínimo de R$ 25,00 por crédito. Os ganhos apresentados são simulações e dependem das vendas realizadas.";
export const resellerDisclaimer = "Os valores apresentados no simulador são estimativas de faturamento e resultado bruto. Não representam garantia de vendas ou lucro. Taxas, impostos e outros custos não estão incluídos.";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export function formatBRL(value: number): string { return currency.format(value); }
export function packageDescription(pkg: ResellerPackage): string {
  return `${pkg.credits} créditos por ${formatBRL(pkg.price)} (custo unitário: ${formatBRL(pkg.price / pkg.credits)})`;
}
export function resellerContactMessage(pkg: ResellerPackage): string {
  return `Olá! Quero começar a revender MCZ onTV e tenho interesse no pacote de ${pkg.credits} créditos por ${formatBRL(pkg.price)}.`;
}

export function calculateResale(pkg: ResellerPackage, salePrice: number, soldCredits: number) {
  const priceCents = Math.round(salePrice * 100);
  const revenueCents = priceCents * soldCredits;
  if (!Number.isFinite(salePrice) || salePrice < minimumResalePrice || !Number.isSafeInteger(priceCents)
    || !Number.isSafeInteger(revenueCents) || !Number.isInteger(soldCredits) || soldCredits < 0 || soldCredits > pkg.credits) return null;
  return {
    investment: pkg.price,
    revenue: revenueCents / 100,
    grossProfit: (revenueCents - pkg.price * 100) / 100,
    remainingCredits: pkg.credits - soldCredits,
  };
}

export function calculateReinvestment(revenue: number, pkg: ResellerPackage) {
  // Reinvest from received revenue; the first package's cost is not deducted again.
  const balance = (Math.round(revenue * 100) - pkg.price * 100) / 100;
  return { received: revenue, investment: pkg.price, cash: Math.max(0, balance), shortfall: Math.max(0, -balance), newCredits: balance >= 0 ? pkg.credits : 0 };
}
