export type CompatibilitySystem = { id: string; label: string; text: string; apps: string[]; note: string; needsConfirmation: boolean; contactLabel: string; message: string };
const help = "💬 Preciso de ajuda para instalar";
const verify = "💬 VERIFICAR COM ATENDENTE";
function system(id: string, label: string, text: string, apps: string[], note: string, message: string, contactLabel = help): CompatibilitySystem {
  return { id, label, text, apps, note, message, contactLabel, needsConfirmation: true };
}
function unknown(id: string, label: string, message: string) {
  return system(id, label, "Sem problema 😊 Um atendente pode conferir a compatibilidade para você.", [], "Se possível, tenha em mãos a marca e o modelo do seu aparelho.", message, verify);
}
function android(device: string) {
  return system(`${device}-android`, "Android", "Ainda não há um aplicativo confirmado nesta configuração para este dispositivo Android.", [], "Um atendente pode verificar as opções para seu modelo e sistema.", `Utilizo ${device} Android e gostaria de verificar a compatibilidade e os aplicativos disponíveis.`, verify);
}
export const compatibility = [
  { id: "aparelho:0", label: "📺 Smart TV", question: "Qual é o sistema ou a marca da sua Smart TV?", systems: [
    system("samsung", "Samsung", "Para Smart TVs Samsung mais novas, temos estas opções de aplicativo:", ["IBO Pro", "BOB Player", "VU Player Pro"], "A disponibilidade do aplicativo pode variar conforme o modelo/ano da TV.", "Minha TV é Samsung e gostaria de ajuda para verificar o aplicativo e realizar a configuração."),
    system("lg", "LG", "Para Smart TVs LG mais novas, temos estas opções de aplicativo:", ["IBO Pro", "BOB Player", "VU Player Pro"], "A disponibilidade pode variar conforme o modelo/ano e a loja de aplicativos da TV.", "Minha TV é LG e gostaria de ajuda para verificar o aplicativo e realizar a configuração."),
    system("roku", "Roku TV", "Para aparelhos com sistema Roku, temos estas opções:", ["IBO Pro", "Easy Player"], "Confira a disponibilidade na loja do seu aparelho.", "Utilizo Roku e gostaria de ajuda para configurar o serviço."),
    system("android-tv", "Android TV / Google TV", "Para aparelhos com sistema Android, temos como opção:", ["BOB Player"], "Confira o modelo e a disponibilidade do aplicativo no seu aparelho.", "Utilizo Android TV / Google TV e gostaria de ajuda para configurar o BOB Player."),
    system("philips", "Philips", "Em TVs Philips, temos compatibilidade com VU Player Pro em determinados modelos.", ["VU Player Pro"], "A compatibilidade depende do modelo/sistema da sua Philips.", "Tenho uma TV Philips e gostaria de confirmar se meu modelo é compatível.", "💬 Confirmar meu modelo"),
    system("vidaa", "VIDAA", "Para aparelhos com sistema VIDAA, temos como opção:", ["VU Player Pro"], "A disponibilidade pode variar conforme o modelo e a loja de aplicativos.", "Utilizo uma TV com sistema VIDAA e gostaria de confirmar a disponibilidade e configurar o VU Player Pro."),
    unknown("outra-tv", "Não sei / Outra TV", "Gostaria de verificar a compatibilidade da minha TV. Vou informar a marca e o modelo ao atendente."),
  ] },
  { id: "aparelho:1", label: "📦 TV Box", question: "Sua TV Box utiliza Android?", systems: [
    system("box-android", "Sim, é Android", "Para TV Box com Android, temos como opção:", ["BOB Player"], "A compatibilidade deve ser conferida conforme o modelo e o sistema da TV Box.", "Minha TV Box utiliza Android e gostaria de ajuda para verificar e configurar o BOB Player."),
    unknown("box-nao-sei", "Não sei", "Não sei qual é o sistema da minha TV Box e gostaria de verificar a compatibilidade."),
    unknown("box-outro", "Outro sistema", "Minha TV Box utiliza outro sistema e gostaria de verificar a compatibilidade."),
  ] },
  { id: "aparelho:2", label: "📱 Celular", question: "Qual sistema seu celular utiliza?", systems: [
    { ...android("celular"), label: "🤖 Android" },
    system("iphone", "🍎 iPhone (iOS)", "Para iPhone/iOS, temos estas opções:", ["IBO Pro", "VU Player Pro"], "Confira a disponibilidade para a versão do seu sistema.", "Utilizo iPhone (iOS) e gostaria de ajuda para instalar e configurar o IBO Pro ou VU Player Pro."),
  ] },
  { id: "aparelho:3", label: "📲 Tablet", question: "Seu tablet é Android ou iPad?", systems: [
    android("tablet"),
    system("ipad", "iPad (iOS/iPadOS)", "Para iPad/iOS, temos estas opções:", ["IBO Pro", "VU Player Pro"], "Confira a disponibilidade para a versão do seu sistema.", "Utilizo iPad (iOS/iPadOS) e gostaria de ajuda para instalar e configurar o IBO Pro ou VU Player Pro."),
  ] },
  { id: "aparelho:4", label: "💻 Computador", question: "Qual sistema você utiliza?", systems: [
    system("windows", "Windows 10/11", "Para Windows 10/11, temos como opção:", ["IBO Pro"], "Se precisar, nosso atendimento pode orientar você durante a configuração.", "Utilizo Windows 10/11 e gostaria de ajuda para configurar o IBO Pro."),
  ] },
];
