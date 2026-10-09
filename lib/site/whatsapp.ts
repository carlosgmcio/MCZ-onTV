export const whatsappNumber = "5582999635731";
export const whatsappDisplayNumber = "(82) 99963-5731";
export const attendantMessage = "Olá! Vim pelo site MCZ onTV e gostaria de falar com um atendente.";

export function whatsappLink(message?: string): string {
  const url = `https://wa.me/${whatsappNumber}`;
  return message ? `${url}?text=${encodeURIComponent(message)}` : url;
}

export const attendantLink = whatsappLink(attendantMessage);
