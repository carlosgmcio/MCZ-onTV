# MCZ onTV

## Avaliações de clientes

Avaliações reais com login Google, Firestore e moderação manual. Novos relatos
ficam `pending`; apenas `approved` aparece publicamente. Uma avaliação por conta.
Veja [configuração, regras e aprovação segura](docs/reviews.md) antes de ativar:
é necessário publicar as regras e criar o índice no Firebase existente.

## Assistente Virtual MCZ

O botão flutuante abre um atendimento guiado com respostas locais, sem API de
IA, servidor de chat ou processamento de pagamentos. “Online” indica que o
assistente virtual está disponível; não representa a presença de um atendente
humano. A janela identifica explicitamente as respostas como guiadas.

Edite perguntas, respostas e opções em `lib/site/assistant.ts`. Os preços e a
promoção vêm de `lib/site/plans.ts`, sem uma segunda tabela de preços. Os links
de contratação incluem o plano escolhido e usam o número já configurado no site.
Compatibilidade depende do aparelho e é encaminhada ao atendimento. Nenhuma
mensagem é enviada automaticamente: o visitante abre o WhatsApp e a envia.

As marcas, sistemas e aplicativos do fluxo de compatibilidade ficam em
`lib/site/compatibility.ts`: tipo de aparelho → sistemas/marcas → aplicativos,
observações, necessidade de confirmação e mensagem de atendimento. Cadastre
somente compatibilidades confirmadas. Celulares e tablets Android permanecem
sem aplicativos cadastrados e são encaminhados ao atendente; as opções Android
de TV/TV Box não são automaticamente atribuídas a celulares ou tablets.
O botão permanente “Falar com atendente” preserva o contexto de compatibilidade
selecionado, mesmo ao consultar os planos. Voltar aos aparelhos/início reinicia
esse contexto sem apagar o histórico.

A interface está em `app/components/mcz-assistant.tsx`, montada no layout para
preservar o histórico durante a navegação interna. Minimizar ou fechar oculta a
janela sem apagar a conversa; recarregar a página reinicia o histórico. Apenas
o primeiro nome do Google é usado na saudação, quando disponível. O assistente
também pode ser usado sem login e não solicita dados pessoais.

`assistantReply` é o motor local e retorna texto, opções e um link opcional.
Esse formato separa a interface dos fluxos para uma futura integração com outro
provedor. Nenhuma integração de IA foi implementada agora.

Teste todos os fluxos com `node --test tests/*.test.mjs`.

## Demonstrações nas telas dos planos

Os quatro vídeos são configurados em **`lib/site/plan-demos.ts`**, no bloco
`planDemos`. Cada linha corresponde ao plano: `mensal`, `trimestral`, `semestral`
e `anual`. Não é necessário alterar os componentes.

Enquanto a linha estiver como `mensal: null` (ou outro plano), a tela mantém
o visual cinematográfico e o clique abre um aviso de demonstração em preparação,
sem player vazio. Os quatro embeds do YouTube fornecidos estão cadastrados:
Mensal (`GLp1eBhgKuw`), Trimestral (`pILMPnUKlQI`), Semestral (`2UFvjFrDlx0`)
e Anual (`UuJ-wZTXEbk`). Os vídeos são reproduzidos diretamente pelo YouTube;
nenhum vídeo foi baixado ou armazenado no projeto.

**Para usar um MP4 próprio ou licenciado:**

1. Coloque o arquivo dentro da pasta `public/videos`. Use um nome simples,
   sem espaços ou acentos, por exemplo `demonstracao-mensal.mp4`.
2. Substitua apenas a linha do plano desejado por:

```ts
mensal: { type: "mp4", url: "/videos/demonstracao-mensal.mp4" },
```

Esse caminho é um exemplo de arquivo local: o arquivo precisa existir.
Não inclua `public` no endereço. Os arquivos dessa pasta ficam acessíveis
publicamente; use somente conteúdo com autorização para essa distribuição.

**Para usar um vídeo incorporado de uma fonte oficial/autorizada:**

1. No vídeo oficial, procure a opção Compartilhar → Incorporar.
2. Copie somente o endereço HTTPS do atributo `src` do iframe fornecido pelo
   publicador. Não cole o HTML inteiro nem o endereço comum da página do vídeo.
3. Troque a linha do plano por `{ type: "embed", url: "" }` e cole o endereço
   autorizado entre as aspas de `url`. Uma URL vazia continua mostrando o aviso.

O publicador deve permitir incorporação no seu domínio. O player do YouTube só
é criado depois do clique no monitor, com `autoplay=1` e `playsinline=1`.
Se o navegador bloquear a reprodução automática, use o Play do próprio player.
Outros embeds mantêm `autoplay=0`. Teste a URL no modal após salvar; bloqueios de
incorporação de terceiros dependem do publicador.

Repita para os outros planos para ter quatro vídeos diferentes. Para retirar
uma demonstração, volte a linha para `null`. Não baixe ou redistribua trechos
de filmes/séries sem autorização. MP4 ausente ou inválido mostra um aviso.

