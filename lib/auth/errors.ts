export function authErrorMessage(error: unknown): string {
  const code = error && typeof error === "object" && "code" in error ? error.code : null;
  switch (code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "O login foi cancelado. Você pode tentar novamente quando quiser.";
    case "auth/popup-blocked":
      return "O navegador bloqueou a janela do Google. Permita pop-ups para este site e tente novamente.";
    case "auth/network-request-failed":
      return "Não foi possível conectar. Verifique sua conexão e tente novamente.";
    case "auth/unauthorized-domain":
    case "auth/operation-not-allowed":
    case "auth/invalid-api-key":
    case "auth/configuration-not-found":
      return "O login está indisponível por uma configuração do serviço. Tente novamente mais tarde.";
    default:
      return "Não foi possível concluir a autenticação. Tente novamente.";
  }
}