Os mini-previews do YouTube carregam perto da viewport (margem de 160px) no
desktop. No mobile, apenas o monitor com maior proporção visível reproduz.
Os previews usam autoplay silencioso, sem controles, e loop com playlist do
próprio vídeo. Saindo da área observada, o iframe é removido. Eles também são
suspensos quando a aba fica oculta ou um modal de demonstração está aberto.
Ao fechar o modal, podem retornar conforme a visibilidade. Com preferência
por redução de movimento, permanecem as thumbnails estáticas. Nenhum vídeo é
baixado. Bloqueios de autoplay/incorporação do navegador ou YouTube podem manter
o preview estático; o botão para abrir o modal continua disponível.

O player grande só é carregado após clicar no monitor. O modal mantém proporção 16:9,
fecha pelo X, por Esc ou pelo fundo, interrompe o vídeo ao fechar e devolve
o foco ao monitor. O texto abaixo é: “Conteúdo demonstrativo. A disponibilidade
pode variar.” Nada muda nos preços, promoção, autenticação ou WhatsApp.

Frontend Next.js + TypeScript + Tailwind CSS. Reutiliza o Firebase Authentication
Web com Google do projeto existente. Não há checkout, cobrança automática,
ativação automática ou sistema de pedidos. O Firestore é usado somente nas
avaliações com moderação.

## Fluxo

- `/`: oferta pública para novos clientes e login com Google.
- `/inicio`: site completo, exibido após a confirmação da sessão pelo Firebase.
- Usuários com sessão válida são enviados diretamente para `/inicio`.
- Sair da conta encerra a sessão e retorna à oferta pública.
- `/meus-pedidos`: redireciona bookmarks antigos à entrada, sem funcionalidades
  de pedidos ou conteúdo do projeto comercial anterior.

A oferta é **R$15,00/mês durante os 6 primeiros meses**; depois, R$25,00/mês.
É exclusiva para novos clientes. Os demais planos são R$60,00 por 3 meses,
R$120,00 por 6 meses e R$230,00 por 12 meses.

Planos e mensagens estão centralizados em `lib/site/plans.ts`. Todos os botões
abrem o WhatsApp **(82) 99431-0121**, com o plano selecionado na mensagem.
O usuário ainda precisa enviar a mensagem; contratação e atendimento são manuais.

## Desenvolvimento

```sh
npm run dev
npm run lint
npm run build
node --test tests/auth-infrastructure.test.mjs
```

## Firebase Google

Preserve a configuração do aplicativo Web existente no Firebase. Preencha os
campos de `.env.local` com os valores do Console → Configurações do projeto →
Seus aplicativos. Não inclua credenciais privadas nem Firebase Admin:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

`.env.local` está ignorado pela regra `.env*`. Reinicie o servidor após preencher
as variáveis; no deploy, configure-as no ambiente de build e gere uma nova versão.
O provedor Google deve permanecer habilitado e o domínio usado (incluindo
`localhost` em desenvolvimento) deve estar em Authentication → Settings →
Authorized domains.

Execute `npm run check:firebase` para identificar variáveis obrigatórias ausentes
ou vazias, sem imprimir seus valores. Habilitar Google no Console não preenche
automaticamente o `.env.local`. O botão só é habilitado após a configuração Web
estar presente e a verificação inicial da sessão terminar. `storageBucket` e
`messagingSenderId` não bloqueiam este fluxo de autenticação.

O Firebase é inicializado apenas no navegador, reutilizando `getApps`/`getAuth`.
`AuthProvider` observa a sessão com `onAuthStateChanged`, faz login com
`GoogleAuthProvider`/`signInWithPopup` e logout com `signOut`.
A persistência é explicitamente `browserLocalPersistence`; o estado inicial
de carregamento impede mostrar a tela de login antes de verificar a sessão.
Referência: [persistência de sessão Firebase](https://firebase.google.com/docs/auth/web/auth-state-persistence).

`SessionGate` controla as telas do frontend. Nenhum dado privado é exposto nesta
versão. Futuras APIs/Área do Cliente precisarão validar tokens no servidor antes
de fornecer dados privados; o controle visual atual não substitui essa validação.

## Verificação com uma conta real

Após configurar as variáveis:

1. Deslogado, abra `/` e confira a oferta antes do botão de login, especialmente
   no celular. Abrir `/inicio` diretamente deve retornar à oferta pública.
2. Entre com Google: deve abrir `/inicio` automaticamente, sem nova tela de login.
3. Recarregue e feche/reabra o navegador: a sessão deve ser restaurada enquanto
   válida; a tela promocional não deve aparecer durante a verificação.
4. Confira os quatro planos e os links do WhatsApp; cada mensagem deve trazer
   o plano e o preço corretos, sem envio automático.
5. Use Sair da conta: deve voltar à oferta pública e bloquear `/inicio`.
6. Cancele o popup e simule bloqueio/falha de rede; deve haver mensagem útil e
   opção de tentar novamente, sem cliques simultâneos.

Os testes locais usam o SDK simulado para verificar restauração, login, logout,
persistência, cleanup e URLs dos planos sem criar contas ou enviar mensagens.
